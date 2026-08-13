import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import { authAPI } from "../../services/api"

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
  IADMIN: "iadmin",
}

// Async thunks pour les appels API
export const login = createAsyncThunk(
  "auth/login",
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await authAPI.login({ email, password })
      const { access, refresh, user } = response.data

      // Stocker les tokens
      localStorage.setItem("access_token", access)
      localStorage.setItem("refresh_token", refresh)
      localStorage.setItem("user", JSON.stringify(user))

      return user
    } catch (error) {
      const message = error.response?.data?.detail ||
                     error.response?.data?.message ||
                     "Erreur de connexion. Vérifiez vos identifiants."
      return rejectWithValue(message)
    }
  }
)

export const logout = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      await authAPI.logout()
    } catch (error) {
      // Continuer même si l'API échoue
    } finally {
      // Nettoyer le localStorage
      localStorage.removeItem("access_token")
      localStorage.removeItem("refresh_token")
      localStorage.removeItem("user")
    }
  }
)

export const getCurrentUser = createAsyncThunk(
  "auth/getCurrentUser",
  async (_, { rejectWithValue }) => {
    try {
      const response = await authAPI.getCurrentUser()
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || "Erreur lors de la récupération du profil")
    }
  }
)

// Charger l'utilisateur depuis le localStorage au démarrage
const loadUserFromStorage = () => {
  try {
    const userStr = localStorage.getItem("user")
    const token = localStorage.getItem("access_token")
    if (userStr && token) {
      return JSON.parse(userStr)
    }
  } catch (error) {
    console.error("Erreur lors du chargement de l'utilisateur:", error)
  }
  return null
}

const initialState = {
  user: loadUserFromStorage(),
  isAuthenticated: !!loadUserFromStorage(),
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
    clearError: (state) => {
      state.error = null
    },
    setUser: (state, action) => {
      state.user = action.payload
      state.isAuthenticated = !!action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false
        state.isAuthenticated = true
        state.user = action.payload
        state.error = null
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false
        state.isAuthenticated = false
        state.user = null
        state.error = action.payload
      })
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.isAuthenticated = false
        state.user = null
        state.error = null
        state.loading = false
      })
      // Get current user
      .addCase(getCurrentUser.pending, (state) => {
        state.loading = true
      })
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload
        state.isAuthenticated = true
        localStorage.setItem("user", JSON.stringify(action.payload))
      })
      .addCase(getCurrentUser.rejected, (state) => {
        state.loading = false
        state.isAuthenticated = false
        state.user = null
        localStorage.removeItem("access_token")
        localStorage.removeItem("refresh_token")
        localStorage.removeItem("user")
      })
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

export const { loginStart, loginSuccess, loginFailure, clearError, setUser } = authSlice.actions
export { USER_ROLES }
export default authSlice.reducer
