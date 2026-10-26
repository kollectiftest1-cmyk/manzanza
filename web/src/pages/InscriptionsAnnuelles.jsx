/**
 * Inscriptions annuelles — colonne vertébrale du parcours étudiant.
 * en attente (frais) → administrative (apparitorat / SGA) → pédagogique (SGA / chef de filière).
 */
import { useCallback, useEffect, useState } from "react"
import { useSelector } from "react-redux"
import { Modal } from "react-bootstrap"
import { FiSearch, FiCheck, FiBookOpen, FiPauseCircle, FiPlus, FiDownload, FiEye } from "react-icons/fi"
import { academicYearsAPI, auditoiresAPI, pilotageAPI, saveBlob, scolariteAPI, usersAPI } from "../services/api"
import { hasAnyRole } from "../utils/permissions"
import { ConfirmDialog, Empty, Field, Loading, PageHeader, Pill, Tabs } from "../components/mz/Kit"
import { fmtDate, listOf, useFeedback } from "../components/mz/helpers"

const STATUTS = [
  { key: "", label: "Toutes" },
  { key: "en_attente", label: "En attente" },
  { key: "administrative", label: "Administrative" },
  { key: "pedagogique", label: "Pédagogique" },
  { key: "suspendue", label: "Suspendues" },
  { key: "abandon", label: "Abandons" },
]

