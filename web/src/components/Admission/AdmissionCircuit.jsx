/**
 * Circuit d'admission d'une candidature :
 *  1. Apparitorat — contrôle des pièces (conforme / à compléter)
 *  2. Caisse      — encaissement des frais de dossier
 *  3. Commission  — admis / liste d'attente / refusé
 *  4. Admis       — compte + matricule + inscription annuelle « en attente des frais »
 */
import { useState } from "react"
import { FiCheckCircle, FiCircle, FiClock } from "react-icons/fi"
import { admissionAPI } from "../../services/api"
import { hasAnyRole } from "../../utils/permissions"
import { ConfirmDialog, Pill } from "../mz/Kit"
import { errorMessage, fmtDate } from "../mz/helpers"

export default function AdmissionCircuit({ inscription, user, onChange, onMessage }) {
  const [ask, setAsk] = useState(null)
  const [ref, setRef] = useState("")
  const pending = inscription.status === "en_attente"
  const canCheck = hasAnyRole(user, "apparitorat", "sga", "pdg")
  const canCash = hasAnyRole(user, "caisse", "pdg")
  const run = async (fn, msg) => {
    try { const { data } = await fn(); onChange(data); onMessage({ ok: msg }) } catch (e) { onMessage({ error: errorMessage(e) }) }
  }
  const step = (done, active, title, body) => (
    <div className="d-flex gap-3 py-3" style={{ borderBottom: "1px solid var(--color-border)" }}>
      <div style={{ color: done ? "var(--color-primary)" : active ? "#C76A12" : "var(--color-textSecondary)", paddingTop: 2 }}>
        {done ? <FiCheckCircle size={20} /> : active ? <FiClock size={20} /> : <FiCircle size={20} />}
      </div>
      <div style={{ flex: 1 }}><div className="fw-semibold">{title}</div>{body}</div>
    </div>
  )
  const conforme = inscription.dossier_status === "conforme"
  return (
    <div className="mz-card mb-4"><div className="mz-card-body">
      <h5 className="fw-bold mb-1">Circuit d'admission</h5>
      <p style={{ color: "var(--color-textSecondary)", fontSize: "0.9rem" }}>Chaque étape est réalisée par le service compétent et tracée au journal d'audit.</p>
      {step(conforme, pending && !conforme, "1. Contrôle des pièces (apparitorat)", (
        <div>
          <Pill code={inscription.dossier_status}>{{ a_verifier: "À vérifier", conforme: "Conforme", a_completer: "À compléter" }[inscription.dossier_status] || "—"}</Pill>
          {inscription.dossier_comment && <div style={{ color: "var(--color-textSecondary)" }}>{inscription.dossier_comment}</div>}
          {inscription.dossier_verified_at && <div style={{ color: "var(--color-textSecondary)", fontSize: "0.8rem" }}>le {fmtDate(inscription.dossier_verified_at, true)}</div>}
          {pending && canCheck && (
            <div className="d-flex gap-2 mt-2">
              <button className="btn btn-primary btn-sm" onClick={() => run(() => admissionAPI.verifyDossier(inscription.id, "conforme", ""), "Dossier déclaré conforme.")}>Déclarer conforme</button>
              <button className="btn btn-outline-primary btn-sm" onClick={() => setAsk({ title: "Dossier à compléter", input: { label: "Pièces manquantes ou non conformes", required: true }, confirmLabel: "Enregistrer",
                onConfirm: (c) => run(() => admissionAPI.verifyDossier(inscription.id, "a_completer", c), "Le candidat doit compléter son dossier.") })}>À compléter…</button>
            </div>
          )}
          {inscription.niveau && inscription.niveau !== "L1" && (
            <div style={{ fontSize: "0.85rem", marginTop: 6 }}>Admission en {inscription.niveau} (transfert) — établissement d'origine : <strong>{inscription.etablissement_origine || "non renseigné"}</strong>
              {inscription.releve_notes_precedent && <> · <a href={inscription.releve_notes_precedent} target="_blank" rel="noreferrer">relevé de notes</a></>}</div>
          )}
        </div>
      ))}
      {step(inscription.frais_dossier_paye, pending && conforme && !inscription.frais_dossier_paye, "2. Frais de dossier (caisse)", (
        <div>
          {inscription.frais_dossier_paye ? <span style={{ color: "var(--color-textSecondary)" }}>Encaissés — reçu {inscription.frais_dossier_reference}</span>
            : <span style={{ color: "var(--color-textSecondary)" }}>Non encaissés.</span>}
          {pending && canCash && !inscription.frais_dossier_paye && (
            <div className="d-flex gap-2 mt-2">
              <input className="form-control form-control-sm" style={{ width: 220 }} placeholder="N° du reçu" value={ref} onChange={(e) => setRef(e.target.value)} />
              <button className="btn btn-primary btn-sm" disabled={!ref.trim()} onClick={() => run(() => admissionAPI.markFeePaid(inscription.id, ref), "Frais de dossier enregistrés.")}>Enregistrer l'encaissement</button>
            </div>
          )}
        </div>
      ))}
      {step(inscription.status !== "en_attente", pending && conforme, "3. Décision de la commission", (
        <div>
          <Pill code={inscription.commission_decision}>{{ en_attente: "En attente", admis: "Admis", liste_attente: "Liste d'attente", refuse: "Refusé" }[inscription.commission_decision] || "—"}</Pill>
          {inscription.commission_comment && <div style={{ color: "var(--color-textSecondary)" }}>{inscription.commission_comment}</div>}
          {pending && hasAnyRole(user, "sga", "pdg", "commission_admission") && inscription.commission_decision !== "liste_attente" && conforme && (
            <div className="mt-2"><button className="btn btn-outline-primary btn-sm" onClick={() => setAsk({ title: "Placer en liste d'attente", input: { label: "Commentaire", required: false }, confirmLabel: "Confirmer",
              onConfirm: (c) => run(() => admissionAPI.waitlist(inscription.id, c), "Candidat placé en liste d'attente.") })}>Liste d'attente</button></div>
          )}
        </div>
      ))}
      <ConfirmDialog ask={ask} onClose={() => setAsk(null)} />
    </div></div>
  )
}
