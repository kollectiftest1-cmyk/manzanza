/**
 * Délibérations : constitution du jury, ouverture (verrouille les notes), calcul LMD,
 * décisions du jury motivées, clôture (PV PDF scellé par empreinte SHA-256), publication
 * datée, préparation des réinscriptions de l'année suivante.
 */
import { useCallback, useEffect, useMemo, useState } from "react"
import { useSelector } from "react-redux"
import { Modal, Spinner } from "react-bootstrap"
import { FiPlus, FiPlay, FiRefreshCw, FiLock, FiSend, FiFileText, FiDownload, FiUsers, FiEdit2, FiArrowRight } from "react-icons/fi"
import { academicYearsAPI, auditoiresAPI, pilotageAPI, saveBlob, scolariteAPI, usersAPI } from "../services/api"
import { hasAnyRole } from "../utils/permissions"
import { ConfirmDialog, Empty, Field, Loading, PageHeader, Pill, Tabs } from "../components/mz/Kit"
import { fmtDate, listOf, useFeedback } from "../components/mz/helpers"

const STATUTS = [
  { key: "", label: "Toutes" }, { key: "preparation", label: "En préparation" }, { key: "ouverte", label: "Ouvertes" },
  { key: "cloturee", label: "Clôturées" }, { key: "publiee", label: "Publiées" },
]
const DECISIONS = [
  ["admis", "Admis"], ["admis_dette", "Admis avec dette"], ["ajourne", "Ajourné (2e session)"],
  ["redouble", "Redouble"], ["defaillant", "Défaillant"], ["exclu", "Exclu"],
]

export default function Deliberations() {
  const { user } = useSelector((s) => s.auth)
  const isSGA = hasAnyRole(user, "sga", "pdg")
  const fb = useFeedback()
  const [statut, setStatut] = useState("")
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [current, setCurrent] = useState(null)
  const [creating, setCreating] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try { const { data } = await scolariteAPI.deliberations(statut ? { statut, page_size: 200 } : { page_size: 200 }); setRows(listOf(data)) }
    catch (e) { fb.fail(e, "Chargement impossible.") } finally { setLoading(false) }
  }, [statut]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { load() }, [load])

  return (
    <div className="mz-page">
      <PageHeader title="Délibérations" subtitle="Le jury délibère sur des notes approuvées et verrouillées ; chaque décision différente du calcul est motivée et figure au procès-verbal.">
        {isSGA && <button className="btn btn-primary btn-sm px-3" onClick={() => setCreating(true)}><FiPlus className="me-1" /> Constituer un jury</button>}
      </PageHeader>
      {fb.banner}
      <div className="mz-card">
        <div className="mz-toolbar"><Tabs tabs={STATUTS} value={statut} onChange={setStatut} /></div>
        {loading ? <Loading /> : rows.length === 0 ? <Empty icon={FiUsers} title="Aucune délibération" /> : (
          <div className="mz-table-wrap"><table className="mz-table">
            <thead><tr><th>Groupe</th><th>Session</th><th>Jury</th><th>Statut</th><th>Résultats</th><th className="mz-actions"></th></tr></thead>
            <tbody>{rows.map((d) => (
              <tr key={d.id}>
                <td><div className="mz-strong">{d.auditoire_name}</div><div className="mz-muted">{d.academic_year_name}</div></td>
                <td>{d.session_label}</td>
                <td className="mz-muted"><div>Prés. {d.president_name}</div><div>Secr. {d.secretaire_name}</div></td>
                <td><Pill code={d.statut}>{d.statut_label}</Pill>{d.statut === "publiee" && d.publication_date && <div className="mz-muted">dès le {fmtDate(d.publication_date, true)}</div>}</td>
                <td className="mz-muted">{d.stats?.total ? <>{d.stats.total} étudiants · réussite {d.stats.taux_reussite} %</> : "—"}</td>
                <td className="mz-actions"><button className="mz-icon-btn mz-icon-btn--primary" onClick={() => setCurrent(d)}>Ouvrir <FiArrowRight /></button></td>
              </tr>))}</tbody>
          </table></div>
        )}
      </div>
      {creating && <CreateJury onClose={() => setCreating(false)} onDone={() => { setCreating(false); fb.ok("Jury constitué."); load() }} onError={fb.fail} />}
      {current && <DeliberationDetail delib={current} user={user} onClose={() => { setCurrent(null); load() }} />}
    </div>
  )
}

