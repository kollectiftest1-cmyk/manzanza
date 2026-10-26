/**
 * Documents officiels : relevés de notes, attestations, diplômes.
 * Numérotés, figés au moment de l'émission, vérifiables par QR code, révocables (jamais supprimés).
 */
import { useCallback, useEffect, useState } from "react"
import { useSelector } from "react-redux"
import { Modal } from "react-bootstrap"
import { FiDownload, FiPlus, FiSearch, FiSlash, FiExternalLink } from "react-icons/fi"
import { saveBlob, scolariteAPI } from "../services/api"
import { hasAnyRole } from "../utils/permissions"
import { ConfirmDialog, Empty, Field, Loading, PageHeader, Pill, Tabs } from "../components/mz/Kit"
import { fmtDate, listOf, useFeedback } from "../components/mz/helpers"

const TYPES = [
  { key: "", label: "Tous" }, { key: "releve", label: "Relevés" }, { key: "attestation_inscription", label: "Attestations d'inscription" },
  { key: "attestation_reussite", label: "Attestations de réussite" }, { key: "diplome", label: "Diplômes" },
]

export default function DocumentsOfficiels() {
  const { user } = useSelector((s) => s.auth)
  const isSGA = hasAnyRole(user, "sga", "pdg")
  const fb = useFeedback()
  const [type, setType] = useState("")
  const [search, setSearch] = useState("")
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [issuing, setIssuing] = useState(false)
  const [ask, setAsk] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page_size: 200 }
      if (type) params.type_document = type
      if (search.trim()) params.search = search.trim()
      const { data } = await scolariteAPI.documents(params); setRows(listOf(data))
    } catch (e) { fb.fail(e) } finally { setLoading(false) }
  }, [type, search]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { const t = setTimeout(load, search ? 300 : 0); return () => clearTimeout(t) }, [load, search])

  return (
    <div className="mz-page">
      <PageHeader title="Documents officiels" subtitle="Chaque document porte un numéro unique et un QR code de vérification publique. Une erreur se corrige par révocation puis nouvelle émission.">
        <button className="btn btn-primary btn-sm px-3" onClick={() => setIssuing(true)}><FiPlus className="me-1" />Émettre un document</button>
      </PageHeader>
      {fb.banner}
      <div className="mz-card">
        <div className="mz-toolbar"><Tabs tabs={TYPES} value={type} onChange={setType} />
          <div className="mz-search"><FiSearch size={15} /><input placeholder="Numéro, nom, matricule…" value={search} onChange={(e) => setSearch(e.target.value)} /></div></div>
        {loading ? <Loading /> : rows.length === 0 ? <Empty title="Aucun document émis" /> : (
          <div className="mz-table-wrap"><table className="mz-table">
            <thead><tr><th>Numéro</th><th>Type</th><th>Étudiant</th><th>Émis le</th><th>Statut</th><th className="mz-actions"></th></tr></thead>
            <tbody>{rows.map((d) => (
              <tr key={d.id}>
                <td className="mz-strong">{d.numero}</td><td>{d.type_label}</td>
                <td><div>{d.student_name}</div><div className="mz-muted">{d.matricule}</div></td>
                <td className="mz-muted">{fmtDate(d.issued_at, true)}<div>par {d.issued_by_name || "—"}</div></td>
                <td>{d.revoked ? <><Pill code="revoked">Révoqué</Pill><div className="mz-muted">{d.revoked_reason}</div></> : <Pill code="valid">Valide</Pill>}</td>
                <td className="mz-actions">
                  <a className="mz-icon-btn" href={`/verifier/${d.verification_code}`} target="_blank" rel="noreferrer" title="Page de vérification"><FiExternalLink /></a>
                  <button className="mz-icon-btn" onClick={async () => { try { saveBlob(await scolariteAPI.downloadDocument(d.id), `${d.numero}.pdf`) } catch (e) { fb.fail(e) } }}><FiDownload /> PDF</button>
                  {isSGA && !d.revoked && <button className="mz-icon-btn" onClick={() => setAsk({ title: `Révoquer ${d.numero}`, message: "La vérification publique indiquera que ce document n'est plus valide.", input: { label: "Motif", required: true }, danger: true, confirmLabel: "Révoquer",
                    onConfirm: async (r) => { try { await scolariteAPI.revokeDocument(d.id, r); fb.ok("Document révoqué."); load() } catch (e) { fb.fail(e) } } })}><FiSlash /> Révoquer</button>}
                </td>
              </tr>))}</tbody>
          </table></div>
        )}
      </div>
      {issuing && <IssueDocument isSGA={isSGA} onClose={() => setIssuing(false)} onDone={(doc) => { setIssuing(false); fb.ok(`Document ${doc.numero} émis.`); load() }} onError={fb.fail} />}
      <ConfirmDialog ask={ask} onClose={() => setAsk(null)} />
    </div>
  )
}

