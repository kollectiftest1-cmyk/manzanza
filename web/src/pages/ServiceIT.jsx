/**
 * Assistance informatique (helpdesk). Tout utilisateur signale un problème et suit ses
 * demandes ; le Service IT voit toutes les demandes, les prend en charge et les résout.
 */
import { useCallback, useEffect, useState } from "react"
import { useSelector } from "react-redux"
import { Modal } from "react-bootstrap"
import { FiPlus, FiSearch, FiUserCheck, FiCheck, FiX, FiLifeBuoy } from "react-icons/fi"
import api from "../services/api"
import { hasAnyRole } from "../utils/permissions"
import { ConfirmDialog, Empty, Field, Kpi, Loading, PageHeader, Pill, Tabs } from "../components/mz/Kit"
import { fmtDate, listOf, useFeedback } from "../components/mz/helpers"

const STATUS = [{ key: "", label: "Tous" }, { key: "ouvert", label: "Ouverts" }, { key: "en_cours", label: "En cours" },
  { key: "resolu", label: "Résolus" }, { key: "ferme", label: "Fermés" }]
const TONE = { ouvert: "warning", en_cours: "info", resolu: "success", ferme: "", urgente: "danger", haute: "warning", normale: "info", basse: "" }

export default function ServiceIT() {
  const { user } = useSelector((s) => s.auth)
  const isIT = hasAnyRole(user, "service_it", "pdg")
  const fb = useFeedback()
  const [status, setStatus] = useState(isIT ? "ouvert" : "")
  const [search, setSearch] = useState("")
  const [rows, setRows] = useState(null)
  const [all, setAll] = useState([])
  const [form, setForm] = useState(null)
  const [ask, setAsk] = useState(null)

  const load = useCallback(async () => {
    try {
      const params = { page_size: 300 }
      if (search.trim()) params.search = search.trim()
      const { data } = await api.get("/core/tickets/", { params })
      const list = listOf(data); setAll(list); setRows(status ? list.filter((t) => t.status === status) : list)
    } catch (e) { fb.fail(e); setRows([]) }
  }, [status, search]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { const t = setTimeout(load, search ? 300 : 0); return () => clearTimeout(t) }, [load, search])

  const act = async (fn, msg) => { try { await fn(); fb.ok(msg); load() } catch (e) { fb.fail(e) } }
  const count = (s) => all.filter((t) => t.status === s).length

  return (
    <div className="mz-page">
      <PageHeader title={isIT ? "Service IT — assistance" : "Assistance informatique"}
                  subtitle={isIT ? "Toutes les demandes des utilisateurs. Chaque résolution est notifiée au demandeur." : "Signalez un problème (compte, réseau, matériel, application) et suivez son traitement."}>
        <button className="btn btn-primary btn-sm px-3" onClick={() => setForm({ title: "", description: "", category: "autre", priority: "normale", location: "" })}><FiPlus className="me-1" />Signaler un problème</button>
      </PageHeader>
      {fb.banner}
      {isIT && (
        <div className="mz-kpis">
          <Kpi label="Ouverts" value={count("ouvert")} tone={count("ouvert") ? "warning" : undefined} />
          <Kpi label="En cours" value={count("en_cours")} />
          <Kpi label="Urgents non résolus" value={all.filter((t) => t.priority === "urgente" && ["ouvert", "en_cours"].includes(t.status)).length} tone="danger" />
          <Kpi label="Résolus" value={count("resolu")} />
        </div>
      )}
      <div className="mz-card">
        <div className="mz-toolbar">
          <Tabs tabs={STATUS.map((s) => ({ ...s, count: s.key ? count(s.key) : all.length }))} value={status} onChange={setStatus} />
          <div className="mz-search"><FiSearch size={15} /><input placeholder="Rechercher…" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
        </div>
        {rows === null ? <Loading /> : rows.length === 0 ? <Empty icon={FiLifeBuoy} title="Aucune demande">{isIT ? "Rien à traiter pour ce filtre." : "Vous n'avez signalé aucun problème."}</Empty> : (
          <div className="mz-table-wrap"><table className="mz-table">
            <thead><tr><th>#</th><th>Demande</th><th>Catégorie</th><th>Priorité</th>{isIT && <th>Demandeur</th>}<th>Statut</th><th>Suivi</th><th className="mz-actions"></th></tr></thead>
            <tbody>{rows.map((t) => (
              <tr key={t.id}>
                <td className="mz-muted">{t.id}</td>
                <td style={{ maxWidth: 320 }}><div className="mz-strong">{t.title}</div><div className="mz-muted">{t.description}</div>{t.location && <div className="mz-muted">Lieu : {t.location}</div>}</td>
                <td className="mz-muted">{t.category_label}</td>
                <td><Pill tone={TONE[t.priority]}>{t.priority_label}</Pill></td>
                {isIT && <td className="mz-muted">{t.created_by_name}<div>{t.created_by_role}</div></td>}
                <td><Pill tone={TONE[t.status]}>{t.status_label}</Pill></td>
                <td className="mz-muted" style={{ fontSize: "0.8rem", maxWidth: 220 }}>
                  <div>Créé le {fmtDate(t.created_at, true)}</div>
                  {t.assigned_to_name && <div>Pris en charge par {t.assigned_to_name}</div>}
                  {t.resolution && <div style={{ color: "var(--color-textPrimary)" }}>Solution : {t.resolution}</div>}
                </td>
                <td className="mz-actions">
                  {isIT && t.status === "ouvert" && <button className="mz-icon-btn mz-icon-btn--primary" onClick={() => act(() => api.post(`/core/tickets/${t.id}/take/`), "Ticket pris en charge.")}><FiUserCheck /> Prendre</button>}
                  {isIT && ["ouvert", "en_cours"].includes(t.status) && <button className="mz-icon-btn mz-icon-btn--primary" onClick={() => setAsk({ title: `Résoudre #${t.id}`, input: { label: "Solution apportée (envoyée au demandeur)", required: true }, confirmLabel: "Marquer résolu",
                    onConfirm: (resolution) => act(() => api.post(`/core/tickets/${t.id}/resolve/`, { resolution }), "Ticket résolu, le demandeur est notifié.") })}><FiCheck /> Résoudre</button>}
                  {t.status !== "ferme" && (isIT || t.status === "resolu" || t.status === "ouvert") && <button className="mz-icon-btn" title="Fermer" onClick={() => act(() => api.post(`/core/tickets/${t.id}/close/`), "Ticket fermé.")}><FiX /></button>}
                </td>
              </tr>))}</tbody>
          </table></div>
        )}
      </div>
      {form && (
        <Modal show onHide={() => setForm(null)} centered>
          <Modal.Header closeButton><Modal.Title style={{ fontSize: "1.05rem" }}>Signaler un problème</Modal.Title></Modal.Header>
          <Modal.Body>
            <Field label="Objet"><input className="form-control" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ex. : impossible de me connecter au Wi-Fi" /></Field>
            <Field label="Description"><textarea className="form-control" rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
            <div className="row">
              <div className="col-6"><Field label="Catégorie"><select className="form-select" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                <option value="compte">Compte / mot de passe</option><option value="reseau">Réseau / Wi-Fi</option><option value="materiel">Matériel</option><option value="logiciel">Application / logiciel</option><option value="autre">Autre</option></select></Field></div>
              <div className="col-6"><Field label="Priorité"><select className="form-select" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                <option value="basse">Basse</option><option value="normale">Normale</option><option value="haute">Haute</option><option value="urgente">Urgente</option></select></Field></div>
            </div>
            <Field label="Lieu (salle, bureau) — facultatif"><input className="form-control" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></Field>
          </Modal.Body>
          <Modal.Footer>
            <button className="btn btn-outline-primary btn-sm" onClick={() => setForm(null)}>Annuler</button>
            <button className="btn btn-primary btn-sm" disabled={!form.title.trim() || !form.description.trim()} onClick={async () => {
              try { await api.post("/core/tickets/", form); setForm(null); fb.ok("Demande envoyée au Service IT."); load() } catch (e) { fb.fail(e) }
            }}>Envoyer</button>
          </Modal.Footer>
        </Modal>
      )}
      <ConfirmDialog ask={ask} onClose={() => setAsk(null)} />
    </div>
  )
}