function CreateJury({ onClose, onDone, onError }) {
  const [auditoires, setAuditoires] = useState([])
  const [teachers, setTeachers] = useState([])
  const [form, setForm] = useState({ auditoire: "", session: 1, president: "", secretaire: "", membres: [] })
  useEffect(() => {
    auditoiresAPI.getAll({ page_size: 500 }).then(({ data }) => setAuditoires(listOf(data))).catch(() => {})
    usersAPI.getTeachers({ page_size: 500 }).then(({ data }) => setTeachers(listOf(data))).catch(() => {})
  }, [])
  const name = (t) => t.name || `${t.first_name} ${t.last_name}`
  const submit = async () => { try { await scolariteAPI.createDeliberation(form); onDone() } catch (e) { onError(e) } }
  return (
    <Modal show onHide={onClose} centered>
      <Modal.Header closeButton><Modal.Title style={{ fontSize: "1.05rem" }}>Constituer un jury</Modal.Title></Modal.Header>
      <Modal.Body>
        <Field label="Groupe"><select className="form-select" value={form.auditoire} onChange={(e) => setForm({ ...form, auditoire: e.target.value })}>
          <option value="">— Choisir —</option>{auditoires.map((a) => <option key={a.id} value={a.id}>{a.nom} · {a.annee_academique}</option>)}</select></Field>
        <Field label="Session"><select className="form-select" value={form.session} onChange={(e) => setForm({ ...form, session: Number(e.target.value) })}>
          <option value={1}>1re session</option><option value={2}>2e session (rattrapage)</option></select></Field>
        <Field label="Président"><select className="form-select" value={form.president} onChange={(e) => setForm({ ...form, president: e.target.value })}>
          <option value="">— Choisir —</option>{teachers.map((t) => <option key={t.id} value={t.id}>{name(t)}</option>)}</select></Field>
        <Field label="Secrétaire"><select className="form-select" value={form.secretaire} onChange={(e) => setForm({ ...form, secretaire: e.target.value })}>
          <option value="">— Choisir —</option>{teachers.filter((t) => String(t.id) !== String(form.president)).map((t) => <option key={t.id} value={t.id}>{name(t)}</option>)}</select></Field>
        <Field label="Membres" hint="Ctrl / Cmd + clic pour en choisir plusieurs.">
          <select multiple className="form-select" style={{ height: 140 }} value={form.membres.map(String)}
                  onChange={(e) => setForm({ ...form, membres: Array.from(e.target.selectedOptions).map((o) => Number(o.value)) })}>
            {teachers.map((t) => <option key={t.id} value={t.id}>{name(t)}</option>)}
          </select></Field>
      </Modal.Body>
      <Modal.Footer>
        <button className="btn btn-outline-primary btn-sm px-3" onClick={onClose}>Annuler</button>
        <button className="btn btn-primary btn-sm px-3" disabled={!form.auditoire || !form.president || !form.secretaire} onClick={submit}>Créer</button>
      </Modal.Footer>
    </Modal>
  )
}

