/**
 * Petits composants partagés du système de design « Turquoise » (classes mz-*).
 */
import { useState } from "react"
import { Modal, Spinner } from "react-bootstrap"
import { FiInbox } from "react-icons/fi"
import { toneOf } from "./helpers"

export const PageHeader = ({ title, subtitle, children }) => (
  <div className="mz-page-header">
    <div>
      <h1 className="mz-page-title">{title}</h1>
      {subtitle && <p className="mz-page-subtitle">{subtitle}</p>}
    </div>
    {children && <div className="d-flex gap-2 flex-wrap">{children}</div>}
  </div>
)

export const Tabs = ({ tabs, value, onChange }) => (
  <div className="mz-tabs" role="tablist">
    {tabs.map((t) => (
      <button key={t.key || "all"} role="tab" aria-selected={value === t.key}
              className={`mz-tab ${value === t.key ? "is-active" : ""}`} onClick={() => onChange(t.key)}>
        {t.label}{t.count != null && <span className="mz-tab-count">{t.count}</span>}
      </button>
    ))}
  </div>
)

export const Pill = ({ code, children, tone }) => {
  const t = tone ?? toneOf(code)
  return <span className={`mz-pill ${t ? `mz-pill--${t}` : ""}`}>{children}</span>
}

export const Loading = () => (
  <div className="mz-empty"><Spinner animation="border" style={{ color: "var(--color-primary)" }} /></div>
)

export const Empty = ({ icon: Icon = FiInbox, title, children }) => (
  <div className="mz-empty">
    <Icon size={38} />
    <div style={{ fontWeight: 600, color: "var(--color-textPrimary)" }}>{title}</div>
    {children && <div>{children}</div>}
  </div>
)

export const Kpi = ({ label, value, hint, tone }) => (
  <div className="mz-card mz-kpi">
    <div className="mz-kpi-label">{label}</div>
    <div className="mz-kpi-value" style={tone ? { color: `var(--color-${tone})` } : undefined}>{value ?? "—"}</div>
    {hint && <div style={{ color: "var(--color-textSecondary)", fontSize: "0.8rem" }}>{hint}</div>}
  </div>
)

/**
 * Boîte de dialogue de confirmation, avec champ texte optionnel (motif, justification…).
 * `ask` = { title, message, input?: { label, required, placeholder }, confirmLabel, danger, onConfirm(value) }
 */
export function ConfirmDialog({ ask, onClose }) {
  const [value, setValue] = useState("")
  const [busy, setBusy] = useState(false)
  if (!ask) return null
  const needs = ask.input?.required && !value.trim()
  const go = async () => {
    setBusy(true)
    try { await ask.onConfirm(value.trim()); onClose(); setValue("") } finally { setBusy(false) }
  }
  return (
    <Modal show onHide={() => !busy && onClose()} centered>
      <Modal.Header closeButton><Modal.Title style={{ fontSize: "1.05rem" }}>{ask.title}</Modal.Title></Modal.Header>
      <Modal.Body>
        {ask.message && <p style={{ color: "var(--color-textSecondary)" }}>{ask.message}</p>}
        {ask.input && (
          <>
            <label className="form-label fw-semibold">{ask.input.label}</label>
            {ask.input.type === "datetime-local" || ask.input.type === "select" ? null : (
              <textarea className="form-control" rows={3} value={value} placeholder={ask.input.placeholder}
                        onChange={(e) => setValue(e.target.value)} />
            )}
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <button className="btn btn-outline-primary btn-sm px-3" onClick={onClose} disabled={busy}>Annuler</button>
        <button className={`btn btn-sm px-3 ${ask.danger ? "btn-danger" : "btn-primary"}`} onClick={go} disabled={busy || needs}>
          {busy ? <Spinner size="sm" /> : (ask.confirmLabel || "Confirmer")}
        </button>
      </Modal.Footer>
    </Modal>
  )
}

export const Field = ({ label, children, hint }) => (
  <div className="mb-3">
    <label className="form-label fw-semibold" style={{ fontSize: "0.88rem" }}>{label}</label>
    {children}
    {hint && <div className="form-text">{hint}</div>}
  </div>
)
