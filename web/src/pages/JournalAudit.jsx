/**
 * Journal d'audit — lecture seule (PDG, PDG, DG).
 * Trace : connexions, notes, paiements, décisions d'inscription, corbeille, paramètres.
 */
import { useCallback, useEffect, useState } from "react"
import { Spinner } from "react-bootstrap"
import { FiSearch, FiShield } from "react-icons/fi"
import { trashAPI } from "../services/api"
import { notifyError } from "../utils/notify"

const ACTIONS = [
  { key: "", label: "Tout" },
  { key: "login", label: "Connexions" },
  { key: "login_failed", label: "Échecs" },
  { key: "grade", label: "Notes" },
  { key: "payment", label: "Paiements" },
  { key: "inscription", label: "Inscriptions" },
  { key: "trash", label: "Corbeille" },
  { key: "restore", label: "Restaurations" },
  { key: "purge", label: "Purges" },
  { key: "settings", label: "Paramètres" },
]

const PILL = {
  login: "mz-pill--success", login_failed: "mz-pill--danger", grade: "mz-pill--info",
  payment: "mz-pill--warning", trash: "mz-pill--danger", restore: "mz-pill--success",
  purge: "mz-pill--danger", inscription: "mz-pill--info",
}

const fmt = (v) => {
  const d = new Date(String(v).replace(" ", "T"))
  return Number.isNaN(d.getTime()) ? v : d.toLocaleString("fr-FR")
}

const summarize = (details) => {
  if (!details || typeof details !== "object") return ""
  return Object.entries(details)
    .filter(([k]) => k !== "batch")
    .map(([k, v]) => `${k.replace(/_/g, " ")} : ${typeof v === "object" ? JSON.stringify(v) : v}`)
    .join(" · ")
}

export default function JournalAudit() {
  const [rows, setRows] = useState([])
  const [count, setCount] = useState(0)
  const [action, setAction] = useState("")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const params = { page }
      if (action) params.action = action
      if (search.trim()) params.search = search.trim()
      const { data } = await trashAPI.auditLogs(params)
      setRows(data.results || [])
      setCount(data.count || 0)
    } catch (err) {
      notifyError(err, err?.response?.data?.detail || "Accès refusé ou journal indisponible.")
    } finally {
      setLoading(false)
    }
  }, [action, search, page])

  useEffect(() => {
    const t = setTimeout(load, search ? 300 : 0)
    return () => clearTimeout(t)
  }, [load, search])

  const pages = Math.max(1, Math.ceil(count / 20))

  return (
    <div className="mz-page">
      <div className="mz-page-header">
        <div>
          <h1 className="mz-page-title">Journal d'audit</h1>
          <p className="mz-page-subtitle">Qui a fait quoi, quand et depuis où. Les entrées ne peuvent être ni modifiées ni supprimées.</p>
        </div>
      </div>
      {error && <div className="mz-banner mz-banner--error mb-3">{error}</div>}
      <div className="mz-card">
        <div className="mz-toolbar">
          <div className="mz-tabs">
            {ACTIONS.map((a) => (
              <button key={a.key || "all"} className={`mz-tab ${action === a.key ? "is-active" : ""}`}
                      onClick={() => { setAction(a.key); setPage(1) }}>{a.label}</button>
            ))}
          </div>
          <div className="mz-search">
            <FiSearch size={15} />
            <input placeholder="Utilisateur ou élément…" value={search}
                   onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
          </div>
        </div>
        {loading ? (
          <div className="mz-empty"><Spinner animation="border" style={{ color: "var(--color-primary)" }} /></div>
        ) : rows.length === 0 ? (
          <div className="mz-empty"><FiShield size={40} /><div>Aucune entrée.</div></div>
        ) : (
          <div className="mz-table-wrap">
            <table className="mz-table">
              <thead>
                <tr><th>Date</th><th>Action</th><th>Utilisateur</th><th>Élément</th><th>Détails</th><th>IP</th></tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="mz-muted" style={{ whiteSpace: "nowrap" }}>{fmt(r.timestamp)}</td>
                    <td><span className={`mz-pill ${PILL[r.action] || ""}`}>{r.action_label}</span></td>
                    <td className="mz-strong">{r.actor_repr || "Système"}</td>
                    <td>
                      <div>{r.object_repr || "—"}</div>
                      {r.object_type && <div className="mz-muted">{r.object_type}</div>}
                    </td>
                    <td className="mz-muted" style={{ maxWidth: 380 }}>{summarize(r.details)}</td>
                    <td className="mz-muted">{r.ip_address || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {pages > 1 && (
          <div className="d-flex justify-content-between align-items-center px-3 py-2" style={{ borderTop: "1px solid var(--color-border)" }}>
            <span style={{ color: "var(--color-textSecondary)", fontSize: "0.85rem" }}>Page {page} sur {pages}</span>
            <div className="d-flex gap-2">
              <button className="mz-icon-btn" disabled={page <= 1} onClick={() => setPage(page - 1)}>Précédent</button>
              <button className="mz-icon-btn" disabled={page >= pages} onClick={() => setPage(page + 1)}>Suivant</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