function DeliberationDetail({ delib: initial, user, onClose }) {
  const fb = useFeedback()
  const [d, setD] = useState(initial)
  const [results, setResults] = useState(null)
  const [busy, setBusy] = useState(false)
  const [ask, setAsk] = useState(null)
  const [override, setOverride] = useState(null)
  const [publishAt, setPublishAt] = useState("")
  const [years, setYears] = useState([])
  const [nextYear, setNextYear] = useState("")
  const isSGA = hasAnyRole(user, "sga", "pdg")
  const isPresident = user?.id === d.president || isSGA
  const isMember = isSGA || [d.president, d.secretaire, ...(d.membres || [])].includes(user?.id)

  const loadResults = useCallback(async () => {
    try { const { data } = await scolariteAPI.deliberationResults(d.id); setResults(data) } catch { setResults([]) }
  }, [d.id])
  useEffect(() => { loadResults() }, [loadResults])
  useEffect(() => { academicYearsAPI.list().then(({ data }) => setYears(listOf(data))).catch(() => {}) }, [])

  const act = async (fn, msg) => {
    setBusy(true)
    try { const { data } = await fn(); if (data?.id) setD(data); fb.ok(msg); loadResults() }
    catch (e) {
      const missing = e?.response?.data?.courses
      if (missing && isSGA) {
        setAsk({ title: "Feuilles non approuvées", message: `${e.response.data.detail}. Ouvrir quand même ? (dérogation tracée)`, confirmLabel: "Ouvrir quand même",
          onConfirm: () => act(() => scolariteAPI.openDeliberation(d.id, true), "Délibération ouverte par dérogation.") })
      } else fb.fail(e)
    } finally { setBusy(false) }
  }

  const stats = useMemo(() => {
    const out = {}
    ;(results || []).forEach((r) => { out[r.decision] = (out[r.decision] || 0) + 1 })
    return out
  }, [results])

  return (
    <Modal show onHide={onClose} size="xl" centered scrollable>
      <Modal.Header closeButton>
        <Modal.Title style={{ fontSize: "1.05rem" }}>{d.auditoire_name} — {d.session_label} <Pill code={d.statut}>{d.statut_label}</Pill></Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {fb.banner}
        <div className="d-flex gap-2 flex-wrap mb-3 align-items-center">
          {d.statut === "preparation" && isPresident && <button className="btn btn-primary btn-sm" disabled={busy} onClick={() => setAsk({
            title: "Ouvrir la délibération", message: "Les feuilles de notes du groupe seront verrouillées et les résultats calculés.", confirmLabel: "Ouvrir",
            onConfirm: () => act(() => scolariteAPI.openDeliberation(d.id), "Délibération ouverte, résultats calculés.") })}><FiPlay className="me-1" />Ouvrir</button>}
          {d.statut === "ouverte" && isMember && <button className="btn btn-outline-primary btn-sm" disabled={busy} onClick={() => act(() => scolariteAPI.computeDeliberation(d.id), "Résultats recalculés.")}><FiRefreshCw className="me-1" />Recalculer</button>}
          {d.statut === "ouverte" && isPresident && <button className="btn btn-primary btn-sm" disabled={busy} onClick={() => setAsk({
            title: "Clôturer et signer le PV", message: "Le procès-verbal est généré et scellé (empreinte SHA-256). Les décisions ne pourront plus être modifiées.", confirmLabel: "Clôturer",
            onConfirm: () => act(() => scolariteAPI.closeDeliberation(d.id), "Délibération clôturée, PV généré.") })}><FiLock className="me-1" />Clôturer</button>}
          {d.statut === "cloturee" && isPresident && (
            <div className="d-flex gap-2 align-items-center">
              <input type="datetime-local" className="form-control form-control-sm" style={{ width: 210 }} value={publishAt} onChange={(e) => setPublishAt(e.target.value)} title="Vide = publication immédiate" />
              <button className="btn btn-primary btn-sm" disabled={busy} onClick={() => act(() => scolariteAPI.publishDeliberation(d.id, publishAt ? new Date(publishAt).toISOString() : null), "Résultats publiés : les étudiants sont notifiés.")}><FiSend className="me-1" />Publier</button>
            </div>
          )}
          {d.has_pv && <button className="btn btn-outline-primary btn-sm" onClick={async () => { try { saveBlob(await scolariteAPI.downloadPV(d.id), "PV.pdf") } catch (e) { fb.fail(e) } }}><FiFileText className="me-1" />PV (PDF)</button>}
          {results?.length > 0 && <button className="btn btn-outline-primary btn-sm" onClick={async () => { try { saveBlob(await pilotageAPI.exportCSV("resultats", { deliberation: d.id }), "resultats.csv") } catch (e) { fb.fail(e) } }}><FiDownload className="me-1" />CSV</button>}
          {d.statut === "publiee" && isSGA && (
            <div className="d-flex gap-2 align-items-center ms-auto">
              <select className="form-select form-select-sm" style={{ width: 150 }} value={nextYear} onChange={(e) => setNextYear(e.target.value)}>
                <option value="">Année suivante…</option>{years.map((y) => <option key={y.id} value={y.id}>{y.name}</option>)}
              </select>
              <button className="btn btn-outline-primary btn-sm" disabled={!nextYear || busy} onClick={async () => {
                try { const { data } = await scolariteAPI.prepareReinscriptions(d.id, nextYear)
                  fb.ok(`Réinscriptions préparées : ${data.passages} passage(s), ${data.redoublements} redoublement(s), ${data.diplomes} diplômé(s), ${data.ignores} ignoré(s).`) } catch (e) { fb.fail(e) }
              }}>Préparer les réinscriptions</button>
            </div>
          )}
        </div>
        {d.pv_sha256 && <div className="mz-muted mb-2" style={{ fontSize: "0.78rem", wordBreak: "break-all" }}>Empreinte du PV : {d.pv_sha256}</div>}
        <div className="d-flex gap-2 flex-wrap mb-3">
          {DECISIONS.filter(([k]) => stats[k]).map(([k, l]) => <Pill key={k} code={k}>{l} : {stats[k]}</Pill>)}
        </div>
        {results === null ? <div className="text-center py-4"><Spinner animation="border" /></div> : results.length === 0 ? (
          <Empty title="Pas encore de résultats">{d.statut === "preparation" ? "Ouvrez la délibération pour calculer les résultats." : ""}</Empty>
        ) : (
          <div className="mz-table-wrap"><table className="mz-table">
            <thead><tr><th>Rang</th><th>Étudiant</th><th>Moyenne</th><th>Crédits</th><th>Décision</th><th>Mention</th><th className="mz-actions"></th></tr></thead>
            <tbody>{results.map((r) => (
              <tr key={r.id}>
                <td>{r.rang}</td>
                <td><div className="mz-strong">{r.student_name}</div><div className="mz-muted">{r.matricule}</div></td>
                <td className="mz-strong">{r.moyenne}</td>
                <td>{r.credits_obtenus}/{r.credits_total}</td>
                <td><Pill code={r.decision}>{r.decision_label}</Pill>
                  {r.decision_modifiee && <div className="mz-muted" style={{ fontSize: "0.78rem" }}>Calcul : {r.decision_calculee_label} — {r.justification}</div>}</td>
                <td className="mz-muted">{r.mention_label !== "—" ? r.mention_label : ""}
                  {(r.details?.ues || []).some((u) => (u.cours || []).some((c) => c.non_admis_examen)) && <div><Pill tone="danger">Assiduité insuffisante</Pill></div>}</td>
                <td className="mz-actions">{d.statut === "ouverte" && isMember && <button className="mz-icon-btn" onClick={() => setOverride({ ...r, newDecision: r.decision, justification: "" })}><FiEdit2 /> Décision</button>}</td>
              </tr>))}</tbody>
          </table></div>
        )}
      </Modal.Body>
      <Modal.Footer><button className="btn btn-primary btn-sm px-3" onClick={onClose}>Fermer</button></Modal.Footer>
      <ConfirmDialog ask={ask} onClose={() => setAsk(null)} />
      {override && (
        <Modal show onHide={() => setOverride(null)} centered>
          <Modal.Header closeButton><Modal.Title style={{ fontSize: "1rem" }}>Décision du jury — {override.student_name}</Modal.Title></Modal.Header>
          <Modal.Body>
            <p className="mz-muted">Décision calculée : <strong>{override.decision_calculee_label}</strong> (moyenne {override.moyenne}, {override.credits_obtenus}/{override.credits_total} crédits).</p>
            <Field label="Décision"><select className="form-select" value={override.newDecision} onChange={(e) => setOverride({ ...override, newDecision: e.target.value })}>
              {DECISIONS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></Field>
            <Field label="Justification (obligatoire, figure au PV)"><textarea className="form-control" rows={3} value={override.justification} onChange={(e) => setOverride({ ...override, justification: e.target.value })} /></Field>
          </Modal.Body>
          <Modal.Footer>
            <button className="btn btn-outline-primary btn-sm" onClick={() => setOverride(null)}>Annuler</button>
            <button className="btn btn-primary btn-sm" disabled={!override.justification.trim()} onClick={async () => {
              try { await scolariteAPI.overrideResult(override.id, { decision: override.newDecision, justification: override.justification }); setOverride(null); fb.ok("Décision enregistrée."); loadResults() }
              catch (e) { fb.fail(e) }
            }}>Enregistrer</button>
          </Modal.Footer>
        </Modal>
      )}
    </Modal>
  )
}
