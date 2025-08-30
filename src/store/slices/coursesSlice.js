import { createSlice } from "@reduxjs/toolkit"

const initialState = {
  courses: [
    {
      id: 1,
      name: "Comptabilité Générale",
      credits: 6,
      teacher: "Prof. Martin Dubois",
      auditoire: "1ère Licence Finance",
      description: "Introduction aux principes fondamentaux de la comptabilité",
      students: 45,
      progress: 65,
      assignments: [
        { id: 1, title: "TP1 - Bilan comptable", dueDate: "2024-02-15", type: "TP" },
        { id: 2, title: "Quiz - Principes de base", dueDate: "2024-02-10", type: "Quiz" },
      ],
    },
    {
      id: 2,
      name: "Économie",
      credits: 4,
      teacher: "Prof. Sarah Johnson",
      auditoire: "1ère Licence Finance",
      description: "Microéconomie et macroéconomie appliquées",
      students: 42,
      progress: 40,
      assignments: [
        { id: 3, title: "TD1 - Offre et demande", dueDate: "2024-02-20", type: "TD" },
        { id: 4, title: "Quiz - Marchés financiers", dueDate: "2024-02-12", type: "Quiz" },
      ],
    },
    {
      id: 3,
      name: "Mathématiques Financières",
      credits: 5,
      teacher: "Prof. Jean-Pierre Moreau",
      auditoire: "1ère Licence Finance",
      description: "Calculs financiers et statistiques appliquées",
      students: 38,
      progress: 75,
      assignments: [{ id: 5, title: "TP2 - Calcul d'intérêts", dueDate: "2024-02-18", type: "TP" }],
    },
  ],
  selectedCourse: null,
  loading: false,
  error: null,
}

const coursesSlice = createSlice({
  name: "courses",
  initialState,
  reducers: {
    setCourses: (state, action) => {
      state.courses = action.payload
    },
    selectCourse: (state, action) => {
      state.selectedCourse = state.courses.find((course) => course.id === action.payload)
    },
    addCourse: (state, action) => {
      state.courses.push(action.payload)
    },
    updateCourse: (state, action) => {
      const index = state.courses.findIndex((course) => course.id === action.payload.id)
      if (index !== -1) {
        state.courses[index] = { ...state.courses[index], ...action.payload }
      }
    },
    setLoading: (state, action) => {
      state.loading = action.payload
    },
    setError: (state, action) => {
      state.error = action.payload
    },
  },
})

export const { setCourses, selectCourse, addCourse, updateCourse, setLoading, setError } = coursesSlice.actions
export default coursesSlice.reducer
