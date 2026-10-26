/**
 * Espace étudiant : inscriptions, situation financière, résultats publiés, documents.
 */
import { useEffect, useState } from "react"
import { FiAward, FiDownload, FiAlertTriangle } from "react-icons/fi"
import { saveBlob, scolariteAPI } from "../services/api"
import { Empty, Kpi, Loading, PageHeader, Pill } from "../components/mz/Kit"
import { fmtDate, fmtMoney, listOf, useFeedback } from "../components/mz/helpers"

export default function MesResultats() {
  const fb = useFeedback()
  const [results, setResults] = useState(null)
  const [clearance, setClearance] = useState(null)
  const [inscriptions, setInscriptions] = useState([])
  const [documents, setDocuments] = useState([])
  const [open, setOpen] = useState(null)
  useEffect(() => {
    scolariteAPI.myResults().then(({ data }) => setResults(data)).catch(() => setResults([]))
    scolariteAPI.myClearance().then(({ data }) => setClearance(data)).catch(() => {})
    scolariteAPI.myInscriptions().then(({ data }) => setInscriptions(listOf(data))).catch(() => {})
    scolariteAPI.documents().then(({ data }) => setDocuments(listOf(data))).catch(() => {})
  }, [])
  const current = inscriptions[0]
  return (
    <div className="mz-page">
      <PageHeader title="Mes résultats" subtitle="Résultats officiels des délibérations, publiés par le jury." />
      {fb.banner}
      <div className="mz-kpis">
        <Kpi label="Inscription en cours" value={current ? current.niveau : "—"} hint={current ? `${current.auditoire_name} · ${current.statut_label}` : "Aucune inscription"} />
        <Kpi label="Frais obligatoires réglés" value={clearance ? `${clearance.paid_percent} %` : "—"} hint={clearance ? `Minimum requis : ${clearance.required_percent} %` : ""}
             tone={clearance && !clearance.cleared ? "danger" : undefined} />
        <Kpi label="Accès examens & résultats" value={clearance ? (clearance.cleared ? "En règle" : "Bloqué") : "—"} />
      </div>
      {clearance && !clearance.cleared && (
        <div className="mz-banner mz-banner--error mb-3"><FiAlertTriangle size={18} />
          <span>Votre situation financière ne permet pas encore l'accès aux examens ni la consultation détaillée des résultats.
            {clearance.overdue?.length > 0 && <> Échéances dépassées : {clearance.overdue.map((o) => `${o.notes || "frais"} (${fmtMoney(o.total_amount - o.amount_paid, o.currency)}, ${fmtDate(o.due_date)})`).join(" ; ")}.</>}</span></div>
      )}
      <div className="mz-card mb-3">
        {results === null ? <Loading /> : results.length === 0 ? <Empty icon={FiAward} title="Aucun résultat publié">Vos résultats apparaîtront ici dès leur publication par le jury.</Empty> : (
          <div className="mz-table-wrap"><table className="mz-table">
            <thead><tr><th>Année</th><th>Groupe</th><th>Session</th><th>Moyenne</th><th>Crédits</th><th>Décision</th><th>Mention</th><th></th></tr></thead>
            <tbody>{results.map((r) => (
              <tr key={r.id}>
                <td>{r.annee}</td><td>{r.auditoire_name}</td><td>{r.session_label}</td>
                <td className="mz-strong">{r.moyenne ?? "—"}{r.moyenne != null && " /20"}</td>
                <td>{r.credits_obtenus != null ? `${r.credits_obtenus}/${r.credits_total}` : "—"}</td>
                <td>{r.blocked ? <Pill tone="danger">{r.decision_label}</Pill> : <Pill code={r.decision}>{r.decision_label}</Pill>}</td>
                <td className="mz-muted">{r.mention_label && r.mention_label !== "—" ? r.mention_label : ""}</td>
                <td className="mz-actions">{!r.blocked && r.details?.ues?.length > 0 && <button className="mz-icon-btn" onClick={() => setOpen(open === r.id ? null : r.id)}>{open === r.id ? "Masquer" : "Détail"}</button>}</td>
              </tr>))}</tbody>
          </table></div>
        )}
        {results?.filter((r) => r.id === open).map((r) => (
          <div key={r.id} className="mz-card-body" style={{ borderTop: "1px solid var(--color-border)" }}>
            <table className="mz-table"><thead><tr><th>UE / cours</th><th>Crédits</th><th>Note /20</th><th>Résultat</th></tr></thead><tbody>
              {r.details.ues.map((u) => [
                <tr key={u.ue_code}><td className="mz-strong">{u.ue_code} — {u.intitule}</td><td>{u.credits}</td><td className="mz-strong">{u.note ?? "—"}</td>
                  <td><Pill code={u.validee ? "valid" : "annule"}>{u.compensee ? "Compensée" : u.validee ? "Validée" : "Non validée"}</Pill></td></tr>,
                ...(u.cours || []).map((c) => <tr key={`${u.ue_code}-${c.course_id}`}><td className="mz-muted" style={{ paddingLeft: 32 }}>{c.intitule}</td><td className="mz-muted">{c.credits}</td><td className="mz-muted">{c.note ?? (c.manquante ? "manquante" : "—")}</td><td className="mz-muted">{c.assiduite != null && `Présence ${c.assiduite} %`}{c.non_admis_examen && <> · <Pill tone="danger">Non admis à l'examen</Pill></>}</td></tr>),
              ])}
            </tbody></table>
          </div>
        ))}
      </div>
      {documents.length > 0 && (
        <div className="mz-card"><div className="mz-toolbar"><strong>Mes documents officiels</strong></div>
          <div className="mz-table-wrap"><table className="mz-table"><tbody>{documents.map((d) => (
            <tr key={d.id}><td className="mz-strong">{d.type_label}</td><td className="mz-muted">{d.numero}</td><td className="mz-muted">{fmtDate(d.issued_at)}</td>
              <td className="mz-actions"><button className="mz-icon-btn" onClick={async () => { try { saveBlob(await scolariteAPI.downloadDocument(d.id), `${d.numero}.pdf`) } catch (e) { fb.fail(e) } }}><FiDownload /> PDF</button></td></tr>
          ))}</tbody></table></div></div>
      )}
    </div>
  )
}
