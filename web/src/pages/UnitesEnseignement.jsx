/**
 * Unités d'enseignement (UE) : catalogue par filière et niveau. Chaque cours (EC) est
 * rattaché à une UE ; les crédits de l'UE = somme des crédits de ses cours. La délibération
 * valide et capitalise les crédits par UE.
 */
import { useCallback, useEffect, useState } from "react"
import { useSelector } from "react-redux"
import { Modal } from "react-bootstrap"
import { FiPlus, FiLink, FiEdit2, FiTrash2, FiLayers } from "react-icons/fi"
import { filieresAPI, scolariteAPI } from "../services/api"
import { hasAnyRole } from "../utils/permissions"
import { ConfirmDialog, Empty, Field, Loading, PageHeader, Pill, Tabs } from "../components/mz/Kit"
import { listOf, useFeedback } from "../components/mz/helpers"

const NIVEAUX = ["L1", "L2", "L3", "M1", "M2"]

export default function UnitesEnseignement() {
  const { user } = useSelector((s) => s.auth)
  const canEdit = hasAnyRole(user, "sga", "pdg")
  const fb = useFeedback()
  const [filieres, setFilieres] = useState([])
  const [filiere, setFiliere] = useState("")
  const [niveau, setNiveau] = useState("L1")
  const [rows, setRows] = useState(null)
  const [form, setForm] = useState(null)
  const [linking, setLinking] = useState(null)
  const [ask, setAsk] = useState(null)

  useEffect(() => {
    filieresAPI.getAll({ page_size: 300 }).then(({ data }) => {
      const fs = listOf(data); setFilieres(fs); if (fs[0]) setFiliere(String(fs[0].id))
    }).catch((e) => fb.fail(e))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const load = useCallback(async () => {
    if (!filiere) { setRows([]); return }
    setRows(null)
    try { const { data } = await scolariteAPI.ues({ filiere, niveau, page_size: 300 }); setRows(listOf(data)) }
    catch (e) { fb.fail(e); setRows([]) }
  }, [filiere, niveau]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { load() }, [load])

  const save = async () => {
    try {
      const payload = { code: form.code, intitule: form.intitule, semestre: Number(form.semestre), type_ue: form.type_ue, description: form.description, filiere, niveau, is_active: form.is_active }
      if (form.id) await scolariteAPI.updateUE(form.id, payload); else await scolariteAPI.createUE(payload)
      setForm(null); fb.ok(form.id ? "UE modifiée." : "UE créée : elle est ajoutée au programme des étudiants inscrits à ce niveau."); load()
    } catch (e) { fb.fail(e) }
  }
  const totalCredits = (rows || []).reduce((t, u) => t + (u.credits || 0), 0)
  const bySem = (n) => (rows || []).filter((u) => u.semestre === n && u.is_active).reduce((t, u) => t + (u.credits || 0), 0)

  return (
    <div className="mz-page">
      <PageHeader title="Unités d'enseignement" subtitle="Les crédits se capitalisent par UE : une UE validée (ou compensée) reste acquise, même en cas de redoublement.">
        {canEdit && filiere && <button className="btn btn-primary btn-sm px-3" onClick={() => setForm({ code: "", intitule: "", semestre: 1, type_ue: "fondamentale", description: "", is_active: true })}><FiPlus className="me-1" />Nouvelle UE</button>}
      </PageHeader>
      {fb.banner}
      <div className="mz-card">
        <div className="mz-toolbar">
          <Tabs tabs={NIVEAUX.map((n) => ({ key: n, label: n }))} value={niveau} onChange={setNiveau} />
          <div className="d-flex gap-2 align-items-center">
            <select className="form-select form-select-sm" style={{ width: 240 }} value={filiere} onChange={(e) => setFiliere(e.target.value)}>
              {filieres.map((f) => <option key={f.id} value={f.id}>{f.nom}</option>)}
            </select>
            {rows && rows.length > 0 && <>
              <span className={`mz-pill ${bySem(1) === 30 ? "mz-pill--success" : "mz-pill--warning"}`} title="Norme LMD : 30 crédits par semestre">S1 : {bySem(1)}/30</span>
              <span className={`mz-pill ${bySem(2) === 30 ? "mz-pill--success" : "mz-pill--warning"}`}>S2 : {bySem(2)}/30</span>
              <span className={`mz-pill ${totalCredits === 60 ? "mz-pill--success" : "mz-pill--info"}`}>{totalCredits}/60 crédits</span>
            </>}
          </div>
        </div>
        {rows === null ? <Loading /> : rows.length === 0 ? (
          <Empty icon={FiLayers} title="Aucune UE pour ce niveau">Sans UE, chaque cours compte comme une UE à lui seul lors de la délibération.</Empty>
        ) : (
          <div className="mz-table-wrap"><table className="mz-table">
            <thead><tr><th>Code</th><th>Intitulé</th><th>Type</th><th>Semestre</th><th>Cours (EC)</th><th>Crédits</th><th>Volume</th><th>État</th><th className="mz-actions"></th></tr></thead>
            <tbody>{rows.map((u) => (
              <tr key={u.id}>
                <td className="mz-strong">{u.code}</td>
                <td>{u.intitule}{u.description && <div className="mz-muted">{u.description}</div>}</td>
                <td><span className="mz-pill">{u.type_label}</span></td>
                <td>S{u.semestre}</td>
                <td className="mz-muted">{u.cours.length ? u.cours.map((c) => `${c.name} (${c.credits})`).join(" · ") : <span style={{ color: "var(--color-danger)" }}>Aucun cours rattaché</span>}</td>
                <td className="mz-strong">{u.credits}</td>
                <td className="mz-muted">{u.volume_horaire} h</td>
                <td><Pill code={u.is_active ? "valid" : "annule"}>{u.is_active ? "Active" : "Inactive"}</Pill></td>
                <td className="mz-actions">{canEdit && (<>
                  <button className="mz-icon-btn mz-icon-btn--primary" onClick={() => setLinking(u)}><FiLink /> Cours</button>
                  <button className="mz-icon-btn" title="Modifier" onClick={() => setForm({ ...u })}><FiEdit2 /></button>
                  <button className="mz-icon-btn" title="Supprimer" onClick={() => setAsk({ title: `Supprimer l'UE ${u.code}`, message: "Elle part à la corbeille (restaurable). Les cours doivent d'abord être détachés.", danger: true, confirmLabel: "Supprimer",
                    onConfirm: async () => { try { await scolariteAPI.deleteUE(u.id); fb.ok("UE mise à la corbeille."); load() } catch (e) { fb.fail(e) } } })}><FiTrash2 /></button>
                </>)}</td>
              </tr>))}</tbody>
          </table></div>
        )}
      </div>

      {form && (
        <Modal show onHide={() => setForm(null)} centered>
          <Modal.Header closeButton><Modal.Title style={{ fontSize: "1.05rem" }}>{form.id ? `Modifier ${form.code}` : `Nouvelle UE — ${niveau}`}</Modal.Title></Modal.Header>
          <Modal.Body>
            <div className="row">
              <div className="col-5"><Field label="Code"><input className="form-control" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="INF101" /></Field></div>
              <div className="col-7"><Field label="Semestre"><select className="form-select" value={form.semestre} onChange={(e) => setForm({ ...form, semestre: e.target.value })}><option value={1}>Semestre 1</option><option value={2}>Semestre 2</option></select></Field></div>
            </div>
            <Field label="Intitulé"><input className="form-control" value={form.intitule} onChange={(e) => setForm({ ...form, intitule: e.target.value })} /></Field>
            <Field label="Type d'UE"><select className="form-select" value={form.type_ue} onChange={(e) => setForm({ ...form, type_ue: e.target.value })}>
              <option value="fondamentale">Fondamentale</option><option value="complementaire">Complémentaire / optionnelle</option><option value="transversale">Transversale</option></select></Field>
            <Field label="Description"><textarea className="form-control" rows={2} value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
            <div className="form-check"><input id="uea" type="checkbox" className="form-check-input" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} /><label htmlFor="uea" className="form-check-label">Active (proposée aux nouvelles inscriptions)</label></div>
          </Modal.Body>
          <Modal.Footer>
            <button className="btn btn-outline-primary btn-sm" onClick={() => setForm(null)}>Annuler</button>
            <button className="btn btn-primary btn-sm" disabled={!form.code || !form.intitule} onClick={save}>Enregistrer</button>
          </Modal.Footer>
        </Modal>
      )}
      {linking && <LinkCourses ue={linking} onClose={() => setLinking(null)} onDone={() => { setLinking(null); fb.ok("Cours rattachés."); load() }} onError={fb.fail} />}
      <ConfirmDialog ask={ask} onClose={() => setAsk(null)} />
    </div>
  )
}

function LinkCourses({ ue, onClose, onDone, onError }) {
  const [courses, setCourses] = useState(null)
  const [selected, setSelected] = useState(new Set(ue.cours.map((c) => c.id)))
  useEffect(() => { scolariteAPI.ueCandidates(ue.id).then(({ data }) => setCourses(data)).catch(() => setCourses([])) }, [ue.id])
  const toggle = (id) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  const credits = (courses || []).filter((c) => selected.has(c.id)).reduce((t, c) => t + (c.credits || 0), 0)
  return (
    <Modal show onHide={onClose} centered size="lg">
      <Modal.Header closeButton><Modal.Title style={{ fontSize: "1.05rem" }}>Cours de l'UE {ue.code} — {credits} crédits</Modal.Title></Modal.Header>
      <Modal.Body>
        {courses === null ? <Loading /> : courses.length === 0 ? <Empty title="Aucun cours dans les groupes de cette filière et de ce niveau" /> : (
          <table className="mz-table"><thead><tr><th></th><th>Cours</th><th>Groupe</th><th>Crédits</th><th>UE actuelle</th></tr></thead>
            <tbody>{courses.map((c) => (
              <tr key={c.id} onClick={() => toggle(c.id)} style={{ cursor: "pointer" }}>
                <td><input type="checkbox" className="form-check-input" checked={selected.has(c.id)} readOnly /></td>
                <td className="mz-strong">{c.name}<div className="mz-muted">{c.code}</div></td>
                <td className="mz-muted">{c.auditoire} · {c.annee}</td><td>{c.credits}</td>
                <td>{c.ue_code ? <Pill tone={c.ue === ue.id ? "success" : "warning"}>{c.ue_code}</Pill> : "—"}</td>
              </tr>))}</tbody></table>
        )}
      </Modal.Body>
      <Modal.Footer>
        <button className="btn btn-outline-primary btn-sm" onClick={onClose}>Annuler</button>
        <button className="btn btn-primary btn-sm" onClick={async () => { try { await scolariteAPI.setUECourses(ue.id, [...selected]); onDone() } catch (e) { onError(e) } }}>Enregistrer</button>
      </Modal.Footer>
    </Modal>
  )
}
