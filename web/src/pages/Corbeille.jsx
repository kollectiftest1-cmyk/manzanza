/**
 * Corbeille — aucun élément n'est supprimé immédiatement.
 * Les éléments supprimés (et leurs dépendances) restent restaurables pendant la durée
 * de conservation configurée (60 jours par défaut), puis sont purgés automatiquement.
 * Il n'existe volontairement aucune suppression définitive manuelle.
 */
import { useCallback, useEffect, useMemo, useState } from "react"
import { useSelector } from "react-redux"
import { Modal, Spinner } from "react-bootstrap"
import {
  FiTrash2, FiRotateCcw, FiEye, FiSearch, FiClock, FiSettings, FiCheckCircle, FiAlertTriangle,
} from "react-icons/fi"
import { trashAPI } from "../services/api"

const MODULE_TABS = [
  { key: "", label: "Tous" },
  { key: "auditoires", label: "Structure" },
  { key: "courses", label: "Cours" },
  { key: "grades", label: "Notes" },
  { key: "schedules", label: "Horaires" },
  { key: "inscriptions", label: "Admissions" },
  { key: "scolarite", label: "Scolarité" },
  { key: "quiz", label: "Quiz" },
  { key: "assignments", label: "TP / TD" },
  { key: "payments", label: "Finances" },
  { key: "hr", label: "RH" },
  { key: "library", label: "Bibliothèque" },
  { key: "users", label: "Utilisateurs" },
]

const formatDate = (value) => {
  if (!value) return "—"
  const d = new Date(String(value).replace(" ", "T"))
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" }) +
    " " + d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
}

const expiryPill = (days) => {
  if (days <= 3) return "mz-pill mz-pill--danger"
  if (days <= 10) return "mz-pill mz-pill--warning"
  return "mz-pill mz-pill--info"
}

const errorMessage = (err, fallback) =>
  err?.response?.data?.detail || err?.response?.data?.error || fallback

