/**
 * Données réelles des tableaux de bord (GET /stats/home/) : activité, agenda, compteurs.
 * Une seule requête par affichage, partagée entre les widgets.
 */
import { useEffect, useState } from "react"
import api from "../../services/api"

let pending = null
let cache = null
let cachedAt = 0

/** À appeler à la connexion / déconnexion : les compteurs sont propres à chaque utilisateur. */
export function clearHome() { cache = null; cachedAt = 0 }

export function loadHome(force = false) {
  if (!force && cache && Date.now() - cachedAt < 30000) return Promise.resolve(cache)
  if (!pending) {
    pending = api.get("/stats/home/")
      .then(({ data }) => { cache = data; cachedAt = Date.now(); return data })
      .finally(() => { pending = null })
  }
  return pending
}

export function useHome() {
  const [data, setData] = useState(cache)
  useEffect(() => {
    let alive = true
    loadHome().then((d) => alive && setData(d)).catch(() => alive && setData({ activity: [], agenda: [], counters: {} }))
    return () => { alive = false }
  }, [])
  return data
}

export function timeAgo(value) {
  if (!value) return ""
  const d = new Date(value)
  const s = Math.round((Date.now() - d.getTime()) / 1000)
  if (s < 60) return "À l'instant"
  if (s < 3600) return `Il y a ${Math.floor(s / 60)} min`
  if (s < 86400) return `Il y a ${Math.floor(s / 3600)} h`
  if (s < 7 * 86400) return `Il y a ${Math.floor(s / 86400)} j`
  return d.toLocaleDateString("fr-FR")
}
