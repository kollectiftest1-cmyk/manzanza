import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import { assignmentsAPI } from "../../services/api"

// Async thunks pour les appels API
export const fetchAssignments = createAsyncThunk(
  "assignments/fetchAssignments",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await assignmentsAPI.getAll(params)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || "Erreur lors du chargement des devoirs")
    }
  }
)

export const fetchMyAssignments = createAsyncThunk(
  "assignments/fetchMyAssignments",
  async (_, { rejectWithValue }) => {
    try {
      const response = await assignmentsAPI.getMyAssignments()
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || "Erreur lors du chargement de vos devoirs")
    }
  }
)

export const fetchAssignmentById = createAsyncThunk(
  "assignments/fetchAssignmentById",
  async (id, { rejectWithValue }) => {
    try {
      const response = await assignmentsAPI.getById(id)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || "Erreur lors du chargement du devoir")
    }
  }
)

export const createAssignment = createAsyncThunk(
  "assignments/createAssignment",
  async (assignmentData, { rejectWithValue }) => {
    try {
      const response = await assignmentsAPI.create(assignmentData)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || "Erreur lors de la création du devoir")
    }
  }
)

export const updateAssignment = createAsyncThunk(
  "assignments/updateAssignment",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await assignmentsAPI.update(id, data)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || "Erreur lors de la mise à jour du devoir")
    }
  }
)

export const deleteAssignment = createAsyncThunk(
  "assignments/deleteAssignment",
  async (id, { rejectWithValue }) => {
    try {
      await assignmentsAPI.delete(id)
      return id
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || "Erreur lors de la suppression du devoir")
    }
  }
)

export const submitAssignment = createAsyncThunk(
  "assignments/submitAssignment",
  async ({ assignmentId, submissionData }, { rejectWithValue }) => {
    try {
      const response = await assignmentsAPI.submitAssignment(assignmentId, submissionData)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || "Erreur lors de la soumission du devoir")
    }
  }
)

export const fetchMySubmissions = createAsyncThunk(
  "assignments/fetchMySubmissions",
  async (_, { rejectWithValue }) => {
    try {
      const response = await assignmentsAPI.getMySubmissions()
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || "Erreur lors du chargement des soumissions")
    }
  }
)

export const gradeSubmission = createAsyncThunk(
  "assignments/gradeSubmission",
  async ({ submissionId, grade, feedback }, { rejectWithValue }) => {
    try {
      const response = await assignmentsAPI.gradeSubmission(submissionId, { grade, feedback })
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || "Erreur lors de la notation")
    }
  }
)

export const fetchSubmissionsByAssignment = createAsyncThunk(
  "assignments/fetchSubmissionsByAssignment",
  async (assignmentId, { rejectWithValue }) => {
    try {
      const response = await assignmentsAPI.getSubmissionsByAssignment(assignmentId)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || "Erreur lors du chargement des soumissions")
    }
  }
)

const initialState = {
  assignments: [],
  myAssignments: [],
  currentAssignment: null,
  submissions: [],
  mySubmissions: [],
  loading: false,
  error: null,
}

const assignmentsSlice = createSlice({
  name: "assignments",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    clearCurrentAssignment: (state) => {
      state.currentAssignment = null
    },
    clearSubmissions: (state) => {
      state.submissions = []
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all assignments
      .addCase(fetchAssignments.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchAssignments.fulfilled, (state, action) => {
        state.loading = false
        state.assignments = action.payload.results || action.payload
        state.error = null
      })
      .addCase(fetchAssignments.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Fetch my assignments
      .addCase(fetchMyAssignments.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchMyAssignments.fulfilled, (state, action) => {
        state.loading = false
        state.myAssignments = action.payload
        state.error = null
      })
      .addCase(fetchMyAssignments.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Fetch assignment by ID
      .addCase(fetchAssignmentById.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchAssignmentById.fulfilled, (state, action) => {
        state.loading = false
        state.currentAssignment = action.payload
        state.error = null
      })
      .addCase(fetchAssignmentById.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Create assignment
      .addCase(createAssignment.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createAssignment.fulfilled, (state, action) => {
        state.loading = false
        state.assignments.push(action.payload)
        state.error = null
      })
      .addCase(createAssignment.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Update assignment
      .addCase(updateAssignment.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updateAssignment.fulfilled, (state, action) => {
        state.loading = false
        const index = state.assignments.findIndex((a) => a.id === action.payload.id)
        if (index !== -1) {
          state.assignments[index] = action.payload
        }
        if (state.currentAssignment?.id === action.payload.id) {
          state.currentAssignment = action.payload
        }
        state.error = null
      })
      .addCase(updateAssignment.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Delete assignment
      .addCase(deleteAssignment.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(deleteAssignment.fulfilled, (state, action) => {
        state.loading = false
        state.assignments = state.assignments.filter((a) => a.id !== action.payload)
        state.error = null
      })
      .addCase(deleteAssignment.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Submit assignment
      .addCase(submitAssignment.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(submitAssignment.fulfilled, (state, action) => {
        state.loading = false
        state.mySubmissions.push(action.payload)
        // Mettre à jour l'assignment dans myAssignments
        const assignment = state.myAssignments.find((a) => a.id === action.payload.assignment)
        if (assignment) {
          assignment.submitted = true
        }
        state.error = null
      })
      .addCase(submitAssignment.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Fetch my submissions
      .addCase(fetchMySubmissions.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchMySubmissions.fulfilled, (state, action) => {
        state.loading = false
        state.mySubmissions = action.payload
        state.error = null
      })
      .addCase(fetchMySubmissions.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Grade submission
      .addCase(gradeSubmission.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(gradeSubmission.fulfilled, (state, action) => {
        state.loading = false
        const index = state.submissions.findIndex((s) => s.id === action.payload.id)
        if (index !== -1) {
          state.submissions[index] = action.payload
        }
        state.error = null
      })
      .addCase(gradeSubmission.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Fetch submissions by assignment
      .addCase(fetchSubmissionsByAssignment.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchSubmissionsByAssignment.fulfilled, (state, action) => {
        state.loading = false
        state.submissions = action.payload
        state.error = null
      })
      .addCase(fetchSubmissionsByAssignment.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  },
})

export const { clearError, clearCurrentAssignment, clearSubmissions } = assignmentsSlice.actions
export default assignmentsSlice.reducer
