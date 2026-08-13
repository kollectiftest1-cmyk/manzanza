import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import { coursesAPI } from "../../services/api"

// Async thunks pour les appels API
export const fetchCourses = createAsyncThunk(
  "courses/fetchCourses",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await coursesAPI.getAll(params)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || "Erreur lors du chargement des cours")
    }
  }
)

export const fetchMyCourses = createAsyncThunk(
  "courses/fetchMyCourses",
  async (params = {}, { rejectWithValue }) => { // Added params for potential future pagination/filters for students
    try {
      const response = await coursesAPI.getMyCourses(params)
      console.log('my courses ',response.data);
      
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || "Erreur lors du chargement de vos cours")
    }
  }
)

export const fetchCourseById = createAsyncThunk(
  "courses/fetchCourseById",
  async (id, { rejectWithValue }) => {
    try {
      const response = await coursesAPI.getById(id)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || "Erreur lors du chargement du cours")
    }
  }
)

export const enrollCourse = createAsyncThunk(
  "courses/enrollCourse",
  async (courseId, { rejectWithValue }) => {
    try {
      const response = await coursesAPI.enroll(courseId)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || "Erreur lors de l'inscription au cours")
    }
  }
)

export const createCourse = createAsyncThunk(
  "courses/createCourse",
  async (courseData, { rejectWithValue }) => {
    try {
      const response = await coursesAPI.create(courseData)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || "Erreur lors de la création du cours")
    }
  }
)

export const updateCourse = createAsyncThunk(
  "courses/updateCourse",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await coursesAPI.update(id, data)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || "Erreur lors de la mise à jour du cours")
    }
  }
)

const initialState = {
  courses: [],
  selectedCourse: null,
  loading: false,
  error: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    pageSize: 10, // Default page size
  },
  filters: {
    section: '',
    filiere: '',
    auditoire: '',
    vacation: '',
    niveau: '',
  },
}

const coursesSlice = createSlice({
  name: "courses",
  initialState,
  reducers: {
    setCourses: (state, action) => {
      state.courses = action.payload
    },
    selectCourse: (state, action) => {
      state.selectedCourse = state.courses.find((course) => course.id === action.payload)
    },
    clearSelectedCourse: (state) => {
      state.selectedCourse = null
    },
    clearError: (state) => {
      state.error = null
    },
    setPage: (state, action) => {
      state.pagination.currentPage = action.payload;
    },
    setPageSize: (state, action) => {
      state.pagination.pageSize = action.payload;
    },
    setFilter: (state, action) => {
      const { filterName, value } = action.payload;
      state.filters[filterName] = value;
      state.pagination.currentPage = 1; // Reset to first page on filter change
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
      state.pagination.currentPage = 1; // Reset to first page on filter clear
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch all courses
      .addCase(fetchCourses.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchCourses.fulfilled, (state, action) => {
        state.loading = false
        state.courses = action.payload.results || action.payload // Assuming results for paginated
        state.pagination.totalItems = action.payload.count || action.payload.length; // Assuming count for paginated
        state.pagination.totalPages = Math.ceil(state.pagination.totalItems / state.pagination.pageSize);
        state.error = null
      })
      .addCase(fetchCourses.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Fetch my courses
      .addCase(fetchMyCourses.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchMyCourses.fulfilled, (state, action) => {
        state.loading = false
        state.courses = action.payload.results || action.payload // Assuming results for paginated
        state.pagination.totalItems = action.payload.count || action.payload.length; // Assuming count for paginated
        state.pagination.totalPages = Math.ceil(state.pagination.totalItems / state.pagination.pageSize);
        state.error = null
      })
      .addCase(fetchMyCourses.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Fetch course by ID
      .addCase(fetchCourseById.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchCourseById.fulfilled, (state, action) => {
        state.loading = false
        state.selectedCourse = action.payload
        state.error = null
      })
      .addCase(fetchCourseById.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Enroll in course
      .addCase(enrollCourse.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(enrollCourse.fulfilled, (state, action) => {
        state.loading = false
        state.error = null
      })
      .addCase(enrollCourse.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Create course
      .addCase(createCourse.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createCourse.fulfilled, (state, action) => {
        state.loading = false
        // Re-fetch courses to ensure pagination/filters are respected
        // Or add the new course to the current list if it matches filters
        // For simplicity, we'll just add it to the current view if not paginated
        // A full re-fetch might be better in a real app to ensure consistency
        state.courses.push(action.payload)
        state.error = null
      })
      .addCase(createCourse.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Update course
      .addCase(updateCourse.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updateCourse.fulfilled, (state, action) => {
        state.loading = false
        const index = state.courses.findIndex((course) => course.id === action.payload.id)
        if (index !== -1) {
          state.courses[index] = action.payload
        }
        if (state.selectedCourse?.id === action.payload.id) {
          state.selectedCourse = action.payload
        }
        state.error = null
      })
      .addCase(updateCourse.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  },
})

export const { setCourses, selectCourse, clearSelectedCourse, clearError, setPage, setPageSize, setFilter, clearFilters } = coursesSlice.actions
export default coursesSlice.reducer