function IssueDocument({ isSGA, onClose, onDone, onError }) {
  const [type, setType] = useState("releve")
  const [q, setQ] = useState("")
  const [options, setOptions] = useState([])
  const [target, setTarget] = useState("")
  const [ignore, setIgnore] = useState(false)
  const byInscription = type === "attestation_inscription"
  useEffect(() => {
    const t = setTimeout(async () => {
      try {
        if (byInscription) {
          const { data } = await scolariteAPI.inscriptions({ search: q, page_size: 50 })
          setOptions(listOf(data).filter((i) => ["administrative", "pedagogique"].includes(i.statut))
            .map((i) => ({ id: i.id, label: `${i.student_name} (${i.matricule || "—"}) — ${i.auditoire_name} ${i.academic_year_name}` })))
        } else {
          const delibs = listOf((await scolariteAPI.deliberations({ page_size: 100 })).data).filter((d) => ["cloturee", "publiee"].includes(d.statut))
          const all = []
          for (const d of delibs.slice(0, 20)) {
            const { data } = await scolariteAPI.deliberationResults(d.id)
            data.filter((r) => !q || `${r.student_name} ${r.matricule}`.toLowerCase().includes(q.toLowerCase()))
              .forEach((r) => all.push({ id: r.id, label: `${r.student_name} (${r.matricule || "—"}) — ${d.auditoire_name}, ${d.session_label} : ${r.decision_label}` }))
          }
          setOptions(all)
        }
      } catch { setOptions([]) }
    }, 300)
    return () => clearTimeout(t)
  }, [q, byInscription])
  const submit = async () => {
    try {
      const payload = { type_document: type, ignore_clearance: ignore, [byInscription ? "inscription" : "resultat"]: target }
      const { data } = await scolariteAPI.issueDocument(payload); onDone(data)
    } catch (e) { onError(e) }
  }
  return (
    <Modal show onHide={onClose} centered size="lg">
      <Modal.Header closeButton><Modal.Title style={{ fontSize: "1.05rem" }}>Émettre un document officiel</Modal.Title></Modal.Header>
      <Modal.Body>
        <Field label="Type"><select className="form-select" value={type} onChange={(e) => { setType(e.target.value); setTarget("") }}>
          <option value="releve">Relevé de notes</option><option value="attestation_inscription">Attestation d'inscription</option>
          <option value="attestation_reussite">Attestation de réussite</option>{isSGA && <option value="diplome">Diplôme (fin de cycle)</option>}</select></Field>
        <Field label={byInscription ? "Inscription annuelle" : "Résultat de délibération (clôturée)"}>
          <input className="form-control mb-2" placeholder="Rechercher un étudiant…" value={q} onChange={(e) => setQ(e.target.value)} />
          <select className="form-select" size={6} value={target} onChange={(e) => setTarget(e.target.value)}>
            {options.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
          </select>
        </Field>
        {isSGA && <div className="form-check"><input id="ig" type="checkbox" className="form-check-input" checked={ignore} onChange={(e) => setIgnore(e.target.checked)} />
          <label htmlFor="ig" className="form-check-label">Émettre malgré une situation financière irrégulière (dérogation tracée)</label></div>}
      </Modal.Body>
      <Modal.Footer>
        <button className="btn btn-outline-primary btn-sm" onClick={onClose}>Annuler</button>
        <button className="btn btn-primary btn-sm" disabled={!target} onClick={submit}>Émettre</button>
      </Modal.Footer>
    </Modal>
  )
}
