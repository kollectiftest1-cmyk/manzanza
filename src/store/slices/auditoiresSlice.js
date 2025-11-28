/**
 * Auditoires Redux Slice
 * Gère les auditoires virtuels et les promotions
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { auditoiresAPI } from '../../services/api';

// Async thunks
export const fetchAuditoires = createAsyncThunk(
  'auditoires/fetchAll',
  async (params, { rejectWithValue }) => {
    try {
      const response = await auditoiresAPI.getAll(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Erreur lors du chargement des auditoires');
    }
  }
);

export const fetchAuditoireById = createAsyncThunk(
  'auditoires/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await auditoiresAPI.getById(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Erreur lors du chargement de l\'auditoire');
    }
  }
);

export const createAuditoire = createAsyncThunk(
  'auditoires/create',
  async (data, { rejectWithValue }) => {
    try {
      const response = await auditoiresAPI.create(data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Erreur lors de la création de l\'auditoire');
    }
  }
);

export const updateAuditoire = createAsyncThunk(
  'auditoires/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await auditoiresAPI.update(id, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Erreur lors de la mise à jour de l\'auditoire');
    }
  }
);

export const deleteAuditoire = createAsyncThunk(
  'auditoires/delete',
  async (id, { rejectWithValue }) => {
    try {
      await auditoiresAPI.delete(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Erreur lors de la suppression de l\'auditoire');
    }
  }
);

export const fetchAuditoireStudents = createAsyncThunk(
  'auditoires/fetchStudents',
  async (id, { rejectWithValue }) => {
    try {
      const response = await auditoiresAPI.getStudents(id);
      return { auditoire_id: id, students: response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Erreur lors du chargement des étudiants');
    }
  }
);

export const fetchAuditoireCourses = createAsyncThunk(
  'auditoires/fetchCourses',
  async (id, { rejectWithValue }) => {
    try {
      const response = await auditoiresAPI.getCourses(id);
      return { auditoire_id: id, courses: response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Erreur lors du chargement des cours');
    }
  }
);

const auditoiresSlice = createSlice({
  name: 'auditoires',
  initialState: {
    auditoires: [],
    currentAuditoire: null,
    auditoireStudents: {},
    auditoireCourses: {},
    loading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentAuditoire: (state) => {
      state.currentAuditoire = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all auditoires
      .addCase(fetchAuditoires.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAuditoires.fulfilled, (state, action) => {
        state.loading = false;
        state.auditoires = action.payload;
      })
      .addCase(fetchAuditoires.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch auditoire by ID
      .addCase(fetchAuditoireById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAuditoireById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentAuditoire = action.payload;
      })
      .addCase(fetchAuditoireById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Create auditoire
      .addCase(createAuditoire.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createAuditoire.fulfilled, (state, action) => {
        state.loading = false;
        if (Array.isArray(state.auditoires)) {
          state.auditoires.push(action.payload);
        } else if (state.auditoires && Array.isArray(state.auditoires.results)) {
          state.auditoires.results.push(action.payload);
          state.auditoires.count += 1;
        }
      })
      .addCase(createAuditoire.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Update auditoire
      .addCase(updateAuditoire.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateAuditoire.fulfilled, (state, action) => {
        state.loading = false;
        const targetArray = Array.isArray(state.auditoires) ? state.auditoires : state.auditoires?.results;
        if (targetArray) {
          const index = targetArray.findIndex((a) => a.id === action.payload.id);
          if (index !== -1) {
            targetArray[index] = action.payload;
          }
        }
        if (state.currentAuditoire?.id === action.payload.id) {
          state.currentAuditoire = action.payload;
        }
      })
      .addCase(updateAuditoire.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Delete auditoire
      .addCase(deleteAuditoire.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteAuditoire.fulfilled, (state, action) => {
        state.loading = false;
        if (Array.isArray(state.auditoires)) {
          state.auditoires = state.auditoires.filter((a) => a.id !== action.payload);
        } else if (state.auditoires && Array.isArray(state.auditoires.results)) {
          state.auditoires.results = state.auditoires.results.filter((a) => a.id !== action.payload);
          state.auditoires.count -= 1;
        }
      })
      .addCase(deleteAuditoire.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch auditoire students
      .addCase(fetchAuditoireStudents.fulfilled, (state, action) => {
        state.auditoireStudents[action.payload.auditoire_id] = action.payload.students;
      })

      // Fetch auditoire courses
      .addCase(fetchAuditoireCourses.fulfilled, (state, action) => {
        state.auditoireCourses[action.payload.auditoire_id] = action.payload.courses;
      });
  },
});

export const { clearError, clearCurrentAuditoire } = auditoiresSlice.actions;
export default auditoiresSlice.reducer;
