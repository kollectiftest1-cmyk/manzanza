import { configureStore } from "@reduxjs/toolkit"
import authReducer from "./slices/authSlice"
import coursesReducer from "./slices/coursesSlice"
import chatReducer from "./slices/chatSlice"
import quizReducer from "./slices/quizSlice"
import notificationsReducer from "./slices/notificationsSlice"
import assignmentsReducer from "./slices/assignmentsSlice"
import auditoiresReducer from "./slices/auditoiresSlice"
import paymentsReducer from "./slices/paymentsSlice"
import libraryReducer from "./slices/librarySlice"
import apparitoratReducer from "./slices/apparitoratSlice" // Import the new reducer

export const store = configureStore({
  reducer: {
    auth: authReducer,
    courses: coursesReducer,
    chat: chatReducer,
    quiz: quizReducer,
    notifications: notificationsReducer,
    assignments: assignmentsReducer,
    auditoires: auditoiresReducer,
    payments: paymentsReducer,
    library: libraryReducer,
    apparitorat: apparitoratReducer, // Add the new reducer
  },
})
