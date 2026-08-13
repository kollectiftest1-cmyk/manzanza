import * as SecureStore from 'expo-secure-store'

export const API_URL = (process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8000/api').replace(/\/$/, '')
export const API_ORIGIN = API_URL.replace(/\/api$/, '')
const ACCESS = 'manzanza_access_token'
const REFRESH = 'manzanza_refresh_token'
const USER = 'manzanza_user'

const parse = async response => {
  const text = await response.text()
  try { return text ? JSON.parse(text) : null } catch { return text }
}

const message = data => {
  if (typeof data === 'string') return data
  if (data?.detail || data?.message) return data.detail || data.message
  if (data && typeof data === 'object') return Object.entries(data).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`).join('\n')
  return 'Une erreur est survenue.'
}

async function refreshAccess() {
  const refresh = await SecureStore.getItemAsync(REFRESH)
  if (!refresh) return null
  const response = await fetch(`${API_URL}/auth/token/refresh/`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refresh }) })
  if (!response.ok) return null
  const data = await parse(response)
  await SecureStore.setItemAsync(ACCESS, data.access)
  return data.access
}

export async function request(path, options = {}, retry = true) {
  const token = await SecureStore.getItemAsync(ACCESS)
  const isForm = typeof FormData !== 'undefined' && options.body instanceof FormData
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 30000)
  let response
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      signal: controller.signal,
      headers: { Accept: 'application/json', ...(!isForm && options.body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers }
    })
  } catch (error) {
    if (error?.name === 'AbortError') throw new Error('Le serveur met trop de temps à répondre. Réessayez.')
    throw new Error(`Impossible de joindre le serveur (${API_URL}). Vérifiez que le téléphone et l'ordinateur utilisent le même réseau Wi-Fi.`)
  } finally {
    clearTimeout(timeout)
  }
  if (response.status === 401 && retry) {
    const next = await refreshAccess()
    if (next) return request(path, options, false)
  }
  const data = await parse(response)
  if (!response.ok) throw new Error(message(data))
  return data
}

export const query = (path, params = {}) => {
  const values = Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== '')
  return request(`${path}${values.length ? `?${values.map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`).join('&')}` : ''}`)
}
export const list = data => Array.isArray(data) ? data : (data?.results || [])
export const json = (method, body) => ({ method, body: JSON.stringify(body) })

export const filePart = asset => asset ? ({ uri: asset.uri, name: asset.name || asset.fileName || `fichier-${Date.now()}`, type: asset.mimeType || 'application/octet-stream' }) : null

export async function login(email, password) {
  const data = await request('/auth/login/', json('POST', { email, password }))
  if (!['etudiant', 'enseignant'].includes(data.user?.role)) throw new Error('Cette application est réservée aux étudiants et aux enseignants.')
  await Promise.all([
    SecureStore.setItemAsync(ACCESS, data.access),
    SecureStore.setItemAsync(REFRESH, data.refresh),
    SecureStore.setItemAsync(USER, JSON.stringify(data.user))
  ])
  return data.user
}

export async function saveUser(user) { await SecureStore.setItemAsync(USER, JSON.stringify(user)); return user }
export async function restoreSession() { const raw = await SecureStore.getItemAsync(USER); return raw ? JSON.parse(raw) : null }
export async function logout() {
  const refresh = await SecureStore.getItemAsync(REFRESH)
  try { if (refresh) await request('/auth/logout/', json('POST', { refresh })) } catch {}
  await Promise.all([SecureStore.deleteItemAsync(ACCESS), SecureStore.deleteItemAsync(REFRESH), SecureStore.deleteItemAsync(USER)])
}

export async function loadDashboard() {
  const [courses, assignments, quizzes, notifications] = await Promise.all([
    query('/courses/').then(list), query('/assignments/').then(list), query('/quiz/').then(list), query('/notifications/unread_count/').catch(() => ({ count: 0 }))
  ])
  return { courses, assignments, quizzes, unread: notifications.count || notifications.unread_count || 0 }
}
