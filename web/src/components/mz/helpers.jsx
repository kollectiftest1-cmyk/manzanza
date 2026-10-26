/**
 * Fonctions utilitaires partagées (formatage, erreurs API, message de retour).
 */
import { useCallback } from "react"
import { describeError, notify, notifyError } from "../../utils/notify"

export const errorMessage = (err, fallback = "Une erreur est survenue.") => describeError(err, fallback)

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

/**
 * Retour d'action d'un écran : succès et erreurs s'affichent en notification, au-dessus de tout
 * (y compris des fenêtres modales). « banner » est conservé pour compatibilité (n'affiche plus rien).
 */
export function useFeedback() {
  const ok = useCallback((text) => notify.success(text), [])
  const fail = useCallback((err, fallback) => notifyError(err, fallback), [])
  return { ok, fail, banner: null, clear: () => {} }
}

const TONES = {
  success: ["admis", "approved", "approuvee", "paye", "pedagogique", "publiee", "conforme", "closed", "confirme", "validated", "valid"],
  info: ["administrative", "submitted", "ouverte", "open", "cloturee", "reinscription", "admis_dette", "partiel"],
  warning: ["en_attente", "draft", "preparation", "pending", "a_verifier", "a_completer", "ajourne", "liste_attente", "impaye"],
  danger: ["rejected", "refuse", "redouble", "defaillant", "exclu", "abandon", "suspendue", "annule", "rejete", "locked", "revoked"],
}
export const toneOf = (code) => Object.keys(TONES).find((k) => TONES[k].includes(code)) || ""
