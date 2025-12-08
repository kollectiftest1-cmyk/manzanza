import React, { useState, useEffect } from 'react';
import { Plus, X, FileText, Upload, Trash2, GripVertical, CheckCircle } from 'lucide-react';
import assignmentService from '../../services/assignmentService';
import courseService from '../../services/courseService';
import { motion, AnimatePresence } from 'framer-motion';

const AssignmentForm = ({ assignment, onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignment_type: 'TP',
    course: '',
    submission_type: 'electronic',
    due_date: '',
    max_points: 100,
    instructions: '',
    resources: null,
    auto_grade: false,
    status: 'draft'
  });
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState({
    question_text: '',
    question_type: 'text',
    points: null,
    correct_answer: '',
    attachment: null,
    choices: []
  });

  useEffect(() => {
    loadCourses();
    if (assignment) {
      setFormData({
        title: assignment.title || '',
        description: assignment.description || '',
        assignment_type: assignment.assignment_type || 'TP',
        course: assignment.course?.id || assignment.course || '',
        submission_type: assignment.submission_type || 'electronic',
        due_date: assignment.due_date ? assignment.due_date.slice(0, 16) : '',
        max_points: assignment.max_points || 100,
        instructions: assignment.instructions || '',
        resources: null,
        auto_grade: assignment.auto_grade || false,
        status: assignment.status || 'draft'
      });
      if (assignment.questions) {
        setQuestions(assignment.questions);
      }
    }
  }, [assignment]);

  const loadCourses = async () => {
    try {
      const response = await courseService.getMyCourses();
      setCourses(response.data.results);
    } catch (error) {
      console.error('Erreur lors du chargement des cours:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'file' ? files[0] : value
    }));
  };

  const handleQuestionChange = (e) => {
    const { name, value, type, files } = e.target;
    setCurrentQuestion(prev => ({
      ...prev,
      [name]: type === 'file' ? files[0] : value
    }));
  };

  const addChoice = () => {
    setCurrentQuestion(prev => ({
      ...prev,
      choices: [...prev.choices, { choice_text: '', is_correct: false }]
    }));
  };

  const updateChoice = (index, field, value) => {
    setCurrentQuestion(prev => ({
      ...prev,
      choices: prev.choices.map((choice, i) =>
        i === index ? { ...choice, [field]: value } : choice
      )
    }));
  };

  const removeChoice = (index) => {
    setCurrentQuestion(prev => ({
      ...prev,
      choices: prev.choices.filter((_, i) => i !== index)
    }));
  };

  const addQuestion = () => {
    if (!currentQuestion.question_text.trim()) {
      alert('Veuillez entrer une question');
      return;
    }

    if (['multiple_choice', 'single_choice'].includes(currentQuestion.question_type) && currentQuestion.choices.length === 0) {
      alert('Veuillez ajouter au moins un choix');
      return;
    }

    setQuestions(prev => [...prev, { ...currentQuestion, order: prev.length }]);
    setCurrentQuestion({
      question_text: '',
      question_type: 'text',
      points: null,
      correct_answer: '',
      attachment: null,
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
      const submitData = new FormData();

      // Ajouter les données du formulaire
      Object.keys(formData).forEach(key => {
        if (formData[key] !== null && formData[key] !== '') {
          submitData.append(key, formData[key]);
        }
      });

      let savedAssignment;
      if (assignment?.id) {
        const response = await assignmentService.updateAssignment(assignment.id, submitData);
        savedAssignment = response.data;
      } else {
        const response = await assignmentService.createAssignment(submitData);
        savedAssignment = response.data;
      }

      // Ajouter les questions
      let questionsAdded = 0;
      let questionsFailed = 0;

      if (questions.length > 0) {
        for (const question of questions) {
          if (!question.id) {
            try {
              await assignmentService.addQuestion(savedAssignment.id, question);
              questionsAdded++;
            } catch (qError) {
              console.error('Erreur ajout question:', qError);
              questionsFailed++;
            }
          }
        }
      }

      // Message de succès avec détails
      let successMessage = assignment ? 'Devoir mis à jour avec succès!' : 'Devoir créé avec succès!';
      if (questions.length > 0) {
        if (questionsFailed > 0) {
          successMessage += `\n${questionsAdded} question(s) ajoutée(s), ${questionsFailed} échouée(s).`;
        } else {
          successMessage += `\n${questionsAdded} question(s) ajoutée(s).`;
        }
      }

      alert(successMessage);
      if (onSuccess) onSuccess(savedAssignment);
    } catch (error) {
      console.error('Erreur:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Erreur lors de la sauvegarde du devoir';
      alert(`Erreur: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
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
        {assignment ? 'Modifier le devoir' : 'Créer un nouveau devoir'}
      </motion.h2>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Informations de base */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}
        >
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              Titre *
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
              Type *
            </label>
            <select
              name="assignment_type"
              value={formData.assignment_type}
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
              <option value="TP">Travaux Pratiques (TP)</option>
              <option value="TD">Travaux Dirigés (TD)</option>
            </select>
          </div>

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
              Type de remise *
            </label>
            <select
              name="submission_type"
              value={formData.submission_type}
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
            >
              <option value="electronic">Électronique</option>
              <option value="physical">Physique</option>
              <option value="both">Les deux</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              Date de remise *
            </label>
            <input
              type="datetime-local"
              name="due_date"
              value={formData.due_date}
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
        </motion.div>

        {/* Description */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
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
        </motion.div>

        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
        >
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            Instructions
          </label>
          <textarea
            name="instructions"
            value={formData.instructions}
            onChange={handleInputChange}
            rows="4"
            placeholder="Instructions détaillées pour réaliser le TP/TD..."
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
        </motion.div>

        {/* Ressources */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            <Upload style={{ display: 'inline-block', width: '16px', height: '16px', marginRight: '0.5rem', verticalAlign: 'middle' }} />
            Ressources (fichier)
          </label>
          <input
            type="file"
            name="resources"
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
          />
        </motion.div>

        {/* Correction automatique */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
          style={{ display: 'flex', alignItems: 'center', padding: '1rem', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.1)' }}
        >
          <input
            type="checkbox"
            name="auto_grade"
            id="auto_grade"
            checked={formData.auto_grade}
            onChange={handleInputChange}
            style={{ width: '18px', height: '18px', accentColor: 'var(--color-primary)', cursor: 'pointer' }}
          />
          <label htmlFor="auto_grade" style={{ marginLeft: '0.75rem', fontSize: '0.9rem', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: '500' }}>
            Activer la correction automatique
          </label>
        </motion.div>

        {/* Section Questions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          style={{ borderTop: '2px solid rgba(0,0,0,0.05)', paddingTop: '1.5rem', marginTop: '1rem' }}
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
                        Type: {q.question_type} | Points: {q.points || 'Auto'}
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
            transition={{ delay: 0.55 }}
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
                Question
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
                  Type de question
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
                  <option value="text">Réponse textuelle</option>
                  <option value="file">Upload de fichier</option>
                  <option value="single_choice">Choix unique</option>
                  <option value="multiple_choice">Choix multiples</option>
                  <option value="code">Code</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                  Points
                </label>
                <input
                  type="number"
                  name="points"
                  value={currentQuestion.points || ''}
                  onChange={handleQuestionChange}
                  placeholder="Auto"
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
                  Fichier joint
                </label>
                <input
                  type="file"
                  name="attachment"
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

            {/* Réponse correcte pour correction auto */}
            {formData.auto_grade && ['text', 'code'].includes(currentQuestion.question_type) && (
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                  Réponse correcte (pour correction automatique)
                </label>
                <input
                  type="text"
                  name="correct_answer"
                  value={currentQuestion.correct_answer}
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
                />
              </div>
            )}

            {/* Choix pour QCM */}
            {['single_choice', 'multiple_choice'].includes(currentQuestion.question_type) && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                    Choix de réponses
                  </label>
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
                </div>
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
                        type={currentQuestion.question_type === 'single_choice' ? 'radio' : 'checkbox'}
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
                    </motion.div>
                  ))}
                </div>
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
          transition={{ delay: 0.7 }}
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
                {assignment ? 'Mettre à jour' : 'Créer'}
              </>
            )}
          </motion.button>
        </motion.div>
      </form>
    </motion.div>
  );
};

export default AssignmentForm;
