import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { usersAPI } from '../../services/api';

// Async thunks
export const fetchStudents = createAsyncThunk(
  'users/fetchStudents',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await usersAPI.getStudents(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'Erreur lors du chargement des étudiants');
    }
  }
);

export const fetchTeachers = createAsyncThunk(
  'users/fetchTeachers',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await usersAPI.getTeachers(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'Erreur lors du chargement des enseignants');
    }
  }
);

const usersSlice = createSlice({
  name: 'users',
  initialState: {
    students: {
      list: [],
      loading: false,
      error: null,
      pagination: { currentPage: 1, totalPages: 1, totalItems: 0, pageSize: 10 },
    },
    teachers: {
      list: [],
      loading: false,
      error: null,
      pagination: { currentPage: 1, totalPages: 1, totalItems: 0, pageSize: 10 },
    },
  },
  reducers: {
    // Potentially add reducers for setting filters, page, etc. if needed
  },
  extraReducers: (builder) => {
    builder
      // Fetch Students
      .addCase(fetchStudents.pending, (state) => {
        state.students.loading = true;
        state.students.error = null;
      })
      .addCase(fetchStudents.fulfilled, (state, action) => {
        state.students.loading = false;
        state.students.list = action.payload.results || action.payload;
        state.students.pagination.totalItems = action.payload.count || action.payload.length;
        state.students.pagination.totalPages = Math.ceil(state.students.pagination.totalItems / state.students.pagination.pageSize);
      })
      .addCase(fetchStudents.rejected, (state, action) => {
        state.students.loading = false;
        state.students.error = action.payload;
      })
      // Fetch Teachers
      .addCase(fetchTeachers.pending, (state) => {
        state.teachers.loading = true;
        state.teachers.error = null;
      })
      .addCase(fetchTeachers.fulfilled, (state, action) => {
        state.teachers.loading = false;
        state.teachers.list = action.payload.results || action.payload;
        state.teachers.pagination.totalItems = action.payload.count || action.payload.length;
        state.teachers.pagination.totalPages = Math.ceil(state.teachers.pagination.totalItems / state.teachers.pagination.pageSize);
      })
      .addCase(fetchTeachers.rejected, (state, action) => {
        state.teachers.loading = false;
        state.teachers.error = action.payload;
      });
  },
});

export default usersSlice.reducer;
