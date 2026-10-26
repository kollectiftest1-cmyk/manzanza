/**
 * Affectations de rôles datées et limitées à un périmètre (chef de filière, commission
 * d'admission, comptable…). Elles s'ajoutent au rôle principal et expirent d'elles-mêmes.
 */
import { useCallback, useEffect, useState } from "react"
import { Modal } from "react-bootstrap"
import { FiPlus, FiTrash2 } from "react-icons/fi"
import { filieresAPI, scolariteAPI, sectionsAPI, usersAPI } from "../services/api"
import { ConfirmDialog, Empty, Field, Loading, PageHeader, Pill } from "../components/mz/Kit"
import { fmtDate, listOf, useFeedback } from "../components/mz/helpers"

const ROLES = [
  ["chef_section", "Chef de section"], ["chef_departement", "Chef de filière / département"],
  ["commission_admission", "Membre de la commission d'admission"], ["comptable", "Comptable"],
  ["apparitorat", "Apparitorat"], ["caisse", "Caissier"], ["jury", "Membre de jury"],
]

export default function Affectations() {
  const fb = useFeedback()
  const [rows, setRows] = useState(null)
  const [form, setForm] = useState(null)
  const [ask, setAsk] = useState(null)
  const [users, setUsers] = useState([])
  const [filieres, setFilieres] = useState([])
  const [sections, setSections] = useState([])
  const [q, setQ] = useState("")
  const load = useCallback(() => scolariteAPI.affectations({ page_size: 300 }).then(({ data }) => setRows(listOf(data))).catch((e) => { fb.fail(e); setRows([]) }), []) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { load()
    filieresAPI.getAll({ page_size: 300 }).then(({ data }) => setFilieres(listOf(data))).catch(() => {})
    sectionsAPI.getAll({ page_size: 300 }).then(({ data }) => setSections(listOf(data))).catch(() => {}) }, [load])
  useEffect(() => { if (!form) return
    const t = setTimeout(() => usersAPI.getAll({ search: q, page_size: 50 }).then(({ data }) => setUsers(listOf(data).filter((u) => u.role !== "etudiant"))).catch(() => {}), 250)
    return () => clearTimeout(t) }, [q, form])
  const save = async () => {
    try { await scolariteAPI.createAffectation({ ...form, end_date: form.end_date || null, filiere: form.filiere || null, section: form.section || null })
      setForm(null); fb.ok("Affectation enregistrée."); load() } catch (e) { fb.fail(e) }
  }
  return (
    <div className="mz-page">
      <PageHeader title="Affectations de rôles" subtitle="Un enseignant peut être nommé chef de filière pour une durée donnée, sans changer de compte ni perdre son rôle d'enseignant.">
        <button className="btn btn-primary btn-sm px-3" onClick={() => setForm({ user: "", role: "chef_departement", filiere: "", section: "", start_date: new Date().toISOString().slice(0, 10), end_date: "", motif: "" })}><FiPlus className="me-1" />Nouvelle affectation</button>
      </PageHeader>
      {fb.banner}
      <div className="mz-card">{rows === null ? <Loading /> : rows.length === 0 ? <Empty title="Aucune affectation" /> : (
        <div className="mz-table-wrap"><table className="mz-table">
          <thead><tr><th>Personne</th><th>Rôle</th><th>Périmètre</th><th>Période</th><th>État</th><th className="mz-actions"></th></tr></thead>
          <tbody>{rows.map((a) => (
            <tr key={a.id}><td className="mz-strong">{a.user_name}</td><td>{a.role_label}</td><td className="mz-muted">{a.filiere_name || a.section_name || "Établissement"}</td>
              <td className="mz-muted">du {fmtDate(a.start_date)} {a.end_date ? `au ${fmtDate(a.end_date)}` : "(sans fin)"}</td>
              <td><Pill code={a.is_current ? "valid" : "annule"}>{a.is_current ? "En cours" : "Inactive"}</Pill></td>
              <td className="mz-actions"><button className="mz-icon-btn" onClick={() => setAsk({ title: "Retirer l'affectation", message: "Elle part à la corbeille (restaurable).", danger: true, confirmLabel: "Retirer",
                onConfirm: async () => { try { await scolariteAPI.deleteAffectation(a.id); fb.ok("Affectation retirée."); load() } catch (e) { fb.fail(e) } } })}><FiTrash2 /></button></td></tr>
          ))}</tbody></table></div>
      )}</div>
      {form && (
        <Modal show onHide={() => setForm(null)} centered>
          <Modal.Header closeButton><Modal.Title style={{ fontSize: "1.05rem" }}>Nouvelle affectation</Modal.Title></Modal.Header>
          <Modal.Body>
            <Field label="Personne"><input className="form-control mb-2" placeholder="Rechercher…" value={q} onChange={(e) => setQ(e.target.value)} />
              <select className="form-select" value={form.user} onChange={(e) => setForm({ ...form, user: e.target.value })}><option value="">— Choisir —</option>
                {users.map((u) => <option key={u.id} value={u.id}>{u.name || `${u.first_name} ${u.last_name}`} ({u.role})</option>)}</select></Field>
            <Field label="Rôle"><select className="form-select" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>{ROLES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></Field>
            {form.role === "chef_departement" && <Field label="Filière"><select className="form-select" value={form.filiere} onChange={(e) => setForm({ ...form, filiere: e.target.value })}><option value="">—</option>{filieres.map((f) => <option key={f.id} value={f.id}>{f.nom}</option>)}</select></Field>}
            {form.role === "chef_section" && <Field label="Section"><select className="form-select" value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })}><option value="">—</option>{sections.map((s) => <option key={s.id} value={s.id}>{s.nom}</option>)}</select></Field>}
            <div className="row"><div className="col"><Field label="Début"><input type="date" className="form-control" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} /></Field></div>
              <div className="col"><Field label="Fin (facultatif)"><input type="date" className="form-control" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} /></Field></div></div>
            <Field label="Acte / motif"><input className="form-control" value={form.motif} onChange={(e) => setForm({ ...form, motif: e.target.value })} placeholder="Arrêté n°…" /></Field>
          </Modal.Body>
          <Modal.Footer><button className="btn btn-outline-primary btn-sm" onClick={() => setForm(null)}>Annuler</button>
            <button className="btn btn-primary btn-sm" disabled={!form.user} onClick={save}>Enregistrer</button></Modal.Footer>
        </Modal>
      )}
      <ConfirmDialog ask={ask} onClose={() => setAsk(null)} />
    </div>
  )
}
