/**
 * Notifications de l'application : messages affichés en haut de l'écran, AU-DESSUS de tout
 * (y compris des fenêtres modales), rédigés pour être compris sans l'aide d'un technicien.
 *
 *   notify.success("Année académique créée.")
 *   notifyError(err, "Impossible d'enregistrer l'année.")   // dans un catch
 *
 * Le serveur renvoie pour chaque erreur un texte prêt à afficher (clé « message ») où chaque
 * champ est désigné par son libellé : « Date de fin : la date de fin doit être postérieure… ».
 */
import { toast } from "react-toastify"

const STATUS_MESSAGES = {
  400: "Certaines informations sont invalides. Vérifiez le formulaire.",
  401: "Votre session a expiré. Reconnectez-vous pour continuer.",
  403: "Vous n'avez pas l'autorisation d'effectuer cette action avec votre rôle.",
  404: "Élément introuvable : il a peut-être été supprimé (consultez la corbeille).",
  409: "Cette opération est en conflit avec des données existantes.",
  413: "Le fichier envoyé est trop volumineux.",
  429: "Trop de tentatives en peu de temps. Patientez une minute puis réessayez.",
  500: "Erreur interne du serveur : l'opération n'a pas été enregistrée. Réessayez ; si le problème persiste, signalez-le au service informatique (menu Assistance IT).",
  502: "Le serveur est momentanément indisponible (redémarrage ou maintenance). Réessayez dans un instant.",
  503: "Le serveur est momentanément indisponible (maintenance). Réessayez dans un instant.",
  504: "Le serveur a mis trop de temps à répondre. Réessayez dans un instant.",
}

const prettyKey = (k) => (k === "non_field_errors" || k === "detail" ? "" : `${k.replace(/_/g, " ")} : `)

function flatten(data, prefix = "") {
  if (data == null) return []
  if (typeof data === "string") return [prefix + data]
  if (Array.isArray(data)) return data.flatMap((x) => flatten(x, prefix))
  if (typeof data === "object") return Object.entries(data).filter(([k]) => k !== "message").flatMap(([k, v]) => flatten(v, prefix + prettyKey(k)))
  return [prefix + String(data)]
}

/** Texte clair pour n'importe quelle erreur (Axios, Error, chaîne). */
export function describeError(err, fallback = "L'opération n'a pas abouti.") {
  if (!err) return fallback
  if (typeof err === "string") return err
  if (err.response) {
    const { status, data } = err.response
    if (data && typeof data === "object" && !(data instanceof Blob)) {
      if (typeof data.message === "string" && data.message.trim()) return data.message
      if (typeof data.detail === "string" && data.detail.trim()) return data.detail
      if (typeof data.error === "string" && data.error.trim()) return data.error
      const lines = flatten(data)
      if (lines.length) return [...new Set(lines)].join("\n")
    }
    return STATUS_MESSAGES[status] || (status >= 500 ? STATUS_MESSAGES[500] : fallback)
  }
  if (err.code === "ECONNABORTED") return "Le serveur a mis trop de temps à répondre. Vérifiez votre connexion puis réessayez."
  if (err.code === "ERR_NETWORK" || err.message === "Network Error")
    return "Impossible de joindre le serveur. Vérifiez votre connexion internet puis réessayez."
  if (err.name === "CanceledError") return ""
  return err.message && !/^Request failed/.test(err.message) ? err.message : fallback
}

const base = { style: { whiteSpace: "pre-line" } }
export const notify = {
  success: (msg, opts) => msg && toast.success(msg, { ...base, autoClose: 3500, ...opts }),
  info: (msg, opts) => msg && toast.info(msg, { ...base, autoClose: 5000, ...opts }),
  warning: (msg, opts) => msg && toast.warning(msg, { ...base, autoClose: 7000, ...opts }),
  error: (msg, opts) => msg && toast.error(msg, { ...base, autoClose: 9000, ...opts }),
}

/** À utiliser dans un catch : affiche l'erreur la plus précise possible, une seule fois. */
export function notifyError(err, fallback) {
  if (err && typeof err === "object") {
    if (err.__notified) return
    err.__notified = true
  }
  const msg = describeError(err, typeof fallback === "string" ? fallback : undefined)
  if (msg) notify.error(msg, { toastId: msg })
}

/**
 * Filet de sécurité : une modification refusée par le serveur et qu'aucun écran n'a traitée
 * est quand même signalée (plus jamais de bouton qui « ne fait rien »).
 */
export function notifyIfUnhandled(err) {
  setTimeout(() => { if (!err.__notified) notifyError(err) }, 120)
}
