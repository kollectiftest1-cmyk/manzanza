import { createSlice } from "@reduxjs/toolkit"

const initialState = {
  quizzes: [
    {
      id: 1,
      title: "Quiz - Principes de Comptabilité",
      courseId: 1,
      questions: [
        {
          id: 1,
          question: "Qu'est-ce qu'un bilan comptable ?",
          options: [
            "Un document qui présente la situation financière",
            "Un document de gestion des stocks",
            "Un rapport de ventes",
            "Un plan de financement",
          ],
          correctAnswer: 0,
        },
        {
          id: 2,
          question: "Quelle est la formule de base de la comptabilité ?",
          options: [
            "Actif = Passif",
            "Actif = Passif + Capitaux propres",
            "Revenus = Charges",
            "Actif = Passif - Capitaux propres",
          ],
          correctAnswer: 1,
        },
      ],
      duration: 30,
      attempts: 3,
    },
  ],
  currentQuiz: null,
  userAnswers: {},
  score: null,
  loading: false,
}

const quizSlice = createSlice({
  name: "quiz",
  initialState,
  reducers: {
    setCurrentQuiz: (state, action) => {
      state.currentQuiz = state.quizzes.find((quiz) => quiz.id === action.payload)
      state.userAnswers = {}
      state.score = null
    },
    setAnswer: (state, action) => {
      const { questionId, answer } = action.payload
      state.userAnswers[questionId] = answer
    },
    calculateScore: (state) => {
      if (state.currentQuiz) {
        let correct = 0
        state.currentQuiz.questions.forEach((question) => {
          if (state.userAnswers[question.id] === question.correctAnswer) {
            correct++
          }
        })
        state.score = (correct / state.currentQuiz.questions.length) * 100
      }
    },
    resetQuiz: (state) => {
      state.currentQuiz = null
      state.userAnswers = {}
      state.score = null
    },
  },
})

export const { setCurrentQuiz, setAnswer, calculateScore, resetQuiz } = quizSlice.actions
export default quizSlice.reducer
