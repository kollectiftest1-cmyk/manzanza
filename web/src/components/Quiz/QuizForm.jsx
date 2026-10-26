import React, { useState, useEffect } from 'react';
import { Plus, X, Trash2, GripVertical, Image as ImageIcon, AlertCircle, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import quizService from '../../services/quizService';
import courseService from '../../services/courseService';
import { notify, notifyError } from "../../utils/notify"

const QuizForm = ({ quiz, onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    course: '',
    start_date: '',
    end_date: '',
    duration_minutes: 60,
    max_points: 100,
    shuffle_questions: false,
    shuffle_choices: false,
    show_correct_answers: true,
    allow_multiple_attempts: false,
    max_attempts: 1,
    status: 'draft'
  });
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState({
    question_text: '',
    question_type: 'single_choice',
    points: 1,
    is_required: true,
    explanation: '',
    image: null,
    correct_answers: [],
    case_sensitive: false,
    choices: []
  });

  useEffect(() => {
    loadCourses();
    if (quiz) {
      setFormData({
        title: quiz.title || '',
        description: quiz.description || '',
        course: quiz.course?.id || quiz.course || '',
        start_date: quiz.start_date ? quiz.start_date.slice(0, 16) : '',
        end_date: quiz.end_date ? quiz.end_date.slice(0, 16) : '',
        duration_minutes: quiz.duration_minutes || 60,
        max_points: quiz.max_points || 100,
        shuffle_questions: quiz.shuffle_questions || false,
        shuffle_choices: quiz.shuffle_choices || false,
        show_correct_answers: quiz.show_correct_answers !== false,
        allow_multiple_attempts: quiz.allow_multiple_attempts || false,
        max_attempts: quiz.max_attempts || 1,
        status: quiz.status || 'draft'
      });
      if (quiz.questions) {
        setQuestions(quiz.questions);
      }
    }
  }, [quiz]);

  const loadCourses = async () => {
    try {
      const response = await courseService.getMyCourses();
      console.log('lok ',response.data);
      
      setCourses(response.data.results);
    } catch (error) {
      console.error('Erreur lors du chargement des cours:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleQuestionChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    setCurrentQuestion(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'file' ? files[0] : value
    }));
  };

  const addChoice = () => {
    setCurrentQuestion(prev => ({
      ...prev,
      choices: [...prev.choices, { choice_text: '', is_correct: false, points_percentage: 100 }]
    }));
  };

  const updateChoice = (index, field, value) => {
    setCurrentQuestion(prev => {
      const newChoices = [...prev.choices];

      // Pour single_choice, si on marque un choix comme correct, décocher les autres
      if (field === 'is_correct' && value && prev.question_type === 'single_choice') {
        newChoices.forEach((choice, i) => {
          choice.is_correct = i === index;
        });
      } else {
        newChoices[index] = { ...newChoices[index], [field]: value };
      }

      return { ...prev, choices: newChoices };
    });
  };

  const removeChoice = (index) => {
    setCurrentQuestion(prev => ({
      ...prev,
      choices: prev.choices.filter((_, i) => i !== index)
    }));
  };

  const addQuestion = () => {
    if (!currentQuestion.question_text.trim()) {
      notify.warning('Veuillez entrer une question');
      return;
    }

    const requiresChoices = ['single_choice', 'multiple_choice', 'true_false'];
    if (requiresChoices.includes(currentQuestion.question_type)) {
      if (currentQuestion.choices.length === 0) {
        notify.warning('Veuillez ajouter au moins un choix');
        return;
      }
      const hasCorrect = currentQuestion.choices.some(c => c.is_correct);
      if (!hasCorrect) {
        notify.warning('Veuillez marquer au moins une réponse correcte');
        return;
      }
    }

    setQuestions(prev => [...prev, { ...currentQuestion, order: prev.length }]);
    setCurrentQuestion({
      question_text: '',
      question_type: 'single_choice',
      points: 1,
      is_required: true,
      explanation: '',
      image: null,
      correct_answers: [],
      case_sensitive: false,
      choices: []
    });
  };

  const removeQuestion = (index) => {
    setQuestions(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let savedQuiz;
      if (quiz?.id) {
        const response = await quizService.updateQuiz(quiz.id, formData);
        savedQuiz = response.data;
      } else {
        const response = await quizService.createQuiz(formData);
        savedQuiz = response.data;
      }

      // Ajouter les questions
      let questionsAdded = 0;
      let questionsFailed = 0;

      if (questions.length > 0) {
        for (const question of questions) {
          if (!question.id) {
            try {
              await quizService.addQuestion(savedQuiz.id, question);
              questionsAdded++;
            } catch (qError) {
              console.error('Erreur ajout question:', qError);
              questionsFailed++;
            }
          }
        }
      }

      // Message de succès avec détails
      let successMessage = quiz ? 'Quiz mis à jour avec succès!' : 'Quiz créé avec succès!';
      if (questions.length > 0) {
        if (questionsFailed > 0) {
          successMessage += `\n${questionsAdded} question(s) ajoutée(s), ${questionsFailed} échouée(s).`;
        } else {
          successMessage += `\n${questionsAdded} question(s) ajoutée(s).`;
        }
      }

      notify.info(successMessage);
      if (onSuccess) onSuccess(savedQuiz);
    } catch (error) {
      console.error('Erreur:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Erreur lors de la sauvegarde du quiz';
      notifyError(error, `Erreur: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const getQuestionTypeLabel = (type) => {
    const types = {
      single_choice: 'Choix unique (QCM)',
      multiple_choice: 'Choix multiples',
      true_false: 'Vrai/Faux',
      short_answer: 'Réponse courte',
      long_answer: 'Réponse longue',
      file_upload: 'Upload de fichier',
      matching: 'Appariement',
      ordering: 'Mise en ordre'
    };
    return types[type] || type;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(249,250,251,0.95) 100%)',
        borderRadius: '16px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.08)',
        padding: '2rem',
        border: '1px solid rgba(0,0,0,0.05)'
      }}
    >
      <motion.h2
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
        style={{
          fontSize: '1.875rem',
          fontWeight: '700',
          marginBottom: '2rem',
          background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}
      >
        {quiz ? 'Modifier le quiz' : 'Créer un nouveau quiz'}
      </motion.h2>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Informations de base */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}
        >
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              Titre du quiz *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                border: '2px solid rgba(0,0,0,0.1)',
                borderRadius: '8px',
                fontSize: '0.95rem',
                transition: 'all 0.3s ease',
                background: 'white'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--color-primary)';
                e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(0,0,0,0.1)';
                e.target.style.boxShadow = 'none';
              }}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows="3"
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                border: '2px solid rgba(0,0,0,0.1)',
                borderRadius: '8px',
                fontSize: '0.95rem',
                transition: 'all 0.3s ease',
                background: 'white',
                fontFamily: 'inherit',
                resize: 'vertical'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--color-primary)';
                e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(0,0,0,0.1)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}
        >

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              Cours *
            </label>
            <select
              name="course"
              value={formData.course}
              onChange={handleInputChange}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                border: '2px solid rgba(0,0,0,0.1)',
                borderRadius: '8px',
                fontSize: '0.95rem',
                transition: 'all 0.3s ease',
                background: 'white'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--color-primary)';
                e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(0,0,0,0.1)';
                e.target.style.boxShadow = 'none';
              }}
              required
            >
              <option value="">Sélectionner un cours</option>
              {courses.map(course => (
                <option key={course.id} value={course.id}>
                  {course.name || course.nom}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              Durée (minutes) *
            </label>
            <input
              type="number"
              name="duration_minutes"
              value={formData.duration_minutes}
              onChange={handleInputChange}
              min="1"
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                border: '2px solid rgba(0,0,0,0.1)',
                borderRadius: '8px',
                fontSize: '0.95rem',
                transition: 'all 0.3s ease',
                background: 'white'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--color-primary)';
                e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(0,0,0,0.1)';
                e.target.style.boxShadow = 'none';
              }}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              Date de début
            </label>
            <input
              type="datetime-local"
              name="start_date"
              value={formData.start_date}
              onChange={handleInputChange}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                border: '2px solid rgba(0,0,0,0.1)',
                borderRadius: '8px',
                fontSize: '0.95rem',
                transition: 'all 0.3s ease',
                background: 'white'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--color-primary)';
                e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(0,0,0,0.1)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              Date de fin
            </label>
            <input
              type="datetime-local"
              name="end_date"
              value={formData.end_date}
              onChange={handleInputChange}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                border: '2px solid rgba(0,0,0,0.1)',
                borderRadius: '8px',
                fontSize: '0.95rem',
                transition: 'all 0.3s ease',
                background: 'white'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--color-primary)';
                e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(0,0,0,0.1)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              Note maximale (sur 100)
            </label>
            <input
              type="number"
              name="max_points"
              value={formData.max_points}
              onChange={handleInputChange}
              min="0"
              max="100"
              step="0.01"
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                border: '2px solid rgba(0,0,0,0.1)',
                borderRadius: '8px',
                fontSize: '0.95rem',
                transition: 'all 0.3s ease',
                background: 'white'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--color-primary)';
                e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(0,0,0,0.1)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              Nombre de tentatives
            </label>
            <input
              type="number"
              name="max_attempts"
              value={formData.max_attempts}
              onChange={handleInputChange}
              min="1"
              disabled={!formData.allow_multiple_attempts}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                border: '2px solid rgba(0,0,0,0.1)',
                borderRadius: '8px',
                fontSize: '0.95rem',
                transition: 'all 0.3s ease',
                background: formData.allow_multiple_attempts ? 'white' : 'rgba(0,0,0,0.05)',
                cursor: formData.allow_multiple_attempts ? 'text' : 'not-allowed'
              }}
              onFocus={(e) => {
                if (formData.allow_multiple_attempts) {
                  e.target.style.borderColor = 'var(--color-primary)';
                  e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                }
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(0,0,0,0.1)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>
        </motion.div>

        {/* Options */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          style={{
            padding: '1.5rem',
            background: 'linear-gradient(135deg, rgba(249, 250, 251, 0.8) 0%, rgba(243, 244, 246, 0.8) 100%)',
            borderRadius: '12px',
            border: '1px solid rgba(0,0,0,0.05)'
          }}
        >
          <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '1rem' }}>Options du quiz</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                name="shuffle_questions"
                checked={formData.shuffle_questions}
                onChange={handleInputChange}
                style={{ width: '18px', height: '18px', accentColor: 'var(--color-primary)', cursor: 'pointer' }}
              />
              <span style={{ marginLeft: '0.5rem', fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: '500' }}>Mélanger les questions</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                name="shuffle_choices"
                checked={formData.shuffle_choices}
                onChange={handleInputChange}
                style={{ width: '18px', height: '18px', accentColor: 'var(--color-primary)', cursor: 'pointer' }}
              />
              <span style={{ marginLeft: '0.5rem', fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: '500' }}>Mélanger les choix</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                name="show_correct_answers"
                checked={formData.show_correct_answers}
                onChange={handleInputChange}
                style={{ width: '18px', height: '18px', accentColor: 'var(--color-primary)', cursor: 'pointer' }}
              />
              <span style={{ marginLeft: '0.5rem', fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: '500' }}>Afficher les bonnes réponses</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                name="allow_multiple_attempts"
                checked={formData.allow_multiple_attempts}
                onChange={handleInputChange}
                style={{ width: '18px', height: '18px', accentColor: 'var(--color-primary)', cursor: 'pointer' }}
              />
              <span style={{ marginLeft: '0.5rem', fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: '500' }}>Autoriser plusieurs tentatives</span>
            </label>
          </div>
        </motion.div>

        {/* Section Questions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          style={{ borderTop: '2px solid rgba(0,0,0,0.05)', paddingTop: '2rem', marginTop: '1rem' }}
        >
          <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Questions</h3>

          {/* Questions existantes */}
          <AnimatePresence>
            {questions.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}
              >
                {questions.map((q, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.75rem',
                      padding: '1rem',
                      background: 'linear-gradient(135deg, rgba(249,250,251,1) 0%, rgba(243,244,246,1) 100%)',
                      borderRadius: '12px',
                      border: '1px solid rgba(0,0,0,0.05)',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateX(5px)';
                      e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.08)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateX(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <GripVertical style={{ width: '20px', height: '20px', color: 'rgba(0,0,0,0.3)', marginTop: '2px', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>Q{index + 1}: {q.question_text}</p>
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        {getQuestionTypeLabel(q.question_type)} | {q.points} points
                        {q.choices?.length > 0 && ` | ${q.choices.length} choix`}
                      </p>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      type="button"
                      onClick={() => removeQuestion(index)}
                      style={{
                        color: 'var(--color-danger)',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '0.5rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <Trash2 style={{ width: '18px', height: '18px' }} />
                    </motion.button>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Nouvelle question */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            style={{
              background: 'linear-gradient(135deg, rgba(219, 234, 254, 0.5) 0%, rgba(191, 219, 254, 0.5) 100%)',
              padding: '1.5rem',
              borderRadius: '12px',
              border: '2px solid rgba(59, 130, 246, 0.2)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem'
            }}
          >
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                Question *
              </label>
              <textarea
                name="question_text"
                value={currentQuestion.question_text}
                onChange={handleQuestionChange}
                rows="2"
                placeholder="Entrez votre question..."
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  border: '2px solid rgba(0,0,0,0.1)',
                  borderRadius: '8px',
                  fontSize: '0.95rem',
                  transition: 'all 0.3s ease',
                  background: 'white',
                  fontFamily: 'inherit',
                  resize: 'vertical'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--color-primary)';
                  e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(0,0,0,0.1)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                  Type de question *
                </label>
                <select
                  name="question_type"
                  value={currentQuestion.question_type}
                  onChange={handleQuestionChange}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    border: '2px solid rgba(0,0,0,0.1)',
                    borderRadius: '8px',
                    fontSize: '0.95rem',
                    transition: 'all 0.3s ease',
                    background: 'white'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--color-primary)';
                    e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(0,0,0,0.1)';
                    e.target.style.boxShadow = 'none';
                  }}
                >
                  <option value="single_choice">Choix unique (QCM)</option>
                  <option value="multiple_choice">Choix multiples</option>
                  <option value="true_false">Vrai/Faux</option>
                  <option value="short_answer">Réponse courte</option>
                  <option value="long_answer">Réponse longue</option>
                  <option value="file_upload">Upload de fichier</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                  Points
                </label>
                <input
                  type="number"
                  name="points"
                  value={currentQuestion.points}
                  onChange={handleQuestionChange}
                  min="0"
                  step="0.5"
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    border: '2px solid rgba(0,0,0,0.1)',
                    borderRadius: '8px',
                    fontSize: '0.95rem',
                    transition: 'all 0.3s ease',
                    background: 'white'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--color-primary)';
                    e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(0,0,0,0.1)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                  <ImageIcon style={{ display: 'inline-block', width: '16px', height: '16px', marginRight: '0.25rem', verticalAlign: 'middle' }} />
                  Image
                </label>
                <input
                  type="file"
                  name="image"
                  accept="image/*"
                  onChange={handleQuestionChange}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    border: '2px solid rgba(0,0,0,0.1)',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    transition: 'all 0.3s ease',
                    background: 'white'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--color-primary)';
                    e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(0,0,0,0.1)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                Explication (affichée après la réponse)
              </label>
              <textarea
                name="explanation"
                value={currentQuestion.explanation}
                onChange={handleQuestionChange}
                rows="2"
                placeholder="Explication de la réponse correcte..."
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  border: '2px solid rgba(0,0,0,0.1)',
                  borderRadius: '8px',
                  fontSize: '0.95rem',
                  transition: 'all 0.3s ease',
                  background: 'white',
                  fontFamily: 'inherit',
                  resize: 'vertical'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--color-primary)';
                  e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(0,0,0,0.1)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                name="is_required"
                checked={currentQuestion.is_required}
                onChange={handleQuestionChange}
                style={{ width: '18px', height: '18px', accentColor: 'var(--color-primary)', cursor: 'pointer' }}
              />
              <span style={{ marginLeft: '0.5rem', fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: '500' }}>Question obligatoire</span>
            </label>

            {/* Choix pour QCM et Vrai/Faux */}
            {['single_choice', 'multiple_choice', 'true_false'].includes(currentQuestion.question_type) && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                    Choix de réponses *
                  </label>
                  {currentQuestion.question_type !== 'true_false' && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type="button"
                      onClick={addChoice}
                      style={{
                        color: 'var(--color-primary)',
                        background: 'rgba(59, 130, 246, 0.1)',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '0.5rem 0.75rem',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <Plus style={{ width: '16px', height: '16px' }} /> Ajouter un choix
                    </motion.button>
                  )}
                </div>

                {currentQuestion.question_type === 'true_false' && currentQuestion.choices.length === 0 && (
                  <motion.button
                    whileHover={{ scale: 1.01, borderColor: 'var(--color-primary)' }}
                    whileTap={{ scale: 0.99 }}
                    type="button"
                    onClick={() => {
                      setCurrentQuestion(prev => ({
                        ...prev,
                        choices: [
                          { choice_text: 'Vrai', is_correct: false, points_percentage: 100 },
                          { choice_text: 'Faux', is_correct: false, points_percentage: 100 }
                        ]
                      }));
                    }}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      border: '2px dashed rgba(0,0,0,0.2)',
                      borderRadius: '8px',
                      color: 'var(--text-secondary)',
                      background: 'rgba(249, 250, 251, 0.5)',
                      fontWeight: '500',
                      fontSize: '0.95rem',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    Générer les choix Vrai/Faux
                  </motion.button>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {currentQuestion.choices.map((choice, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                      <input
                        type={currentQuestion.question_type === 'single_choice' || currentQuestion.question_type === 'true_false' ? 'radio' : 'checkbox'}
                        name={`correct_${currentQuestion.question_type}`}
                        checked={choice.is_correct}
                        onChange={(e) => updateChoice(index, 'is_correct', e.target.checked)}
                        style={{ width: '18px', height: '18px', accentColor: 'var(--color-success)', cursor: 'pointer' }}
                      />
                      <input
                        type="text"
                        value={choice.choice_text}
                        onChange={(e) => updateChoice(index, 'choice_text', e.target.value)}
                        placeholder={`Choix ${index + 1}`}
                        style={{
                          flex: 1,
                          padding: '0.65rem 1rem',
                          border: '2px solid rgba(0,0,0,0.1)',
                          borderRadius: '8px',
                          fontSize: '0.95rem',
                          transition: 'all 0.3s ease',
                          background: 'white'
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = 'var(--color-primary)';
                          e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = 'rgba(0,0,0,0.1)';
                          e.target.style.boxShadow = 'none';
                        }}
                      />
                      {currentQuestion.question_type !== 'true_false' && (
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          type="button"
                          onClick={() => removeChoice(index)}
                          style={{
                            color: 'var(--color-danger)',
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '0.5rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <X style={{ width: '18px', height: '18px' }} />
                        </motion.button>
                      )}
                    </motion.div>
                  ))}
                </div>

                {currentQuestion.choices.length > 0 && !currentQuestion.choices.some(c => c.is_correct) && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.5rem',
                      marginTop: '0.75rem',
                      padding: '0.75rem',
                      background: 'rgba(251, 191, 36, 0.1)',
                      border: '1px solid rgba(251, 191, 36, 0.3)',
                      borderRadius: '8px'
                    }}
                  >
                    <AlertCircle style={{ width: '18px', height: '18px', color: 'rgb(217, 119, 6)', marginTop: '2px', flexShrink: 0 }} />
                    <p style={{ fontSize: '0.875rem', color: 'rgb(146, 64, 14)', fontWeight: '500' }}>
                      Veuillez marquer au moins une réponse correcte
                    </p>
                  </motion.div>
                )}
              </div>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={addQuestion}
              style={{
                width: '100%',
                padding: '0.875rem 1.5rem',
                background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '0.95rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
              }}
            >
              <Plus style={{ width: '20px', height: '20px' }} />
              Ajouter cette question
            </motion.button>
          </motion.div>
        </motion.div>

        {/* Boutons d'action */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '1rem',
            paddingTop: '1.5rem',
            borderTop: '2px solid rgba(0,0,0,0.05)',
            marginTop: '1rem'
          }}
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={onCancel}
            style={{
              padding: '0.75rem 2rem',
              border: '2px solid rgba(0,0,0,0.15)',
              borderRadius: '8px',
              color: 'var(--text-primary)',
              background: 'white',
              fontWeight: '600',
              fontSize: '0.95rem',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            Annuler
          </motion.button>
          <motion.button
            whileHover={{ scale: loading ? 1 : 1.02 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
            type="submit"
            disabled={loading}
            style={{
              padding: '0.75rem 2rem',
              background: loading ? 'rgba(156, 163, 175, 0.7)' : 'linear-gradient(135deg, var(--color-success) 0%, #059669 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              fontSize: '0.95rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: loading ? 'none' : '0 4px 12px rgba(16, 185, 129, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            {loading ? 'Enregistrement...' : (
              <>
                <CheckCircle style={{ width: '18px', height: '18px' }} />
                {quiz ? 'Mettre à jour' : 'Créer'}
              </>
            )}
          </motion.button>
        </motion.div>
      </form>
    </motion.div>
  );
};

export default QuizForm;
