/**
 * Checks if a user's role has permission based on a list of required roles.
 * @param {string} userRole - The role of the current user.
 * @param {string[]} requiredRoles - An array of roles that are allowed. If empty, all roles are allowed.
 * @returns {boolean} - True if the user has permission, false otherwise.
 */
export const checkPermission = (userRole, requiredRoles) => {
  // If the requiredRoles array is empty, it's a public route (or accessible to all authenticated users).
  if (!requiredRoles || requiredRoles.length === 0) {
    return true;
  }

  // If the user has a role and it's included in the list of required roles, they have permission.
  if (userRole && requiredRoles.includes(userRole)) {
    return true;
  }

  // A super admin 'iadmin' has access to everything.
  if (userRole === 'iadmin') {
    return true;
  }

  // If none of the above, deny access.
  return false;
};
