import api from './api';

const quizService = {
  // ============== QUIZZES ==============

  // Liste des quiz
  getQuizzes: (params) => api.get('/quiz/', { params }),

  // Détail d'un quiz
  getQuizDetail: (id) => api.get(`/quiz/${id}/`),

  // Créer un quiz
  createQuiz: (data) => api.post('/quiz/', data),

  // Mettre à jour un quiz
  updateQuiz: (id, data) => api.put(`/quiz/${id}/`, data),

  // Supprimer un quiz
  deleteQuiz: (id) => api.delete(`/quiz/${id}/`),

  // Publier un quiz
  publishQuiz: (id) => api.post(`/quiz/${id}/publish/`),

  // Mes quiz (enseignant/étudiant - filtrés par le backend)
  getMyQuizzes: () => api.get('/quiz/'),

  // Quiz d'un cours
  getCourseQuizzes: (courseId) => api.get('/quiz/', { params: { course: courseId } }),

  // Questions d'un quiz
  getQuizQuestions: (id) => api.get(`/quiz/${id}/questions/`),

  // Statistiques d'un quiz
  getQuizStats: (id) => api.get(`/quiz/${id}/stats/`),

  // Quiz disponibles pour un étudiant
  getAvailableQuizzes: () => api.get('/quiz/'),


  // ============== QUESTIONS ==============

  // Ajouter une question à un quiz
  addQuestion: (quizId, questionData) => {
    const formData = new FormData();

    // Ajouter les données de la question
    formData.append('question_text', questionData.question_text);
    formData.append('question_type', questionData.question_type);
    formData.append('points', questionData.points || 1);
    formData.append('is_required', questionData.is_required !== false);

    if (questionData.explanation) {
      formData.append('explanation', questionData.explanation);
    }

    if (questionData.image) {
      formData.append('image', questionData.image);
    }

    if (questionData.correct_answers) {
      formData.append('correct_answers', JSON.stringify(questionData.correct_answers));
    }

    if (questionData.case_sensitive !== undefined) {
      formData.append('case_sensitive', questionData.case_sensitive);
    }

    // Ajouter les choix comme JSON (le backend attend un tableau JSON)
    if (questionData.choices && questionData.choices.length > 0) {
      formData.append('choices', JSON.stringify(questionData.choices));
    }

    return api.post(`/quiz/${quizId}/add_question/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  // Mettre à jour une question
  updateQuestion: (quizId, questionId, questionData) => {
    const formData = new FormData();

    formData.append('question_id', questionId);

    if (questionData.question_text) {
      formData.append('question_text', questionData.question_text);
    }

    if (questionData.question_type) {
      formData.append('question_type', questionData.question_type);
    }

    if (questionData.points !== undefined) {
      formData.append('points', questionData.points);
    }

    if (questionData.is_required !== undefined) {
      formData.append('is_required', questionData.is_required);
    }

    if (questionData.explanation !== undefined) {
      formData.append('explanation', questionData.explanation);
    }

    if (questionData.image) {
      formData.append('image', questionData.image);
    }

    if (questionData.correct_answers) {
      formData.append('correct_answers', JSON.stringify(questionData.correct_answers));
    }

    if (questionData.case_sensitive !== undefined) {
      formData.append('case_sensitive', questionData.case_sensitive);
    }

    return api.put(`/quiz/${quizId}/update_question/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  // Supprimer une question
  deleteQuestion: (quizId, questionId) => api.delete(`/quiz/${quizId}/delete_question/`, { data: { question_id: questionId } }),

  // Réorganiser les questions
  reorderQuestions: (quizId, questionOrders) => api.post(`/quiz/${quizId}/reorder_questions/`, { question_orders: questionOrders }),


  // ============== ATTEMPTS ==============

  // Démarrer une tentative
  startAttempt: (quizId) => api.post(`/quiz/${quizId}/start_attempt/`),

  // Soumettre une tentative
  submitAttempt: (attemptId, answers) => {
    console.log('Submitting answers:', answers);

    // Vérifier s'il y a des fichiers
    const hasFiles = answers.some(answer => answer.answer_file);

    if (hasFiles) {
      // Utiliser FormData si des fichiers sont présents
      const formData = new FormData();
      formData.append('answers', JSON.stringify(answers));

      // Ajouter les fichiers séparément
      answers.forEach((answer, index) => {
        if (answer.answer_file) {
          formData.append(`answer_files[${index}]`, answer.answer_file);
        }
      });

      return api.post(`/quiz/attempts/${attemptId}/submit/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    } else {
      // Utiliser JSON si pas de fichiers
      return api.post(`/quiz/attempts/${attemptId}/submit/`, { answers });
    }
  },

  // Sauvegarder les réponses (brouillon)
  saveAnswers: (attemptId, answers) => api.post(`/quiz/attempts/${attemptId}/save_answers/`, { answers }),

  // Mes tentatives (étudiant - filtrées par le backend)
  getMyAttempts: () => api.get('/quiz/attempts/'),

  // Tentatives d'un quiz (enseignant)
  getQuizAttempts: (quizId) => api.get(`/quiz/${quizId}/attempts/`),

  // Détail d'une tentative
  getAttemptDetail: (id) => api.get(`/quiz/attempts/${id}/`),

  // Noter une tentative (correction manuelle)
  gradeAttempt: (attemptId, gradeData) => api.post(`/quiz/attempts/${attemptId}/grade/`, gradeData),

  // Vérifier le statut d'une tentative
  checkAttemptStatus: (attemptId) => api.get(`/quiz/attempts/${attemptId}/status/`),
};

export default quizService;

// Exports nommés pour la compatibilité
export const getQuizzes = quizService.getQuizzes;
export const getQuizDetail = quizService.getQuizDetail;
export const createQuiz = quizService.createQuiz;
export const updateQuiz = quizService.updateQuiz;
export const deleteQuiz = quizService.deleteQuiz;
export const publishQuiz = quizService.publishQuiz;
export const getMyQuizzes = quizService.getMyQuizzes;
export const getCourseQuizzes = quizService.getCourseQuizzes;
export const getQuizStats = quizService.getQuizStats;
export const getAvailableQuizzes = quizService.getAvailableQuizzes;
export const addQuestion = quizService.addQuestion;
export const updateQuestion = quizService.updateQuestion;
export const deleteQuestion = quizService.deleteQuestion;
export const reorderQuestions = quizService.reorderQuestions;
export const startAttempt = quizService.startAttempt;
export const submitAttempt = quizService.submitAttempt;
export const saveAnswers = quizService.saveAnswers;
export const getMyAttempts = quizService.getMyAttempts;
export const getQuizAttempts = quizService.getQuizAttempts;
export const getAttemptDetail = quizService.getAttemptDetail;
export const gradeAttempt = quizService.gradeAttempt;
export const checkAttemptStatus = quizService.checkAttemptStatus;
