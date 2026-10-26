/**
 * Circuit de validation des notes.
 * Enseignant : saisit (brouillon) puis soumet sa feuille. Chef de filière / section / SGA :
 * approuve ou renvoie avec motif. Après soumission, toute modification passe par une
 * demande de correction tracée, tranchée par le chef / SGA.
 */
import { useCallback, useEffect, useState } from "react"
import { useSelector } from "react-redux"
import { Link } from "react-router-dom"
import { FiCheck, FiCornerUpLeft, FiSend, FiEdit3 } from "react-icons/fi"
import { gradeWorkflowAPI } from "../services/api"
import { hasAnyRole } from "../utils/permissions"
import { ConfirmDialog, Empty, Loading, PageHeader, Pill, Tabs } from "../components/mz/Kit"
import { fmtDate, listOf, useFeedback } from "../components/mz/helpers"

const STATUS_TABS = [
  { key: "", label: "Toutes" },
  { key: "draft", label: "Brouillons" },
  { key: "submitted", label: "À approuver" },
  { key: "approved", label: "Approuvées" },
  { key: "locked", label: "Verrouillées" },
]

export default function ValidationNotes() {
  const { user } = useSelector((s) => s.auth)
  const isTeacher = ["enseignant", "assistant"].includes(user?.role)
  const isApprover = hasAnyRole(user, "sga", "pdg", "chef_departement", "chef_section")
  const fb = useFeedback()
  const [view, setView] = useState(isApprover ? "sheets" : "mine")
  const [session, setSession] = useState(1)
  const [status, setStatus] = useState(isApprover ? "submitted" : "")
  const [sheets, setSheets] = useState([])
  const [corrections, setCorrections] = useState([])
  const [loading, setLoading] = useState(true)
  const [ask, setAsk] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      if (view === "corrections") {
        const { data } = await gradeWorkflowAPI.corrections({ page_size: 200 })
        setCorrections(listOf(data))
      } else if (view === "mine") {
        const { data } = await gradeWorkflowAPI.mySheets(session)
        setSheets(listOf(data).filter((s) => !status || s.status === status))
      } else {
        const params = { session, page_size: 300 }
        if (status) params.status = status
        const { data } = await gradeWorkflowAPI.sheets(params)
        setSheets(listOf(data))
      }
    } catch (e) { fb.fail(e, "Chargement impossible.") } finally { setLoading(false) }
  }, [view, session, status]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { load() }, [load])

  const run = async (fn, msg) => { try { await fn(); fb.ok(msg); load() } catch (e) { fb.fail(e) } }

  const views = [
    ...(isTeacher || hasAnyRole(user, "chef_departement", "chef_section") ? [{ key: "mine", label: "Mes feuilles" }] : []),
    ...(isApprover ? [{ key: "sheets", label: "Feuilles à valider" }] : []),
    { key: "corrections", label: "Demandes de correction" },
  ]

  return (
    <div className="mz-page">
      <PageHeader title="Validation des notes"
                  subtitle="Saisie → soumission → approbation → verrouillage à l'ouverture de la délibération. Les notes ne sont visibles des étudiants qu'une fois la feuille approuvée." />
      {fb.banner}
      <div className="mb-3"><Tabs tabs={views} value={view} onChange={(v) => { setView(v); setStatus(v === "sheets" ? "submitted" : "") }} /></div>

      <div className="mz-card">
        {view !== "corrections" && (
          <div className="mz-toolbar">
            <Tabs tabs={STATUS_TABS} value={status} onChange={setStatus} />
            <select className="form-select form-select-sm" style={{ width: 170 }} value={session} onChange={(e) => setSession(Number(e.target.value))}>
              <option value={1}>1re session</option><option value={2}>2e session (rattrapage)</option>
            </select>
          </div>
        )}
        {loading ? <Loading /> : view === "corrections" ? (
          corrections.length === 0 ? <Empty title="Aucune demande de correction" /> : (
            <div className="mz-table-wrap"><table className="mz-table">
              <thead><tr><th>Étudiant</th><th>Cours</th><th>Ancienne</th><th>Nouvelle</th><th>Motif</th><th>Statut</th><th className="mz-actions"></th></tr></thead>
              <tbody>{corrections.map((c) => (
                <tr key={c.id}>
                  <td className="mz-strong">{c.student_name}</td>
                  <td><div>{c.course_name}</div><div className="mz-muted">{c.label} · demandé par {c.requested_by_name} le {fmtDate(c.requested_at)}</div></td>
                  <td>{c.old_value}</td><td className="mz-strong">{c.new_value}</td>
                  <td className="mz-muted" style={{ maxWidth: 260 }}>{c.reason}{c.decision_note && <div>Décision : {c.decision_note}</div>}</td>
                  <td><Pill code={c.status}>{c.status_display}</Pill></td>
                  <td className="mz-actions">{c.status === "pending" && isApprover && (<>
                    <button className="mz-icon-btn mz-icon-btn--primary" onClick={() => run(() => gradeWorkflowAPI.decideCorrection(c.id, true, ""), "Correction appliquée.")}><FiCheck /> Accepter</button>
                    <button className="mz-icon-btn" onClick={() => setAsk({ title: "Refuser la correction", input: { label: "Motif", required: true }, danger: true, confirmLabel: "Refuser",
                      onConfirm: (note) => run(() => gradeWorkflowAPI.decideCorrection(c.id, false, note), "Correction refusée.") })}>Refuser</button>
                  </>)}</td>
                </tr>))}</tbody>
            </table></div>
          )
        ) : sheets.length === 0 ? <Empty title="Aucune feuille de notes">Rien à traiter pour ces critères.</Empty> : (
          <div className="mz-table-wrap"><table className="mz-table">
            <thead><tr><th>Cours</th><th>Groupe</th><th>Titulaire</th><th>Notes</th><th>Statut</th><th>Suivi</th><th className="mz-actions">Actions</th></tr></thead>
            <tbody>{sheets.map((s) => (
              <tr key={s.id}>
                <td><div className="mz-strong">{s.course_name}</div><div className="mz-muted">{s.course_code} · session {s.session}</div></td>
                <td className="mz-muted">{s.auditoire_name || "—"}</td>
                <td className="mz-muted">{s.titulaire_name || "—"}</td>
                <td>{s.grades_count}</td>
                <td><Pill code={s.status}>{s.status_display}</Pill></td>
                <td className="mz-muted" style={{ fontSize: "0.8rem" }}>
                  {s.submitted_at && <div>Soumise le {fmtDate(s.submitted_at)}{s.submitted_by_name && ` par ${s.submitted_by_name}`}</div>}
                  {s.approved_at && <div>Approuvée le {fmtDate(s.approved_at)}{s.approved_by_name && ` par ${s.approved_by_name}`}</div>}
                  {s.return_reason && s.status === "draft" && <div style={{ color: "var(--color-danger)" }}>Renvoyée : {s.return_reason}</div>}
                </td>
                <td className="mz-actions">
                  {s.status === "draft" && (<>
                    <Link className="mz-icon-btn" to={`/courses/${s.course}/assessments`}><FiEdit3 /> Saisir</Link>
                    <button className="mz-icon-btn mz-icon-btn--primary" disabled={!s.grades_count} onClick={() => setAsk({
                      title: "Soumettre la feuille", message: "Après soumission, vous ne pourrez plus modifier les notes : toute correction passera par une demande tracée.",
                      confirmLabel: "Soumettre", onConfirm: () => run(() => gradeWorkflowAPI.submit(s.id), "Feuille soumise pour approbation."),
                    })}><FiSend /> Soumettre</button>
                  </>)}
                  {s.status === "submitted" && isApprover && (<>
                    <button className="mz-icon-btn mz-icon-btn--primary" onClick={() => run(() => gradeWorkflowAPI.approve(s.id), "Feuille approuvée : les notes sont publiées aux étudiants.")}><FiCheck /> Approuver</button>
                    <button className="mz-icon-btn" onClick={() => setAsk({ title: "Renvoyer en brouillon", input: { label: "Motif communiqué à l'enseignant", required: true }, confirmLabel: "Renvoyer",
                      onConfirm: (reason) => run(() => gradeWorkflowAPI.sendBack(s.id, reason), "Feuille renvoyée à l'enseignant.") })}><FiCornerUpLeft /> Renvoyer</button>
                  </>)}
                  {s.status === "approved" && isApprover && (
                    <button className="mz-icon-btn" onClick={() => setAsk({ title: "Rouvrir la feuille", input: { label: "Motif", required: true }, confirmLabel: "Rouvrir",
                      onConfirm: (reason) => run(() => gradeWorkflowAPI.sendBack(s.id, reason), "Feuille rouverte.") })}><FiCornerUpLeft /> Rouvrir</button>
                  )}
                </td>
              </tr>))}</tbody>
          </table></div>
        )}
      </div>
      <ConfirmDialog ask={ask} onClose={() => setAsk(null)} />
    </div>
  )
}
