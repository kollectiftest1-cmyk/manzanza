import api from './api';

const assignmentService = {
  // ============== ASSIGNMENTS (TP/TD) ==============

  // Liste des assignments
  getAssignments: (params) => api.get('/assignments/', { params }),

  // Détail d'un assignment
  getAssignmentDetail: (id) => api.get(`/assignments/${id}/`),

  // Créer un assignment
  createAssignment: (data) => api.post('/assignments/', data),

  // Mettre à jour un assignment
  updateAssignment: (id, data) => api.put(`/assignments/${id}/`, data),

  // Supprimer un assignment
  deleteAssignment: (id) => api.delete(`/assignments/${id}/`),

  // Publier un assignment
  publishAssignment: (id) => api.post(`/assignments/${id}/publish/`),

  // Mes assignments (enseignant/étudiant - filtrés par le backend)
  getMyAssignments: () => api.get('/assignments/'),

  // Assignments d'un cours
  getCourseAssignments: (courseId) => api.get('/assignments/', { params: { course: courseId } }),

  // Statistiques d'un assignment
  getAssignmentStats: (id) => api.get(`/assignments/${id}/stats/`),

  // Questions d'un assignment
  getAssignmentQuestions: (id) => api.get(`/assignments/${id}/questions/`),

  // Ajouter une question à un assignment
  addQuestion: (assignmentId, questionData) => {
    const formData = new FormData();

    // Ajouter les données de la question
    formData.append('question_text', questionData.question_text);
    formData.append('question_type', questionData.question_type);
    formData.append('points', questionData.points);
    formData.append('is_required', questionData.is_required);
    formData.append('case_sensitive', questionData.case_sensitive || false);

    if (questionData.explanation) {
      formData.append('explanation', questionData.explanation);
    }

    if (questionData.image) {
      formData.append('image', questionData.image);
    }

    // Ajouter les réponses correctes si applicable
    if (questionData.correct_answers && Array.isArray(questionData.correct_answers)) {
      formData.append('correct_answers', JSON.stringify(questionData.correct_answers));
    }

    // Ajouter les choix multiples si applicable
    if (questionData.choices && questionData.choices.length > 0) {
      formData.append('choices', JSON.stringify(questionData.choices));
    }

    return api.post(`/assignments/${assignmentId}/add_question/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },


  // ============== SUBMISSIONS ==============

  // Liste des soumissions
  getSubmissions: (params) => api.get('/assignments/submissions/', { params }),

  // Détail d'une soumission
  getSubmissionDetail: (id) => api.get(`/assignments/submissions/${id}/`),

  // Soumettre un assignment (étudiant)
  submitAssignment: (assignmentId, data) => {
    const formData = new FormData();

    // Ajouter l'ID de l'assignment
    formData.append('assignment', assignmentId);

    // Ajouter les réponses
    if (data.answers) {
      data.answers.forEach((answer, index) => {
        formData.append(`answers[${index}][question_id]`, answer.question_id);
        if (answer.answer_text) {
          formData.append(`answers[${index}][answer_text]`, answer.answer_text);
        }
        if (answer.answer_file) {
          formData.append(`answers[${index}][answer_file]`, answer.answer_file);
        }
        if (answer.selected_choices) {
          answer.selected_choices.forEach((choiceId) => {
            formData.append(`answers[${index}][selected_choices]`, choiceId);
          });
        }
      });
    }

    return api.post(`/assignments/submissions/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  // Mes soumissions (étudiant - filtrées par le backend)
  getMySubmissions: () => api.get('/assignments/submissions/'),

  // Soumissions d'un assignment (enseignant)
  getAssignmentSubmissions: (assignmentId) => api.get(`/assignments/${assignmentId}/submissions/`),

  // Ma soumission pour un assignment spécifique
  getMySubmission: (assignmentId) => api.get(`/assignments/${assignmentId}/my_submission/`),

  // Noter une soumission
  gradeSubmission: (submissionId, gradeData) => api.post(`/assignments/submissions/${submissionId}/grade/`, gradeData),

  // Correction automatique
  autoGradeSubmission: (submissionId) => api.post(`/assignments/submissions/${submissionId}/auto_grade/`),

  // Télécharger toutes les soumissions d'un assignment
  downloadAllSubmissions: (assignmentId) => api.get(`/assignments/submissions/${assignmentId}/download_all/`, { responseType: 'blob' }),
};

export default assignmentService;

// Exports nommés pour la compatibilité
export const getAssignments = assignmentService.getAssignments;
export const getAssignmentDetail = assignmentService.getAssignmentDetail;
export const createAssignment = assignmentService.createAssignment;
export const updateAssignment = assignmentService.updateAssignment;
export const deleteAssignment = assignmentService.deleteAssignment;
export const publishAssignment = assignmentService.publishAssignment;
export const getMyAssignments = assignmentService.getMyAssignments;
export const getCourseAssignments = assignmentService.getCourseAssignments;
export const getAssignmentStats = assignmentService.getAssignmentStats;
export const addQuestion = assignmentService.addQuestion;
export const getSubmissions = assignmentService.getSubmissions;
export const getSubmissionDetail = assignmentService.getSubmissionDetail;
export const submitAssignment = assignmentService.submitAssignment;
export const getMySubmissions = assignmentService.getMySubmissions;
export const getAssignmentSubmissions = assignmentService.getAssignmentSubmissions;
export const gradeSubmission = assignmentService.gradeSubmission;
export const autoGradeSubmission = assignmentService.autoGradeSubmission;
export const downloadAllSubmissions = assignmentService.downloadAllSubmissions;
