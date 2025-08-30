import { createSlice } from "@reduxjs/toolkit"

const initialState = {
  notifications: [
    {
      id: 1,
      title: "Nouveau TP disponible",
      message: "Le TP de Comptabilité Générale est maintenant disponible",
      type: "info",
      read: false,
      timestamp: "2024-02-08 09:00",
    },
    {
      id: 2,
      title: "Rappel Quiz",
      message: "N'oubliez pas le quiz d'Économie demain à 14h",
      type: "warning",
      read: false,
      timestamp: "2024-02-07 16:30",
    },
    {
      id: 3,
      title: "Note disponible",
      message: "Votre note pour le TP1 de Mathématiques est disponible",
      type: "success",
      read: true,
      timestamp: "2024-02-06 11:15",
    },
  ],
  unreadCount: 2,
}

const notificationsSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    addNotification: (state, action) => {
      state.notifications.unshift({
        ...action.payload,
        id: Date.now(),
        read: false,
        timestamp: new Date().toLocaleString("fr-FR"),
      })
      state.unreadCount++
    },
    markAsRead: (state, action) => {
      const notification = state.notifications.find((n) => n.id === action.payload)
      if (notification && !notification.read) {
        notification.read = true
        state.unreadCount--
      }
    },
    markAllAsRead: (state) => {
      state.notifications.forEach((n) => (n.read = true))
      state.unreadCount = 0
    },
  },
})

export const { addNotification, markAsRead, markAllAsRead } = notificationsSlice.actions
export default notificationsSlice.reducer