export default function Corbeille() {
  const { user } = useSelector((state) => state.auth)
  const isIAdmin = user?.role === "pdg" // PDG = administrateur général

  const [items, setItems] = useState([])
  const [count, setCount] = useState(0)
  const [retention, setRetention] = useState(60)
  const [loading, setLoading] = useState(true)
  const [moduleFilter, setModuleFilter] = useState("")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [feedback, setFeedback] = useState(null)

  const [preview, setPreview] = useState(null)        // { root, contents }
  const [confirming, setConfirming] = useState(null)  // item to restore
  const [restoring, setRestoring] = useState(false)

  const [retentionDraft, setRetentionDraft] = useState("")
  const [savingRetention, setSavingRetention] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page }
      if (moduleFilter) params.module = moduleFilter
      if (search.trim()) params.search = search.trim()
      const { data } = await trashAPI.list(params)
      setItems(data.results || data || [])
      setCount(data.count ?? (data.results || data || []).length)
      if (data.retention_days) setRetention(data.retention_days)
    } catch (err) {
      setFeedback({ type: "error", text: errorMessage(err, "Impossible de charger la corbeille.") })
    } finally {
      setLoading(false)
    }
  }, [moduleFilter, search, page])

  useEffect(() => {
    const t = setTimeout(load, search ? 300 : 0)
    return () => clearTimeout(t)
  }, [load, search])

  useEffect(() => { setRetentionDraft(String(retention)) }, [retention])

  const openPreview = async (item) => {
    setPreview({ root: item, contents: null })
    try {
      const { data } = await trashAPI.contents(item.id)
      setPreview({ root: item, contents: data })
    } catch {
      setPreview({ root: item, contents: [] })
    }
  }

  const doRestore = async () => {
    if (!confirming) return
    setRestoring(true)
    try {
      const { data } = await trashAPI.restore(confirming.id)
      setFeedback({ type: "success", text: data.detail || "Élément restauré." })
      setConfirming(null)
      setPreview(null)
      load()
    } catch (err) {
      setFeedback({ type: "error", text: errorMessage(err, "La restauration a échoué.") })
      setConfirming(null)
    } finally {
      setRestoring(false)
    }
  }

  const saveRetention = async () => {
    const value = parseInt(retentionDraft, 10)
    if (!value || value < 1 || value > 3650) {
      setFeedback({ type: "error", text: "La durée doit être comprise entre 1 et 3 650 jours." })
      return
    }
    setSavingRetention(true)
    try {
      const { data } = await trashAPI.updateSettings({ trash_retention_days: value })
      setRetention(data.trash_retention_days)
      setFeedback({ type: "success", text: `Durée de conservation fixée à ${data.trash_retention_days} jours.` })
      load()
    } catch (err) {
      setFeedback({ type: "error", text: errorMessage(err, "Enregistrement impossible.") })
    } finally {
      setSavingRetention(false)
    }
  }

  const pageCount = Math.max(1, Math.ceil(count / 20))
  const urgent = useMemo(() => items.filter((i) => i.days_left <= 3).length, [items])

  return (
    <div className="mz-page">
      <div className="mz-page-header">
        <div>
          <h1 className="mz-page-title">Corbeille</h1>
          <p className="mz-page-subtitle">
            Les éléments supprimés restent restaurables pendant <strong>{retention} jours</strong>,
            puis disparaissent définitivement.
          </p>
        </div>
      </div>

      {feedback && (
        <div className={`mz-banner mb-3 ${feedback.type === "error" ? "mz-banner--error" : "mz-banner--success"}`}>
          {feedback.type === "error" ? <FiAlertTriangle size={18} /> : <FiCheckCircle size={18} />}
          <span style={{ flex: 1 }}>{feedback.text}</span>
          <button className="mz-icon-btn" onClick={() => setFeedback(null)} aria-label="Fermer">×</button>
        </div>
      )}

      <div className="mz-kpis">
        <div className="mz-card mz-kpi">
          <div className="mz-kpi-label">Éléments en corbeille</div>
          <div className="mz-kpi-value">{count}</div>
        </div>
        <div className="mz-card mz-kpi">
          <div className="mz-kpi-label">Expirent sous 3 jours</div>
          <div className="mz-kpi-value" style={{ color: urgent ? "var(--color-danger)" : undefined }}>{urgent}</div>
        </div>
        <div className="mz-card mz-kpi">
          <div className="mz-kpi-label">Conservation</div>
          <div className="mz-kpi-value">{retention} j</div>
        </div>
      </div>

      {isIAdmin && (
        <div className="mz-card mb-3">
          <div className="mz-card-body d-flex align-items-center gap-3 flex-wrap">
            <FiSettings style={{ color: "var(--color-primary)" }} />
            <div style={{ flex: 1, minWidth: 220 }}>
              <div style={{ fontWeight: 600 }}>Durée de conservation</div>
              <div className="mz-muted" style={{ color: "var(--color-textSecondary)", fontSize: "0.85rem" }}>
                Appliquée à tous les éléments, y compris ceux déjà dans la corbeille.
              </div>
            </div>
            <div className="d-flex align-items-center gap-2">
              <input
                type="number" min={1} max={3650}
                className="form-control" style={{ width: 110 }}
                value={retentionDraft}
                onChange={(e) => setRetentionDraft(e.target.value)}
                aria-label="Durée de conservation en jours"
              />
              <span style={{ color: "var(--color-textSecondary)" }}>jours</span>
              <button className="btn btn-primary btn-sm px-3" onClick={saveRetention}
                      disabled={savingRetention || String(retention) === retentionDraft}>
                {savingRetention ? <Spinner size="sm" /> : "Enregistrer"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mz-card">
        <div className="mz-toolbar">
          <div className="mz-tabs" role="tablist">
            {MODULE_TABS.map((tab) => (
              <button
                key={tab.key || "all"}
                role="tab"
                aria-selected={moduleFilter === tab.key}
                className={`mz-tab ${moduleFilter === tab.key ? "is-active" : ""}`}
                onClick={() => { setModuleFilter(tab.key); setPage(1) }}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="mz-search">
            <FiSearch size={15} />
            <input
              placeholder="Rechercher…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            />
          </div>
        </div>

        {loading ? (
          <div className="mz-empty"><Spinner animation="border" style={{ color: "var(--color-primary)" }} /></div>
        ) : items.length === 0 ? (
          <div className="mz-empty">
            <FiTrash2 size={40} />
            <div style={{ fontWeight: 600, color: "var(--color-textPrimary)" }}>La corbeille est vide</div>
            <div>Rien n'a été supprimé{moduleFilter ? " dans ce module" : ""}.</div>
          </div>
        ) : (
          <div className="mz-table-wrap">
            <table className="mz-table">
              <thead>
                <tr>
                  <th>Élément</th>
                  <th>Type</th>
                  <th>Module</th>
                  <th>Supprimé par</th>
                  <th>Supprimé le</th>
                  <th>Expire dans</th>
                  <th className="mz-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="mz-strong">{item.object_repr}</div>
                      {item.cascade_count > 0 && (
                        <div className="mz-muted">+ {item.cascade_count} élément(s) lié(s)</div>
                      )}
                      {item.reason && <div className="mz-muted">Motif : {item.reason}</div>}
                    </td>
                    <td className="mz-muted">{item.type_label}</td>
                    <td><span className="mz-pill">{item.module_label}</span></td>
                    <td className="mz-muted">{item.deleted_by_name || "—"}</td>
                    <td className="mz-muted">{formatDate(item.deleted_at)}</td>
                    <td>
                      <span className={expiryPill(item.days_left)}>
                        <FiClock size={12} /> {item.days_left} j
                      </span>
                    </td>
                    <td className="mz-actions">
                      <button className="mz-icon-btn" title="Voir le contenu" onClick={() => openPreview(item)}>
                        <FiEye />
                      </button>
                      <button className="mz-icon-btn mz-icon-btn--primary" onClick={() => setConfirming(item)}>
                        <FiRotateCcw /> Restaurer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pageCount > 1 && (
          <div className="d-flex justify-content-between align-items-center px-3 py-2"
               style={{ borderTop: "1px solid var(--color-border)" }}>
            <span style={{ color: "var(--color-textSecondary)", fontSize: "0.85rem" }}>
              Page {page} sur {pageCount}
            </span>
            <div className="d-flex gap-2">
              <button className="mz-icon-btn" disabled={page <= 1} onClick={() => setPage(page - 1)}>Précédent</button>
              <button className="mz-icon-btn" disabled={page >= pageCount} onClick={() => setPage(page + 1)}>Suivant</button>
            </div>
          </div>
        )}
      </div>

      {/* Contenu d'un lot */}
      <Modal show={!!preview} onHide={() => setPreview(null)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: "1.1rem" }}>{preview?.root?.object_repr}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p style={{ color: "var(--color-textSecondary)" }}>
            Supprimé le {formatDate(preview?.root?.deleted_at)} par {preview?.root?.deleted_by_name || "—"}.
            La restauration remet en place tous les éléments ci-dessous.
          </p>
          {!preview?.contents ? (
            <div className="text-center py-4"><Spinner animation="border" /></div>
          ) : (
            <table className="mz-table">
              <thead><tr><th>Élément</th><th>Type</th></tr></thead>
              <tbody>
                {preview.contents.map((c) => (
                  <tr key={c.id}><td>{c.object_repr}</td><td className="mz-muted">{c.type_label}</td></tr>
                ))}
              </tbody>
            </table>
          )}
        </Modal.Body>
        <Modal.Footer>
          <button className="btn btn-outline-primary btn-sm px-3" onClick={() => setPreview(null)}>Fermer</button>
          <button className="btn btn-primary btn-sm px-3" onClick={() => setConfirming(preview?.root)}>
            <FiRotateCcw className="me-1" /> Restaurer
          </button>
        </Modal.Footer>
      </Modal>

      {/* Confirmation */}
      <Modal show={!!confirming} onHide={() => !restoring && setConfirming(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: "1.1rem" }}>Restaurer cet élément ?</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          « {confirming?.object_repr} »
          {confirming?.cascade_count > 0 && <> et {confirming.cascade_count} élément(s) lié(s)</>} redeviendront
          visibles partout dans l'application.
        </Modal.Body>
        <Modal.Footer>
          <button className="btn btn-outline-primary btn-sm px-3" disabled={restoring} onClick={() => setConfirming(null)}>
            Annuler
          </button>
          <button className="btn btn-primary btn-sm px-3" disabled={restoring} onClick={doRestore}>
            {restoring ? <Spinner size="sm" /> : "Restaurer"}
          </button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}
