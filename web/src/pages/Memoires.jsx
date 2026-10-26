/**
 * TFC / mémoires et soutenances.
 *  Étudiant      : propose son sujet et son directeur, dépose le PDF une fois le sujet validé.
 *  Chef / SGA    : valide ou refuse le sujet (motif), programme la soutenance et compose le jury.
 *  Président     : saisit la note de soutenance (reportée dans le cours TFC/mémoire lié).
 *  Directeur, jury : suivent les travaux qui les concernent.
 */
import { useCallback, useEffect, useMemo, useState } from "react"
import { useSelector } from "react-redux"
import { Modal } from "react-bootstrap"
import { FiPlus, FiCheck, FiX, FiUpload, FiCalendar, FiEdit3, FiBookOpen, FiFileText } from "react-icons/fi"
import { scolariteAPI } from "../services/api"
import { hasAnyRole } from "../utils/permissions"
import { Empty, Field, Kpi, Loading, PageHeader, Pill, Tabs } from "../components/mz/Kit"
import { fmtDate, listOf, useFeedback } from "../components/mz/helpers"

const STATUTS = [
  { key: "", label: "Tous" }, { key: "propose", label: "Proposés" }, { key: "valide", label: "Validés" },
  { key: "depose", label: "Déposés" }, { key: "programme", label: "Programmés" }, { key: "soutenu", label: "Soutenus" },
  { key: "refuse", label: "Refusés" },
]
const TONE = { propose: "warning", valide: "info", depose: "info", programme: "info", soutenu: "success", refuse: "danger" }
const DIRECTEUR_ROLES = ["enseignant", "chef_section", "chef_departement"]

