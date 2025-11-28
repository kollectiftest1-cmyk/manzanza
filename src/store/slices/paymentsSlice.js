/**
 * Payments Redux Slice
 * Gère les paiements et les frais étudiants
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { paymentsAPI } from '../../services/api';

// Async thunks
export const fetchPayments = createAsyncThunk(
  'payments/fetchAll',
  async (params, { rejectWithValue }) => {
    try {
      const response = await paymentsAPI.getPayments(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Erreur lors du chargement des paiements');
    }
  }
);

export const fetchMyFees = createAsyncThunk(
  'payments/fetchMyFees',
  async (_, { rejectWithValue }) => {
    try {
      const response = await paymentsAPI.getMyFees();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Erreur lors du chargement des frais');
    }
  }
);

export const fetchStudentFees = createAsyncThunk(
  'payments/fetchStudentFees',
  async (params, { rejectWithValue }) => {
    try {
      const response = await paymentsAPI.getStudentFees(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Erreur lors du chargement des frais étudiants');
    }
  }
);

export const createPayment = createAsyncThunk(
  'payments/create',
  async (data, { rejectWithValue }) => {
    try {
      const response = await paymentsAPI.createPayment(data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Erreur lors de la création du paiement');
    }
  }
);

export const confirmPayment = createAsyncThunk(
  'payments/confirm',
  async (id, { rejectWithValue }) => {
    try {
      const response = await paymentsAPI.confirmPayment(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Erreur lors de la confirmation du paiement');
    }
  }
);

export const rejectPayment = createAsyncThunk(
  'payments/reject',
  async (id, { rejectWithValue }) => {
    try {
      const response = await paymentsAPI.rejectPayment(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Erreur lors du rejet du paiement');
    }
  }
);

export const fetchPaymentStatistics = createAsyncThunk(
  'payments/fetchStatistics',
  async (_, { rejectWithValue }) => {
    try {
      const response = await paymentsAPI.getStatistics();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Erreur lors du chargement des statistiques');
    }
  }
);

export const fetchFeeTypes = createAsyncThunk(
  'payments/fetchFeeTypes',
  async (params, { rejectWithValue }) => {
    try {
      const response = await paymentsAPI.getFeeTypes(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Erreur lors du chargement des types de frais');
    }
  }
);

const paymentsSlice = createSlice({
  name: 'payments',
  initialState: {
    payments: [],
    myFees: [],
    studentFees: [],
    feeTypes: [],
    statistics: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch payments
      .addCase(fetchPayments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPayments.fulfilled, (state, action) => {
        state.loading = false;
        state.payments = action.payload;
      })
      .addCase(fetchPayments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch my fees
      .addCase(fetchMyFees.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyFees.fulfilled, (state, action) => {
        state.loading = false;
        state.myFees = action.payload;
      })
      .addCase(fetchMyFees.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch student fees
      .addCase(fetchStudentFees.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStudentFees.fulfilled, (state, action) => {
        state.loading = false;
        state.studentFees = action.payload;
      })
      .addCase(fetchStudentFees.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Create payment
      .addCase(createPayment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createPayment.fulfilled, (state, action) => {
        state.loading = false;
        state.payments.unshift(action.payload);
      })
      .addCase(createPayment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Confirm payment
      .addCase(confirmPayment.fulfilled, (state, action) => {
        const index = state.payments.findIndex((p) => p.id === action.payload.id);
        if (index !== -1) {
          state.payments[index] = action.payload;
        }
      })

      // Reject payment
      .addCase(rejectPayment.fulfilled, (state, action) => {
        const index = state.payments.findIndex((p) => p.id === action.payload.id);
        if (index !== -1) {
          state.payments[index] = action.payload;
        }
      })

      // Fetch statistics
      .addCase(fetchPaymentStatistics.fulfilled, (state, action) => {
        state.statistics = action.payload;
      })

      // Fetch fee types
      .addCase(fetchFeeTypes.fulfilled, (state, action) => {
        state.feeTypes = action.payload;
      });
  },
});

export const { clearError } = paymentsSlice.actions;
export default paymentsSlice.reducer;
