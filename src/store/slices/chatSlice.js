import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import { chatAPI } from "../../services/api"

// Async thunks pour les appels API
export const fetchChannels = createAsyncThunk(
  "chat/fetchChannels",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await chatAPI.getChannels(params)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || "Erreur lors du chargement des canaux")
    }
  }
)

export const fetchMessages = createAsyncThunk(
  "chat/fetchMessages",
  async (channelId, { rejectWithValue }) => {
    try {
      const response = await chatAPI.getMessages(channelId)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || "Erreur lors du chargement des messages")
    }
  }
)

export const sendMessage = createAsyncThunk(
  "chat/sendMessage",
  async ({ channelId, content }, { rejectWithValue }) => {
    try {
      const response = await chatAPI.sendMessage(channelId, { content })
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || "Erreur lors de l'envoi du message")
    }
  }
)

export const createChannel = createAsyncThunk(
  "chat/createChannel",
  async (channelData, { rejectWithValue }) => {
    try {
      const response = await chatAPI.createChannel(channelData)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || "Erreur lors de la création du canal")
    }
  }
)

export const addReaction = createAsyncThunk(
  "chat/addReaction",
  async ({ messageId, emoji }, { rejectWithValue }) => {
    try {
      const response = await chatAPI.addReaction(messageId, { emoji })
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || "Erreur lors de l'ajout de la réaction")
    }
  }
)

const initialState = {
  channels: [],
  activeChannel: null,
  messages: [],
  loading: false,
  error: null,
}

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setActiveChannel: (state, action) => {
      state.activeChannel = action.payload
    },
    clearMessages: (state) => {
      state.messages = []
    },
    clearError: (state) => {
      state.error = null
    },
    // Pour WebSocket - ajout de message en temps réel
    addMessageRealtime: (state, action) => {
      state.messages.push(action.payload)
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch channels
      .addCase(fetchChannels.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchChannels.fulfilled, (state, action) => {
        state.loading = false
        state.channels = action.payload.results || action.payload
        state.error = null
      })
      .addCase(fetchChannels.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Fetch messages
      .addCase(fetchMessages.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.loading = false
        state.messages = action.payload.results || action.payload
        state.error = null
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Send message
      .addCase(sendMessage.pending, (state) => {
        state.error = null
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.messages.push(action.payload)
        state.error = null
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.error = action.payload
      })
      // Create channel
      .addCase(createChannel.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createChannel.fulfilled, (state, action) => {
        state.loading = false
        state.channels.push(action.payload)
        state.error = null
      })
      .addCase(createChannel.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Add reaction
      .addCase(addReaction.fulfilled, (state, action) => {
        const message = state.messages.find((m) => m.id === action.payload.message_id)
        if (message) {
          message.reactions = action.payload.reactions
        }
      })
  },
})

export const { setActiveChannel, clearMessages, clearError, addMessageRealtime } = chatSlice.actions
export default chatSlice.reducer