export default function Memoires() {
  const { user } = useSelector((s) => s.auth)
  const isStudent = user?.role === "etudiant"
  const canManage = hasAnyRole(user, "sga", "pdg", "chef_section", "chef_departement")
  const fb = useFeedback()
  const [rows, setRows] = useState(null)
  const [statut, setStatut] = useState("")
  const [opts, setOpts] = useState({ enseignants: [], cours: [] })
  const [form, setForm] = useState(null)
  const [decide, setDecide] = useState(null)
  const [plan, setPlan] = useState(null)
  const [note, setNote] = useState(null)

  const load = useCallback(async () => {
    try { const { data } = await scolariteAPI.memoires({ page_size: 500 }); setRows(listOf(data)) }
    catch (e) { fb.fail(e); setRows([]) }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { load(); scolariteAPI.memoireOptions().then(({ data }) => setOpts(data)).catch(() => {}) }, [load])

  const shown = useMemo(() => (rows || []).filter((m) => !statut || m.statut === statut), [rows, statut])
  const count = (k) => (rows || []).filter((m) => m.statut === k).length
  const run = async (fn, msg) => { try { await fn(); fb.ok(msg); load(); return true } catch (e) { fb.fail(e); return false } }
  const current = isStudent ? (rows || []).find((m) => m.statut !== "refuse") : null

  const upload = (m) => {
    const input = document.createElement("input")
    input.type = "file"; input.accept = "application/pdf"
    input.onchange = () => input.files[0] && run(() => scolariteAPI.depositMemoire(m.id, input.files[0]), "Travail déposé : le directeur est notifié.")
    input.click()
  }

  const actionsFor = (m) => {
    const a = []
    const mine = m.student === user?.id
    if ((mine || canManage) && ["propose", "refuse"].includes(m.statut)) a.push(<button key="e" className="mz-icon-btn" onClick={() => setForm({ ...m })}><FiEdit3 /> Modifier</button>)
    if (canManage && m.statut === "propose") a.push(<button key="d" className="mz-icon-btn mz-icon-btn--primary" onClick={() => setDecide({ m, motif: "" })}><FiCheck /> Décider</button>)
    if ((mine || m.directeur === user?.id || canManage) && ["valide", "depose"].includes(m.statut)) a.push(<button key="u" className="mz-icon-btn mz-icon-btn--primary" onClick={() => upload(m)}><FiUpload /> {m.statut === "depose" ? "Remplacer le PDF" : "Déposer le PDF"}</button>)
    if (canManage && ["depose", "programme"].includes(m.statut)) a.push(<button key="p" className="mz-icon-btn" onClick={() => setPlan({ m, date_soutenance: m.date_soutenance ? m.date_soutenance.slice(0, 16) : "", salle: m.salle || "", president_jury: m.president_jury || "", membres_jury: m.membres_jury || [] })}><FiCalendar /> {m.statut === "programme" ? "Reprogrammer" : "Programmer"}</button>)
    if (m.statut === "programme" && (m.president_jury === user?.id || hasAnyRole(user, "sga", "pdg"))) a.push(<button key="n" className="mz-icon-btn mz-icon-btn--primary" onClick={() => setNote({ m, note: "", observations: "" })}><FiEdit3 /> Noter</button>)
    if (m.fichier) a.push(<a key="f" className="mz-icon-btn" href={m.fichier} target="_blank" rel="noreferrer"><FiFileText /> PDF</a>)
    return a
  }

  return (
    <div className="mz-page">
      <PageHeader title={isStudent ? "Mon travail de fin de cycle" : "TFC & mémoires"}
        subtitle="Sujet → validation par la filière → dépôt du PDF → soutenance devant jury → note reportée au relevé.">
        {isStudent && rows && !current && <button className="btn btn-primary btn-sm px-3" onClick={() => setForm({ titre: "", resume: "", type_travail: "tfc", directeur: "", encadreur: "", course: "" })}><FiPlus className="me-1" />Proposer mon sujet</button>}
      </PageHeader>
      {fb.banner}

      {!isStudent && rows && (
        <div className="mz-kpis">
          <Kpi label="Sujets à valider" value={count("propose")} tone={count("propose") ? "warning" : undefined} />
          <Kpi label="Déposés, à programmer" value={count("depose")} />
          <Kpi label="Soutenances programmées" value={count("programme")} />
          <Kpi label="Soutenus" value={count("soutenu")} />
        </div>
      )}

      <div className="mz-card">
        {!isStudent && <div className="mz-toolbar"><Tabs tabs={STATUTS.map((s) => ({ ...s, count: s.key ? count(s.key) : (rows || []).length }))} value={statut} onChange={setStatut} /></div>}
        {rows === null ? <Loading /> : shown.length === 0 ? (
          <Empty icon={FiBookOpen} title={isStudent ? "Aucun sujet proposé" : "Aucun travail dans cette catégorie"}>
            {isStudent ? "Proposez votre sujet et votre directeur : la filière le validera avant le dépôt." : "Les sujets proposés par les étudiants apparaissent ici."}
          </Empty>
        ) : (
          <div className="mz-table-wrap"><table className="mz-table">
            <thead><tr>{!isStudent && <th>Étudiant</th>}<th>Sujet</th><th>Directeur</th><th>Soutenance</th><th>Note</th><th>Statut</th><th className="mz-actions"></th></tr></thead>
            <tbody>{shown.map((m) => (
              <tr key={m.id}>
                {!isStudent && <td className="mz-strong">{m.student_name}<div className="mz-muted">{m.matricule} {m.groupe ? `· ${m.groupe}` : ""}</div></td>}
                <td><span className="mz-pill me-1">{m.type_label}</span>{m.titre}
                  {m.statut === "refuse" && m.motif_refus && <div style={{ color: "var(--color-danger)", fontSize: ".82rem" }}>Refus : {m.motif_refus}</div>}
                  {m.depose_le && <div className="mz-muted">Déposé le {fmtDate(m.depose_le)}</div>}</td>
                <td>{m.directeur_name}{m.encadreur_name && <div className="mz-muted">Encadreur : {m.encadreur_name}</div>}</td>
                <td>{m.date_soutenance ? <>{fmtDate(m.date_soutenance, true)}<div className="mz-muted">{m.salle || "Salle à préciser"} · Président : {m.president_name}{m.membres_names?.length ? ` · ${m.membres_names.join(", ")}` : ""}</div></> : <span className="mz-muted">—</span>}</td>
                <td className="mz-strong">{m.note != null ? <>{Number(m.note).toFixed(2)}/20<div className="mz-muted">{m.mention}</div></> : "—"}</td>
                <td><Pill tone={TONE[m.statut]}>{m.statut_label}</Pill></td>
                <td className="mz-actions">{actionsFor(m)}</td>
              </tr>))}</tbody>
          </table></div>
        )}
      </div>

      {form && (
        <Modal show onHide={() => setForm(null)} centered>
          <Modal.Header closeButton><Modal.Title style={{ fontSize: "1.05rem" }}>{form.id ? "Modifier le sujet" : "Proposer un sujet"}</Modal.Title></Modal.Header>
          <Modal.Body>
            <Field label="Type"><select className="form-select" value={form.type_travail} onChange={(e) => setForm({ ...form, type_travail: e.target.value })}>
              <option value="tfc">TFC (licence)</option><option value="memoire">Mémoire (master)</option><option value="these">Thèse</option></select></Field>
            <Field label="Intitulé du sujet"><input className="form-control" value={form.titre} onChange={(e) => setForm({ ...form, titre: e.target.value })} /></Field>
            <Field label="Résumé / problématique"><textarea className="form-control" rows={3} value={form.resume || ""} onChange={(e) => setForm({ ...form, resume: e.target.value })} /></Field>
            <div className="row">
              <div className="col-6"><Field label="Directeur"><select className="form-select" value={form.directeur || ""} onChange={(e) => setForm({ ...form, directeur: e.target.value })}>
                <option value="">—</option>{opts.enseignants.filter((t) => DIRECTEUR_ROLES.includes(t.role)).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></Field></div>
              <div className="col-6"><Field label="Encadreur (facultatif)"><select className="form-select" value={form.encadreur || ""} onChange={(e) => setForm({ ...form, encadreur: e.target.value })}>
                <option value="">—</option>{opts.enseignants.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></Field></div>
            </div>
            <Field label="Cours TFC / mémoire (facultatif)" hint="La note de soutenance y sera reportée automatiquement."><select className="form-select" value={form.course || ""} onChange={(e) => setForm({ ...form, course: e.target.value })}>
              <option value="">— Aucun —</option>{opts.cours.map((c) => <option key={c.id} value={c.id}>{c.name}{c.code ? ` (${c.code})` : ""}</option>)}</select></Field>
          </Modal.Body>
          <Modal.Footer>
            <button className="btn btn-outline-primary btn-sm" onClick={() => setForm(null)}>Annuler</button>
            <button className="btn btn-primary btn-sm" disabled={!form.titre || !form.directeur} onClick={() => {
              const payload = { titre: form.titre, resume: form.resume, type_travail: form.type_travail, directeur: form.directeur, encadreur: form.encadreur || null, course: form.course || null }
              run(() => (form.id ? scolariteAPI.updateMemoire(form.id, payload) : scolariteAPI.createMemoire(payload)), form.id ? "Sujet modifié : il repasse en validation." : "Sujet proposé : la filière va l'examiner.").then((ok) => ok && setForm(null))
            }}>Enregistrer</button>
          </Modal.Footer>
        </Modal>
      )}

      {decide && (
        <Modal show onHide={() => setDecide(null)} centered>
          <Modal.Header closeButton><Modal.Title style={{ fontSize: "1.05rem" }}>Sujet de {decide.m.student_name}</Modal.Title></Modal.Header>
          <Modal.Body>
            <p className="mz-strong mb-1">{decide.m.titre}</p>
            <p className="mz-muted">{decide.m.resume || "Pas de résumé."}</p>
            <p className="mz-muted">Directeur : {decide.m.directeur_name}</p>
            <Field label="Motif (obligatoire en cas de refus)"><textarea className="form-control" rows={2} value={decide.motif} onChange={(e) => setDecide({ ...decide, motif: e.target.value })} /></Field>
          </Modal.Body>
          <Modal.Footer>
            <button className="btn btn-outline-danger btn-sm" disabled={!decide.motif.trim()} onClick={() => run(() => scolariteAPI.decideMemoire(decide.m.id, false, decide.motif), "Sujet refusé : l'étudiant est notifié.").then((ok) => ok && setDecide(null))}><FiX className="me-1" />Refuser</button>
            <button className="btn btn-primary btn-sm" onClick={() => run(() => scolariteAPI.decideMemoire(decide.m.id, true, ""), "Sujet validé.").then((ok) => ok && setDecide(null))}><FiCheck className="me-1" />Valider</button>
          </Modal.Footer>
        </Modal>
      )}

      {plan && (
        <Modal show onHide={() => setPlan(null)} centered>
          <Modal.Header closeButton><Modal.Title style={{ fontSize: "1.05rem" }}>Soutenance — {plan.m.student_name}</Modal.Title></Modal.Header>
          <Modal.Body>
            <div className="row">
              <div className="col-7"><Field label="Date et heure"><input type="datetime-local" className="form-control" value={plan.date_soutenance} onChange={(e) => setPlan({ ...plan, date_soutenance: e.target.value })} /></Field></div>
              <div className="col-5"><Field label="Salle"><input className="form-control" value={plan.salle} onChange={(e) => setPlan({ ...plan, salle: e.target.value })} /></Field></div>
            </div>
            <Field label="Président du jury"><select className="form-select" value={plan.president_jury} onChange={(e) => setPlan({ ...plan, president_jury: e.target.value })}>
              <option value="">—</option>{opts.enseignants.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></Field>
            <Field label="Membres du jury" hint="Ctrl/Cmd + clic pour en choisir plusieurs. Le directeur est généralement membre.">
              <select multiple className="form-select" style={{ height: 150 }} value={plan.membres_jury.map(String)} onChange={(e) => setPlan({ ...plan, membres_jury: [...e.target.selectedOptions].map((o) => Number(o.value)) })}>
                {opts.enseignants.filter((t) => String(t.id) !== String(plan.president_jury)).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></Field>
          </Modal.Body>
          <Modal.Footer>
            <button className="btn btn-outline-primary btn-sm" onClick={() => setPlan(null)}>Annuler</button>
            <button className="btn btn-primary btn-sm" disabled={!plan.date_soutenance || !plan.president_jury} onClick={() => run(() => scolariteAPI.scheduleMemoire(plan.m.id, { date_soutenance: plan.date_soutenance, salle: plan.salle, president_jury: plan.president_jury, membres_jury: plan.membres_jury }), "Soutenance programmée : étudiant, directeur et jury sont notifiés.").then((ok) => ok && setPlan(null))}>Programmer</button>
          </Modal.Footer>
        </Modal>
      )}

      {note && (
        <Modal show onHide={() => setNote(null)} centered>
          <Modal.Header closeButton><Modal.Title style={{ fontSize: "1.05rem" }}>Note de soutenance — {note.m.student_name}</Modal.Title></Modal.Header>
          <Modal.Body>
            <Field label="Note sur 20"><input type="number" min="0" max="20" step="0.25" className="form-control" value={note.note} onChange={(e) => setNote({ ...note, note: e.target.value })} /></Field>
            <Field label="Observations du jury"><textarea className="form-control" rows={3} value={note.observations} onChange={(e) => setNote({ ...note, observations: e.target.value })} /></Field>
            {note.m.course ? <p className="mz-muted mb-0">La note sera reportée dans le cours lié (si sa feuille de notes est encore en brouillon).</p> : <p className="mz-muted mb-0">Aucun cours lié : la note reste sur la fiche du travail.</p>}
          </Modal.Body>
          <Modal.Footer>
            <button className="btn btn-outline-primary btn-sm" onClick={() => setNote(null)}>Annuler</button>
            <button className="btn btn-primary btn-sm" disabled={note.note === "" || Number(note.note) < 0 || Number(note.note) > 20} onClick={() => run(() => scolariteAPI.gradeMemoire(note.m.id, { note: note.note, observations: note.observations }), "Note enregistrée.").then((ok) => ok && setNote(null))}>Enregistrer la note</button>
          </Modal.Footer>
        </Modal>
      )}
    </div>
  )
}