export default function InscriptionsAnnuelles() {
  const { user } = useSelector((s) => s.auth)
  const isSGA = hasAnyRole(user, "sga", "pdg")
  const canAdmin = hasAnyRole(user, "sga", "pdg", "apparitorat")
  const canPeda = hasAnyRole(user, "sga", "pdg", "chef_departement", "chef_section")
  const fb = useFeedback()

  const [years, setYears] = useState([])
  const [year, setYear] = useState("")
  const [statut, setStatut] = useState("")
  const [search, setSearch] = useState("")
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [detail, setDetail] = useState(null)
  const [ask, setAsk] = useState(null)
  const [creating, setCreating] = useState(null)

  useEffect(() => {
    academicYearsAPI.list().then(({ data }) => {
      const ys = listOf(data)
      setYears(ys)
      const cur = ys.find((y) => y.is_current) || ys[0]
      if (cur) setYear(String(cur.id))
    }).catch(() => {})
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page_size: 200 }
      if (year) params.academic_year = year
      if (statut) params.statut = statut
      if (search.trim()) params.search = search.trim()
      const { data } = await scolariteAPI.inscriptions(params)
      setRows(listOf(data))
    } catch (e) { fb.fail(e, "Chargement impossible.") } finally { setLoading(false) }
  }, [year, statut, search]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { const t = setTimeout(load, search ? 300 : 0); return () => clearTimeout(t) }, [load, search])

  const open = async (row) => {
    setDetail({ ...row, loading: true })
    try { const { data } = await scolariteAPI.inscription(row.id); setDetail(data) } catch { setDetail(row) }
  }

  const run = async (fn, msg) => {
    try { await fn(); fb.ok(msg); load(); if (detail) setDetail(null) } catch (e) { fb.fail(e) }
  }

  const exportCSV = async () => {
    try { saveBlob(await pilotageAPI.exportCSV("inscriptions", { academic_year: year }), "inscriptions.csv") }
    catch (e) { fb.fail(e, "Export impossible.") }
  }

  return (
    <div className="mz-page">
      <PageHeader title="Inscriptions annuelles"
                  subtitle="Chaque étudiant est inscrit une fois par année académique : les frais, les cours suivis et la délibération s'y rattachent.">
        <button className="btn btn-outline-primary btn-sm px-3" onClick={exportCSV}><FiDownload className="me-1" /> Export CSV</button>
        {isSGA && <button className="btn btn-primary btn-sm px-3" onClick={() => setCreating({})}><FiPlus className="me-1" /> Inscrire un étudiant</button>}
      </PageHeader>
      {fb.banner}

      <div className="mz-card">
        <div className="mz-toolbar">
          <Tabs tabs={STATUTS} value={statut} onChange={setStatut} />
          <div className="d-flex gap-2 flex-wrap">
            <select className="form-select form-select-sm" style={{ width: 150 }} value={year} onChange={(e) => setYear(e.target.value)}>
              {years.map((y) => <option key={y.id} value={y.id}>{y.name}</option>)}
            </select>
            <div className="mz-search"><FiSearch size={15} />
              <input placeholder="Nom, matricule…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>
        </div>
        {loading ? <Loading /> : rows.length === 0 ? (
          <Empty title="Aucune inscription">Aucune inscription ne correspond à ces critères.</Empty>
        ) : (
          <div className="mz-table-wrap">
            <table className="mz-table">
              <thead><tr><th>Étudiant</th><th>Groupe</th><th>Type</th><th>Statut</th><th>Créée le</th><th className="mz-actions">Actions</th></tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td><div className="mz-strong">{r.student_name}</div><div className="mz-muted">{r.matricule || "—"}</div></td>
                    <td><div>{r.auditoire_name}</div><div className="mz-muted">{r.filiere_name} · {r.niveau}</div></td>
                    <td className="mz-muted">{r.type_label}{r.decision_precedente && <div>Décision : {r.decision_precedente}</div>}</td>
                    <td><Pill code={r.statut}>{r.statut_label}</Pill></td>
                    <td className="mz-muted">{fmtDate(r.created_at)}</td>
                    <td className="mz-actions">
                      <button className="mz-icon-btn" title="Détail" onClick={() => open(r)}><FiEye /></button>
                      {r.statut === "en_attente" && canAdmin && (
                        <button className="mz-icon-btn mz-icon-btn--primary" onClick={() => run(() => scolariteAPI.validateAdmin(r.id), "Inscription administrative validée.")}>
                          <FiCheck /> Administrative
                        </button>
                      )}
                      {r.statut === "administrative" && canPeda && (
                        <button className="mz-icon-btn mz-icon-btn--primary" onClick={() => run(() => scolariteAPI.validatePeda(r.id), "Inscription pédagogique validée : l'étudiant est inscrit à ses cours.")}>
                          <FiBookOpen /> Pédagogique
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal show={!!detail} onHide={() => setDetail(null)} size="lg" centered>
        <Modal.Header closeButton><Modal.Title style={{ fontSize: "1.05rem" }}>{detail?.student_name} — {detail?.academic_year_name}</Modal.Title></Modal.Header>
        <Modal.Body>
          {detail && (
            <>
              <div className="d-flex gap-2 flex-wrap mb-3">
                <Pill code={detail.statut}>{detail.statut_label}</Pill>
                <span className="mz-pill">{detail.type_label}</span>
                <span className="mz-pill">{detail.auditoire_name}</span>
              </div>
              {detail.finance && (
                <div className="mz-card mb-3"><div className="mz-card-body d-flex gap-4 flex-wrap">
                  <div><div className="mz-muted">Frais obligatoires réglés</div><div className="mz-kpi-value" style={{ fontSize: "1.4rem" }}>{detail.finance.paid_percent} %</div></div>
                  <div><div className="mz-muted">Frais d'inscription</div><Pill code={detail.finance.admin_fees_settled ? "paye" : "impaye"}>{detail.finance.admin_fees_settled ? "Réglés" : "Non réglés"}</Pill></div>
                  <div><div className="mz-muted">Accès examens / résultats</div><Pill code={detail.finance.cleared ? "valid" : "annule"}>{detail.finance.cleared ? "En règle" : "Bloqué"}</Pill></div>
                </div></div>
              )}
              <h6 className="fw-semibold">Unités d'enseignement ({detail.ues?.length || 0})</h6>
              {detail.ues?.length ? (
                <table className="mz-table mb-3"><thead><tr><th>UE</th><th>Crédits</th><th></th></tr></thead><tbody>
                  {detail.ues.map((u) => <tr key={u.id}><td>{u.ue_code} — {u.ue_intitule}</td><td>{u.credits}</td><td>{u.is_dette && <Pill tone="warning">Dette</Pill>}</td></tr>)}
                </tbody></table>
              ) : <p className="mz-muted">Aucune UE définie pour ce niveau (les cours du groupe sont suivis directement).</p>}
              {detail.notes && <pre className="mz-muted" style={{ whiteSpace: "pre-wrap", fontFamily: "inherit" }}>{detail.notes}</pre>}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          {isSGA && detail && ["en_attente", "administrative", "pedagogique"].includes(detail.statut) && (
            <>
              {detail.statut === "en_attente" && (
                <button className="btn btn-outline-primary btn-sm" onClick={() => setAsk({
                  title: "Forcer la validation administrative", message: "Les frais requis ne sont pas réglés. Cette dérogation est tracée.",
                  confirmLabel: "Forcer", onConfirm: () => run(() => scolariteAPI.validateAdmin(detail.id, true), "Validation administrative accordée par dérogation."),
                })}>Dérogation SGA</button>
              )}
              <button className="btn btn-outline-danger btn-sm" onClick={() => setAsk({
                title: "Suspendre l'inscription", input: { label: "Motif", required: true }, danger: true, confirmLabel: "Suspendre",
                onConfirm: (reason) => run(() => scolariteAPI.changeStatus(detail.id, "suspendue", reason), "Inscription suspendue."),
              })}><FiPauseCircle className="me-1" />Suspendre</button>
              <button className="btn btn-outline-danger btn-sm" onClick={() => setAsk({
                title: "Enregistrer un abandon", input: { label: "Motif", required: true }, danger: true, confirmLabel: "Enregistrer",
                onConfirm: (reason) => run(() => scolariteAPI.changeStatus(detail.id, "abandon", reason), "Abandon enregistré."),
              })}>Abandon</button>
            </>
          )}
          <button className="btn btn-primary btn-sm px-3" onClick={() => setDetail(null)}>Fermer</button>
        </Modal.Footer>
      </Modal>

      {creating && <CreateInscription onClose={() => setCreating(null)} onDone={(msg) => { fb.ok(msg); setCreating(null); load() }} onError={fb.fail} />}
      <ConfirmDialog ask={ask} onClose={() => setAsk(null)} />
    </div>
  )
}

function CreateInscription({ onClose, onDone, onError }) {
  const [students, setStudents] = useState([])
  const [auditoires, setAuditoires] = useState([])
  const [form, setForm] = useState({ student: "", auditoire: "", type_inscription: "reinscription" })
  const [q, setQ] = useState("")
  useEffect(() => { auditoiresAPI.getAll({ page_size: 500 }).then(({ data }) => setAuditoires(listOf(data))).catch(() => {}) }, [])
  useEffect(() => {
    const t = setTimeout(() => usersAPI.getStudents({ search: q, page_size: 50 }).then(({ data }) => setStudents(listOf(data))).catch(() => {}), 250)
    return () => clearTimeout(t)
  }, [q])
  const submit = async () => {
    try { await scolariteAPI.createInscription(form); onDone("Inscription annuelle créée : les frais de l'année ont été facturés.") }
    catch (e) { onError(e) }
  }
  return (
    <Modal show onHide={onClose} centered>
      <Modal.Header closeButton><Modal.Title style={{ fontSize: "1.05rem" }}>Inscrire un étudiant</Modal.Title></Modal.Header>
      <Modal.Body>
        <Field label="Étudiant">
          <input className="form-control mb-2" placeholder="Rechercher…" value={q} onChange={(e) => setQ(e.target.value)} />
          <select className="form-select" value={form.student} onChange={(e) => setForm({ ...form, student: e.target.value })}>
            <option value="">— Choisir —</option>
            {students.map((s) => <option key={s.id} value={s.id}>{s.name || `${s.first_name} ${s.last_name}`} {s.matricule ? `(${s.matricule})` : ""}</option>)}
          </select>
        </Field>
        <Field label="Groupe (auditoire)">
          <select className="form-select" value={form.auditoire} onChange={(e) => setForm({ ...form, auditoire: e.target.value })}>
            <option value="">— Choisir —</option>
            {auditoires.map((a) => <option key={a.id} value={a.id}>{a.nom} · {a.annee_academique}</option>)}
          </select>
        </Field>
        <Field label="Type">
          <select className="form-select" value={form.type_inscription} onChange={(e) => setForm({ ...form, type_inscription: e.target.value })}>
            <option value="nouvelle">Première inscription</option>
            <option value="reinscription">Réinscription (passage)</option>
            <option value="redoublement">Redoublement</option>
            <option value="transfert">Transfert / équivalence</option>
          </select>
        </Field>
        <div className="form-text">Les montants dus sont facturés automatiquement selon les barèmes de l'année (USD / CDF).</div>
      </Modal.Body>
      <Modal.Footer>
        <button className="btn btn-outline-primary btn-sm px-3" onClick={onClose}>Annuler</button>
        <button className="btn btn-primary btn-sm px-3" disabled={!form.student || !form.auditoire} onClick={submit}>Inscrire</button>
      </Modal.Footer>
    </Modal>
  )
}
