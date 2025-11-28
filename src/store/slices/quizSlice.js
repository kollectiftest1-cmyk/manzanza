import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import { quizAPI } from "../../services/api"

// Async thunks pour les appels API
export const fetchQuizzes = createAsyncThunk(
  "quiz/fetchQuizzes",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await quizAPI.getAll(params)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || "Erreur lors du chargement des quiz")
    }
  }
)

export const fetchQuizById = createAsyncThunk(
  "quiz/fetchQuizById",
  async (id, { rejectWithValue }) => {
    try {
      const response = await quizAPI.getById(id)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || "Erreur lors du chargement du quiz")
    }
  }
)

export const fetchMyAttempts = createAsyncThunk(
  "quiz/fetchMyAttempts",
  async (_, { rejectWithValue }) => {
    try {
      const response = await quizAPI.getMyAttempts()
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || "Erreur lors du chargement des tentatives")
    }
  }
)

export const submitQuizAttempt = createAsyncThunk(
  "quiz/submitQuizAttempt",
  async ({ quizId, answers }, { rejectWithValue }) => {
    try {
      const response = await quizAPI.submitAttempt(quizId, { answers })
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || "Erreur lors de la soumission du quiz")
    }
  }
)

export const createQuiz = createAsyncThunk(
  "quiz/createQuiz",
  async (quizData, { rejectWithValue }) => {
    try {
      const response = await quizAPI.create(quizData)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || "Erreur lors de la création du quiz")
    }
  }
)

export const updateQuiz = createAsyncThunk(
  "quiz/updateQuiz",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await quizAPI.update(id, data)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || "Erreur lors de la mise à jour du quiz")
    }
  }
)

export const deleteQuiz = createAsyncThunk(
  "quiz/deleteQuiz",
  async (id, { rejectWithValue }) => {
    try {
      await quizAPI.delete(id)
      return id
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || "Erreur lors de la suppression du quiz")
    }
  }
)

export const addQuestion = createAsyncThunk(
  "quiz/addQuestion",
  async ({ quizId, questionData }, { rejectWithValue }) => {
    try {
      const response = await quizAPI.addQuestion(quizId, questionData)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || "Erreur lors de l'ajout de la question")
    }
  }
)

const initialState = {
  quizzes: [],
  currentQuiz: null,
  currentAttempt: null,
  myAttempts: [],
  userAnswers: {},
  score: null,
  loading: false,
  error: null,
}

const quizSlice = createSlice({
  name: "quiz",
  initialState,
  reducers: {
    setAnswer: (state, action) => {
      const { questionId, answer } = action.payload
      state.userAnswers[questionId] = answer
    },
    resetQuiz: (state) => {
      state.currentQuiz = null
      state.currentAttempt = null
      state.userAnswers = {}
      state.score = null
    },
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all quizzes
      .addCase(fetchQuizzes.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchQuizzes.fulfilled, (state, action) => {
        state.loading = false
        state.quizzes = action.payload.results || action.payload
        state.error = null
      })
      .addCase(fetchQuizzes.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Fetch quiz by ID
      .addCase(fetchQuizById.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchQuizById.fulfilled, (state, action) => {
        state.loading = false
        state.currentQuiz = action.payload
        state.userAnswers = {}
        state.score = null
        state.error = null
      })
      .addCase(fetchQuizById.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Fetch my attempts
      .addCase(fetchMyAttempts.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchMyAttempts.fulfilled, (state, action) => {
        state.loading = false
        state.myAttempts = action.payload
        state.error = null
      })
      .addCase(fetchMyAttempts.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Submit quiz attempt
      .addCase(submitQuizAttempt.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(submitQuizAttempt.fulfilled, (state, action) => {
        state.loading = false
        state.currentAttempt = action.payload
        state.score = action.payload.score
        state.error = null
      })
      .addCase(submitQuizAttempt.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Create quiz
      .addCase(createQuiz.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createQuiz.fulfilled, (state, action) => {
        state.loading = false
        state.quizzes.push(action.payload)
        state.error = null
      })
      .addCase(createQuiz.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Update quiz
      .addCase(updateQuiz.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updateQuiz.fulfilled, (state, action) => {
        state.loading = false
        const index = state.quizzes.findIndex((q) => q.id === action.payload.id)
        if (index !== -1) {
          state.quizzes[index] = action.payload
        }
        if (state.currentQuiz?.id === action.payload.id) {
          state.currentQuiz = action.payload
        }
        state.error = null
      })
      .addCase(updateQuiz.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Delete quiz
      .addCase(deleteQuiz.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(deleteQuiz.fulfilled, (state, action) => {
        state.loading = false
        state.quizzes = state.quizzes.filter((q) => q.id !== action.payload)
        state.error = null
      })
      .addCase(deleteQuiz.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Add question
      .addCase(addQuestion.fulfilled, (state, action) => {
        if (state.currentQuiz) {
          state.currentQuiz.questions = action.payload.questions
        }
      })
  },
})

export const { setAnswer, resetQuiz, clearError } = quizSlice.actions
export default quizSlice.reducer
