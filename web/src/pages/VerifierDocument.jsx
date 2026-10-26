/**
 * Vérification publique d'un document officiel (cible du QR code). Aucune connexion requise.
 */
import { useEffect, useState } from "react"
import { useParams, Link } from "react-router-dom"
import { FiCheckCircle, FiXCircle } from "react-icons/fi"
import { scolariteAPI } from "../services/api"
import { fmtDate } from "../components/mz/helpers"

export default function VerifierDocument() {
  const { code } = useParams()
  const [state, setState] = useState({ loading: true })
  useEffect(() => {
    scolariteAPI.verify(code).then(({ data }) => setState({ data })).catch((e) => setState({ data: e?.response?.data || { valid: false } }))
  }, [code])
  const d = state.data
  const row = (label, value) => value ? <div className="d-flex justify-content-between py-2" style={{ borderBottom: "1px solid var(--color-border)" }}><span style={{ color: "var(--color-textSecondary)" }}>{label}</span><strong>{value}</strong></div> : null
  return (
    <div style={{ minHeight: "100vh", background: "var(--color-bodyBg)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div className="mz-card" style={{ maxWidth: 520, width: "100%" }}>
        <div style={{ background: "var(--color-primary)", color: "#fff", padding: "18px 24px", borderRadius: "14px 14px 0 0" }}>
          <div style={{ fontSize: "0.8rem", opacity: 0.85 }}>Vérification de document officiel</div>
          <div style={{ fontSize: "1.2rem", fontWeight: 700 }}>{d?.institution || "Université MAZANZA"}</div>
        </div>
        <div className="mz-card-body">
          {state.loading ? <p>Vérification en cours…</p> : (
            <>
              <div className="d-flex align-items-center gap-2 mb-3" style={{ color: d?.valid ? "var(--color-success, #1A8754)" : "var(--color-danger, #B83232)" }}>
                {d?.valid ? <FiCheckCircle size={28} /> : <FiXCircle size={28} />}
                <strong style={{ fontSize: "1.1rem" }}>{d?.valid ? "Document authentique et valide" : d?.revoked ? "Document RÉVOQUÉ" : "Document introuvable"}</strong>
              </div>
              {d?.revoked && <p style={{ color: "var(--color-danger, #B83232)" }}>Motif : {d.revoked_reason}</p>}
              {d?.numero && (<>
                {row("Document", d.type_label)}{row("Numéro", d.numero)}{row("Titulaire", d.student_name)}{row("Matricule", d.matricule)}
                {row("Filière", d.filiere)}{row("Niveau", d.niveau)}{row("Année académique", d.annee)}{row("Décision", d.decision)}{row("Mention", d.mention)}
                {row("Émis le", fmtDate(d.issued_at))}
              </>)}
              {!d?.numero && <p style={{ color: "var(--color-textSecondary)" }}>Aucun document ne correspond à ce code. Vérifiez que vous avez scanné le QR code d'origine.</p>}
            </>
          )}
          <div className="mt-3"><Link to="/">Retour à l'accueil</Link></div>
        </div>
      </div>
    </div>
  )
}
