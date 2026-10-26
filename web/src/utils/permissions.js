/**
 * Contrôle d'accès côté interface (le serveur reste la seule autorité).
 * Un utilisateur cumule son rôle principal et ses affectations datées en cours
 * (ex. enseignant nommé chef de filière, membre de la commission d'admission) :
 * le profil renvoie `effective_roles`.
 */
export const userRoles = (user) => {
  if (!user) return []
  return Array.from(new Set([user.role, ...(user.effective_roles || [])].filter(Boolean)))
}

/**
 * @param {string|string[]|object} who - rôle, liste de rôles, ou objet utilisateur.
 * @param {string[]} requiredRoles - rôles autorisés ; vide = tout utilisateur connecté.
 */
export const checkPermission = (who, requiredRoles) => {
  if (!requiredRoles || requiredRoles.length === 0) return true
  const roles = Array.isArray(who) ? who : (who && typeof who === 'object' ? userRoles(who) : [who])
  // Le PDG voit toutes les fonctions de gestion, mais pas les espaces personnels
  // (« Mes résultats », « Mes paiements », « Mes cours »…) qui n'ont pas de sens pour lui.
  const personalOnly = requiredRoles.every((r) => ['etudiant', 'enseignant', 'assistant'].includes(r))
  if (roles.includes('pdg') && !personalOnly) return true
  return roles.some((r) => r && requiredRoles.includes(r))
}

export const hasAnyRole = (user, ...roles) => checkPermission(userRoles(user), roles)
