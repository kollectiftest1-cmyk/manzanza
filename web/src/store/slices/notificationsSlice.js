import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import { notificationsAPI } from "../../services/api"

// Async thunks pour les appels API
export const fetchNotifications = createAsyncThunk(
  "notifications/fetchNotifications",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await notificationsAPI.getAll(params)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || "Erreur lors du chargement des notifications")
    }
  }
)

export const markAsRead = createAsyncThunk(
  "notifications/markAsRead",
  async (id, { rejectWithValue }) => {
    try {
      const response = await notificationsAPI.markAsRead(id)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || "Erreur lors du marquage de la notification")
    }
  }
)

export const markAllAsRead = createAsyncThunk(
  "notifications/markAllAsRead",
  async (_, { rejectWithValue }) => {
    try {
      const response = await notificationsAPI.markAllAsRead()
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || "Erreur lors du marquage des notifications")
    }
  }
)

export const createNotification = createAsyncThunk(
  "notifications/createNotification",
  async (notificationData, { rejectWithValue }) => {
    try {
      const response = await notificationsAPI.create(notificationData)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || "Erreur lors de la création de la notification")
    }
  }
)

export const deleteNotification = createAsyncThunk(
  "notifications/deleteNotification",
  async (id, { rejectWithValue }) => {
    try {
      await notificationsAPI.delete(id)
      return id
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || "Erreur lors de la suppression de la notification")
    }
  }
)

export const fetchAnnouncements = createAsyncThunk(
  "notifications/fetchAnnouncements",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await notificationsAPI.getAnnouncements(params)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || "Erreur lors du chargement des annonces")
    }
  }
)

const initialState = {
  notifications: [],
  announcements: [],
  unreadCount: 0,
  loading: false,
  error: null,
}

const notificationsSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    // Pour WebSocket - ajout de notification en temps réel
    addNotificationRealtime: (state, action) => {
      state.notifications.unshift(action.payload)
      if (!action.payload.read) {
        state.unreadCount++
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch notifications
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false
        state.notifications = action.payload.results || action.payload
        state.unreadCount = state.notifications.filter((n) => !n.read).length
        state.error = null
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Mark as read
      .addCase(markAsRead.fulfilled, (state, action) => {
        const notification = state.notifications.find((n) => n.id === action.payload.id)
        if (notification && !notification.read) {
          notification.read = true
          state.unreadCount = Math.max(0, state.unreadCount - 1)
        }
      })
      // Mark all as read
      .addCase(markAllAsRead.fulfilled, (state) => {
        state.notifications.forEach((n) => (n.read = true))
        state.unreadCount = 0
      })
      // Create notification
      .addCase(createNotification.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createNotification.fulfilled, (state, action) => {
        state.loading = false
        state.notifications.unshift(action.payload)
        if (!action.payload.read) {
          state.unreadCount++
        }
        state.error = null
      })
      .addCase(createNotification.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Delete notification
      .addCase(deleteNotification.fulfilled, (state, action) => {
        const notification = state.notifications.find((n) => n.id === action.payload)
        if (notification && !notification.read) {
          state.unreadCount = Math.max(0, state.unreadCount - 1)
        }
        state.notifications = state.notifications.filter((n) => n.id !== action.payload)
      })
      // Fetch announcements
      .addCase(fetchAnnouncements.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchAnnouncements.fulfilled, (state, action) => {
        state.loading = false
        state.announcements = action.payload.results || action.payload
        state.error = null
      })
      .addCase(fetchAnnouncements.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  },
})

export const { clearError, addNotificationRealtime } = notificationsSlice.actions
export default notificationsSlice.reducer
