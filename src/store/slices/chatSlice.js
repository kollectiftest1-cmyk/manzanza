import { createSlice } from "@reduxjs/toolkit"

const initialState = {
  messages: [
    {
      id: 1,
      sender: "Prof. Martin Dubois",
      content: "Bonjour à tous, n'oubliez pas le TP de comptabilité pour vendredi !",
      timestamp: "2024-02-08 10:30",
      courseId: 1,
      type: "received",
    },
    {
      id: 2,
      sender: "Vous",
      content: "Merci professeur, j'ai une question sur l'exercice 3.",
      timestamp: "2024-02-08 10:35",
      courseId: 1,
      type: "sent",
    },
    {
      id: 3,
      sender: "IA Assistant",
      content: "Je peux vous aider avec les questions de comptabilité. Quelle est votre question ?",
      timestamp: "2024-02-08 10:36",
      courseId: 1,
      type: "received",
      isAI: true,
    },
  ],
  activeChat: null,
  loading: false,
}

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    addMessage: (state, action) => {
      state.messages.push({
        ...action.payload,
        id: Date.now(),
        timestamp: new Date().toLocaleString("fr-FR"),
      })
    },
    setActiveChat: (state, action) => {
      state.activeChat = action.payload
    },
    setMessages: (state, action) => {
      state.messages = action.payload
    },
    setLoading: (state, action) => {
      state.loading = action.payload
    },
  },
})

export const { addMessage, setActiveChat, setMessages, setLoading } = chatSlice.actions
export default chatSlice.reducer
