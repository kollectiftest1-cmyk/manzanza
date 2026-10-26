/**
 * Fonctions utilitaires partagées (formatage, erreurs API, message de retour).
 */
import { useCallback, useState } from "react"
import { FiAlertTriangle, FiCheckCircle } from "react-icons/fi"

export const errorMessage = (err, fallback = "Une erreur est survenue.") => {
  const d = err?.response?.data
  if (!d) return fallback
  if (typeof d === "string") return fallback
  if (d.detail) return Array.isArray(d.detail) ? d.detail.join(" ") : d.detail
  if (d.error) return d.error
  const first = Object.entries(d)[0]
  if (first) return `${first[0]} : ${Array.isArray(first[1]) ? first[1].join(" ") : first[1]}`
  return fallback
}

export const listOf = (data) => data?.results || data || []

export const fmtDate = (v, withTime = false) => {
  if (!v) return "—"
  const d = new Date(String(v).replace(" ", "T"))
  if (Number.isNaN(d.getTime())) return v
  const date = d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" })
  return withTime ? `${date} ${d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}` : date
}

export const fmtMoney = (amount, currency = "USD") =>
  `${Number(amount || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`

export function useFeedback() {
  const [feedback, setFeedback] = useState(null)
  const ok = useCallback((text) => setFeedback({ type: "success", text }), [])
  const fail = useCallback((err, fallback) => setFeedback({ type: "error", text: typeof err === "string" ? err : errorMessage(err, fallback) }), [])
  const banner = feedback && (
    <div className={`mz-banner mb-3 ${feedback.type === "error" ? "mz-banner--error" : "mz-banner--success"}`}>
      {feedback.type === "error" ? <FiAlertTriangle size={18} /> : <FiCheckCircle size={18} />}
      <span style={{ flex: 1 }}>{feedback.text}</span>
      <button className="mz-icon-btn" onClick={() => setFeedback(null)} aria-label="Fermer">×</button>
    </div>
  )
  return { ok, fail, banner, clear: () => setFeedback(null) }
}

const TONES = {
  success: ["admis", "approved", "approuvee", "paye", "pedagogique", "publiee", "conforme", "closed", "confirme", "validated", "valid"],
  info: ["administrative", "submitted", "ouverte", "open", "cloturee", "reinscription", "admis_dette", "partiel"],
  warning: ["en_attente", "draft", "preparation", "pending", "a_verifier", "a_completer", "ajourne", "liste_attente", "impaye"],
  danger: ["rejected", "refuse", "redouble", "defaillant", "exclu", "abandon", "suspendue", "annule", "rejete", "locked", "revoked"],
}
export const toneOf = (code) => Object.keys(TONES).find((k) => TONES[k].includes(code)) || ""
