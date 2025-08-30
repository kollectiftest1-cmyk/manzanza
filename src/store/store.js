import { configureStore } from "@reduxjs/toolkit"
import authReducer from "./slices/authSlice"
import coursesReducer from "./slices/coursesSlice"
import chatReducer from "./slices/chatSlice"
import quizReducer from "./slices/quizSlice"
import notificationsReducer from "./slices/notificationsSlice"

export const store = configureStore({
  reducer: {
    auth: authReducer,
    courses: coursesReducer,
    chat: chatReducer,
    quiz: quizReducer,
    notifications: notificationsReducer,
  },
})
