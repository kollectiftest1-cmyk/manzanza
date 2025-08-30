import { createSlice } from "@reduxjs/toolkit"

const USER_ROLES = {
  PDG: "pdg",
  DIRECTEUR_GENERAL: "directeur_general",
  SGA: "sga",
  SGAD: "sgad",
  CHEF_SECTION: "chef_section",
  CHEF_DEPARTEMENT: "chef_departement",
  ENSEIGNANT: "enseignant",
  ASSISTANT: "assistant",
  APPARITORAT: "apparitorat",
  CAISSE: "caisse",
  SERVICE_IT: "service_it",
  ETUDIANT: "etudiant",
  BIBLIOTHECAIRE: "bibliothecaire",
  JURY: "jury",
}

const initialState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
}

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginStart: (state) => {
      state.loading = true
      state.error = null
    },
    loginSuccess: (state, action) => {
      state.loading = false
      state.isAuthenticated = true
      state.user = action.payload
      state.error = null
    },
    loginFailure: (state, action) => {
      state.loading = false
      state.isAuthenticated = false
      state.user = null
      state.error = action.payload
    },
    logout: (state) => {
      state.isAuthenticated = false
      state.user = null
      state.error = null
    },
    clearError: (state) => {
      state.error = null
    },
  },
})

export const hasPermission = (userRole, requiredPermissions) => {
  const rolePermissions = {
    [USER_ROLES.PDG]: ["view_all", "manage_all", "financial_reports", "strategic_decisions"],
    [USER_ROLES.DIRECTEUR_GENERAL]: ["view_all", "manage_academic", "manage_admin"],
    [USER_ROLES.SGA]: ["manage_courses", "manage_auditoires", "manage_inscriptions", "view_academic_reports"],
    [USER_ROLES.SGAD]: ["manage_payments", "financial_reports", "manage_admin_staff"],
    [USER_ROLES.CHEF_SECTION]: ["create_departments", "assign_department_heads", "view_section_stats"],
    [USER_ROLES.CHEF_DEPARTEMENT]: ["create_courses", "assign_teachers", "manage_auditoires", "manage_schedules"],
    [USER_ROLES.ENSEIGNANT]: ["manage_course_content", "grade_students", "manage_forums"],
    [USER_ROLES.ASSISTANT]: ["assist_courses", "grade_tp_td"],
    [USER_ROLES.APPARITORAT]: ["manage_attendance", "disciplinary_tracking"],
    [USER_ROLES.CAISSE]: ["process_payments", "generate_receipts"],
    [USER_ROLES.SERVICE_IT]: ["manage_users", "system_maintenance"],
    [USER_ROLES.ETUDIANT]: ["view_courses", "submit_assignments", "view_grades", "participate_forums"],
    [USER_ROLES.BIBLIOTHECAIRE]: ["manage_books", "manage_loans"],
    [USER_ROLES.JURY]: ["evaluate_defenses", "assign_topics"],
  }

  const userPermissions = rolePermissions[userRole] || []
  return requiredPermissions.every((permission) => userPermissions.includes(permission))
}

export const { loginStart, loginSuccess, loginFailure, logout, clearError } = authSlice.actions
export { USER_ROLES }
export default authSlice.reducer
