import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'

// Base URL for your API
const API_URL = '/api/apparitorat' // Adjust this to your actual API endpoint

// Async Thunks
export const fetchRooms = createAsyncThunk('apparitorat/fetchRooms', async (_, { rejectWithValue }) => {
  try {
    const response = await axios.get(`${API_URL}/rooms/`)
    return response.data 
  } catch (error) {
    return rejectWithValue(error.response?.data || error.message)
  }
})

export const createRoom = createAsyncThunk('apparitorat/createRoom', async (roomData, { rejectWithValue }) => {
  try {
    const response = await axios.post(`${API_URL}/rooms/`, roomData)
    return response.data
  } catch (error) {
    return rejectWithValue(error.response?.data || error.message)
  }
})

export const fetchReservations = createAsyncThunk('apparitorat/fetchReservations', async (_, { rejectWithValue }) => {
  try {
    const response = await axios.get(`${API_URL}/reservations/?status=active`) // Fetch only active/non-archived reservations
    return response.data
  } catch (error) {
    return rejectWithValue(error.response?.data || error.message)
  }
})

export const fetchArchivedReservations = createAsyncThunk('apparitorat/fetchArchivedReservations', async (_, { rejectWithValue }) => {
  try {
    const response = await axios.get(`${API_URL}/reservations/?status=archived`) // Fetch archived reservations
    return response.data
  } catch (error) {
    return rejectWithValue(error.response?.data || error.message)
  }
})

export const createReservation = createAsyncThunk('apparitorat/createReservation', async (reservationData, { rejectWithValue }) => {
  try {
    const response = await axios.post(`${API_URL}/reservations/`, reservationData)
    return response.data
  } catch (error) {
    return rejectWithValue(error.response?.data || error.message)
  }
})

export const updateReservationStatus = createAsyncThunk(
  'apparitorat/updateReservationStatus',
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`${API_URL}/reservations/${id}/`, { status })
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message)
    }
  }
)

// Slice Definition
const apparitoratSlice = createSlice({
  name: 'apparitorat',
  initialState: {
    rooms: [],
    reservations: [],
    archivedReservations: [], // New state for archived reservations
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch Rooms
      .addCase(fetchRooms.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchRooms.fulfilled, (state, action) => {
        state.loading = false
        state.rooms = Array.isArray(action.payload) ? action.payload : [] // Ensure it's an array
      })
      .addCase(fetchRooms.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || 'Failed to fetch rooms'
      })
      // Create Room
      .addCase(createRoom.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createRoom.fulfilled, (state, action) => {
        state.loading = false
        state.rooms.push(action.payload)
      })
      .addCase(createRoom.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || 'Failed to create room'
      })
      // Fetch Reservations
      .addCase(fetchReservations.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchReservations.fulfilled, (state, action) => {
        state.loading = false
        state.reservations = Array.isArray(action.payload) ? action.payload : [] // Ensure it's an array
      })
      .addCase(fetchReservations.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || 'Failed to fetch reservations'
      })
      // Fetch Archived Reservations
      .addCase(fetchArchivedReservations.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchArchivedReservations.fulfilled, (state, action) => {
        state.loading = false
        state.archivedReservations = Array.isArray(action.payload) ? action.payload : [] // Ensure it's an array
      })
      .addCase(fetchArchivedReservations.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || 'Failed to fetch archived reservations'
      })
      // Create Reservation
      .addCase(createReservation.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createReservation.fulfilled, (state, action) => {
        state.loading = false
        state.reservations.push(action.payload)
      })
      .addCase(createReservation.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || 'Failed to create reservation'
      })
      // Update Reservation Status
      .addCase(updateReservationStatus.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updateReservationStatus.fulfilled, (state, action) => {
        state.loading = false
        // Remove from current reservations if status is 'archived' or 'rejected'
        state.reservations = state.reservations.filter((res) => res.id !== action.payload.id)
        
        // Add to archived if status is 'archived'
        if (action.payload.status === 'archived') {
          state.archivedReservations.push(action.payload)
        } else {
          // Otherwise, update or add to current reservations (e.g., if status changed to 'confirmed')
          const index = state.reservations.findIndex((res) => res.id === action.payload.id)
          if (index !== -1) {
            state.reservations[index] = action.payload
          } else {
            // If it wasn't in current reservations (e.g., fetched as pending, then confirmed)
            // This might need refinement based on how your backend handles active/archived separation
            // For now, if it's not archived, we assume it should be in the active list.
            if (action.payload.status !== 'rejected') { // Don't add rejected back to active list
              state.reservations.push(action.payload);
            }
          }
        }

        // Also update archivedReservations if the updated item was there
        const archivedIndex = state.archivedReservations.findIndex((res) => res.id === action.payload.id);
        if (archivedIndex !== -1 && action.payload.status !== 'archived') {
            state.archivedReservations.splice(archivedIndex, 1);
        }
      })
      .addCase(updateReservationStatus.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || 'Failed to update reservation status'
      })
  },
})

export default apparitoratSlice.reducer
