import React, { useState, useEffect } from 'react';
import { Clock, AlertCircle, CheckCircle, Send, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import quizService from '../../services/quizService';

const TakeQuiz = ({ quiz, onComplete, onCancel }) => {
  const [attempt, setAttempt] = useState(null);
  const [answers, setAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    console.log('quiz',quiz);
    
    startQuiz();
  }, []);

  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining]);

  const startQuiz = async () => {
    try {
      setLoading(true);
      const response = await quizService.startAttempt(quiz.id);
      setAttempt(response.data);
      setTimeRemaining(quiz.duration_minutes * 60); // Convert to seconds
    } catch (error) {
      console.error('Erreur lors du démarrage du quiz:', error);
      const errorMsg = error.response?.data?.error || 'Erreur lors du démarrage du quiz';
      alert(errorMsg);
      if (onCancel) onCancel();
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId, value, type = 'text') => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        question_id: questionId,
        [type === 'file' ? 'answer_file' : 'answer_text']: value
      }
    }));
  };

  const handleChoiceToggle = (questionId, choiceId, isMultiple) => {
    setAnswers(prev => {
      const current = prev[questionId] || { question_id: questionId, selected_choices: [] };
      let newChoices;

      if (isMultiple) {
        // Multiple choice: toggle
        newChoices = current.selected_choices?.includes(choiceId)
          ? current.selected_choices.filter(id => id !== choiceId)
          : [...(current.selected_choices || []), choiceId];
      } else {
        // Single choice: replace
        newChoices = [choiceId];
      }

      return {
        ...prev,
        [questionId]: {
          ...current,
          selected_choices: newChoices
        }
      };
    });
  };

  const handleSaveProgress = async () => {
    try {
      const answersList = Object.values(answers);
      await quizService.saveAnswers(attempt.id, answersList);
      alert('Progrès sauvegardé!');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert('Erreur lors de la sauvegarde du progrès');
    }
  };

  const handleAutoSubmit = async () => {
    if (submitting) return;
    alert('Le temps est écoulé! Votre quiz sera soumis automatiquement.');
    await handleSubmit(true);
  };

  const handleSubmit = async (auto = false) => {
    if (!auto) {
      const unanswered = quiz.questions?.filter(q =>
        q.is_required && !answers[q.id]
      );

      if (unanswered?.length > 0) {
        if (!window.confirm(`${unanswered.length} question(s) obligatoire(s) non répondue(s). Soumettre quand même ?`)) {
          return;
        }
      }
    }

    try {
      setSubmitting(true);
      const answersList = Object.values(answers);
      await quizService.submitAttempt(attempt.id, answersList);
      alert('Quiz soumis avec succès!');
      if (onComplete) onComplete();
    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
      alert('Erreur lors de la soumission du quiz');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeColor = () => {
    if (timeRemaining === null) return 'text-gray-600';
    if (timeRemaining < 300) return 'text-red-600'; // Less than 5 minutes
    if (timeRemaining < 600) return 'text-yellow-600'; // Less than 10 minutes
    return 'text-green-600';
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '16rem' }}
      >
        <div style={{
          animation: 'spin 1s linear infinite',
          borderRadius: '50%',
          height: '3rem',
          width: '3rem',
          border: '3px solid transparent',
          borderTopColor: 'var(--color-primary)'
        }}></div>
      </motion.div>
    );
  }

  if (!attempt) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
        <p className="text-gray-600">Impossible de démarrer le quiz</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ maxWidth: '64rem', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
    >
      {/* Header avec timer */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{
          background: 'white',
          borderRadius: '16px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
          padding: '1rem',
          position: 'sticky',
          top: 0,
          zIndex: 10
        }}
      >
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-800">{quiz.title}</h2>
            <p className="text-sm text-gray-600">
              {quiz.questions?.length} questions | {quiz.max_points} points
            </p>
          </div>
          <div className="text-right">
            <div className={`text-2xl font-bold ${getTimeColor()}`}>
              <Clock className="inline-block w-6 h-6 mr-2" />
              {formatTime(timeRemaining)}
            </div>
            <p className="text-xs text-gray-500">Temps restant</p>
          </div>
        </div>

        <AnimatePresence>
          {timeRemaining < 300 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{
                marginTop: '0.75rem',
                padding: '0.5rem',
                background: 'rgba(254, 202, 202, 0.5)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.5rem'
              }}
            >
              <AlertCircle style={{ width: '20px', height: '20px', color: 'var(--color-danger)', marginTop: '2px', flexShrink: 0 }} />
              <p style={{ fontSize: '0.875rem', color: '#991b1b' }}>
                Attention! Il vous reste moins de 5 minutes!
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Questions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
      >
        {quiz.questions?.map((question, index) => (
          <motion.div
            key={question.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + index * 0.05 }}
            style={{
              background: 'white',
              borderRadius: '16px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
              padding: '1.5rem'
            }}
          >
            <div className="flex items-start gap-3 mb-4">
              <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                {index + 1}
              </span>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold text-gray-800">
                    {question.question_text}
                  </h3>
                  {question.is_required && (
                    <span className="text-red-500">*</span>
                  )}
                </div>
                <p className="text-sm text-gray-600">{question.points} points</p>
              </div>
            </div>

            {question.image && (
              <img
                src={question.image}
                alt="Question"
                className="mb-4 max-w-md rounded-lg"
              />
            )}

            {/* Réponse selon le type */}
            <div className="ml-11">
              {/* Debug info */}
              {process.env.NODE_ENV === 'development' && (
                <div style={{ fontSize: '0.7rem', color: '#666', marginBottom: '0.5rem' }}>
                  Type: {question.question_type} | Choices: {question.choices?.length || 0}
                </div>
              )}

              {(question.question_type === 'single_choice' || question.question_type === 'choix_unique') && (
                <div className="space-y-2">
                  {question.choices && question.choices.length > 0 ? (
                    question.choices.map(choice => (
                      <label key={choice.id} className="flex items-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer transition-all">
                        <input
                          type="radio"
                          name={`question_${question.id}`}
                          checked={answers[question.id]?.selected_choices?.includes(choice.id)}
                          onChange={() => handleChoiceToggle(question.id, choice.id, false)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-3 flex-1">{choice.choice_text}</span>
                        {choice.image && (
                          <img src={choice.image} alt="Choix" className="ml-3 h-16 rounded" />
                        )}
                      </label>
                    ))
                  ) : (
                    <p className="text-gray-500 italic">Aucun choix disponible</p>
                  )}
                </div>
              )}

              {(question.question_type === 'multiple_choice' || question.question_type === 'choix_multiple') && (
                <div className="space-y-2">
                  {question.choices && question.choices.length > 0 ? (
                    question.choices.map(choice => (
                      <label key={choice.id} className="flex items-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer transition-all">
                        <input
                          type="checkbox"
                          checked={answers[question.id]?.selected_choices?.includes(choice.id)}
                          onChange={() => handleChoiceToggle(question.id, choice.id, true)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 rounded"
                        />
                        <span className="ml-3 flex-1">{choice.choice_text}</span>
                        {choice.image && (
                          <img src={choice.image} alt="Choix" className="ml-3 h-16 rounded" />
                        )}
                      </label>
                    ))
                  ) : (
                    <p className="text-gray-500 italic">Aucun choix disponible</p>
                  )}
                </div>
              )}

              {(question.question_type === 'true_false' || question.question_type === 'vrai_faux') && (
                <div className="space-y-2">
                  {question.choices && question.choices.length > 0 ? (
                    question.choices.map(choice => (
                      <label key={choice.id} className="flex items-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer transition-all">
                        <input
                          type="radio"
                          name={`question_${question.id}`}
                          checked={answers[question.id]?.selected_choices?.includes(choice.id)}
                          onChange={() => handleChoiceToggle(question.id, choice.id, false)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-3 text-lg font-semibold">{choice.choice_text}</span>
                      </label>
                    ))
                  ) : (
                    // Fallback for true/false without choices
                    <>
                      <label className="flex items-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer transition-all">
                        <input
                          type="radio"
                          name={`question_${question.id}`}
                          checked={answers[question.id]?.answer_text === 'Vrai'}
                          onChange={() => handleAnswerChange(question.id, 'Vrai')}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-3 text-lg font-semibold">✓ Vrai</span>
                      </label>
                      <label className="flex items-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer transition-all">
                        <input
                          type="radio"
                          name={`question_${question.id}`}
                          checked={answers[question.id]?.answer_text === 'Faux'}
                          onChange={() => handleAnswerChange(question.id, 'Faux')}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-3 text-lg font-semibold">✗ Faux</span>
                      </label>
                    </>
                  )}
                </div>
              )}

              {(question.question_type === 'short_answer' || question.question_type === 'reponse_courte' || question.question_type === 'text') && (
                <input
                  type="text"
                  value={answers[question.id]?.answer_text || ''}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                  placeholder="Votre réponse..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}

              {(question.question_type === 'long_answer' || question.question_type === 'reponse_longue') && (
                <textarea
                  value={answers[question.id]?.answer_text || ''}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                  placeholder="Votre réponse détaillée..."
                  rows="5"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}

              {(question.question_type === 'file_upload' || question.question_type === 'fichier') && (
                <input
                  type="file"
                  onChange={(e) => handleAnswerChange(question.id, e.target.files[0], 'file')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              )}

              {/* Fallback pour types non reconnus */}
              {!['single_choice', 'choix_unique', 'multiple_choice', 'choix_multiple', 'true_false', 'vrai_faux', 'short_answer', 'reponse_courte', 'text', 'long_answer', 'reponse_longue', 'file_upload', 'fichier'].includes(question.question_type) && (
                <div className="p-3 bg-yellow-50 border border-yellow-300 rounded-lg">
                  <p className="text-yellow-800">Type de question non supporté: {question.question_type}</p>
                  <textarea
                    value={answers[question.id]?.answer_text || ''}
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    placeholder="Votre réponse..."
                    rows="3"
                    className="w-full mt-2 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Boutons d'action */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        style={{
          background: 'white',
          borderRadius: '16px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
          padding: '1rem',
          position: 'sticky',
          bottom: 0,
          zIndex: 10
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSaveProgress}
            disabled={submitting}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              border: '2px solid rgba(0,0,0,0.15)',
              borderRadius: '8px',
              color: 'var(--text-primary)',
              background: submitting ? 'rgba(0,0,0,0.05)' : 'white',
              fontWeight: '600',
              cursor: submitting ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            <Save style={{ width: '20px', height: '20px' }} />
            Sauvegarder le progrès
          </motion.button>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onCancel}
              disabled={submitting}
              style={{
                padding: '0.5rem 1.5rem',
                border: '2px solid rgba(0,0,0,0.15)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                background: submitting ? 'rgba(0,0,0,0.05)' : 'white',
                fontWeight: '600',
                cursor: submitting ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              Annuler
            </motion.button>
            <motion.button
              whileHover={{ scale: submitting ? 1 : 1.02 }}
              whileTap={{ scale: submitting ? 1 : 0.98 }}
              onClick={() => handleSubmit(false)}
              disabled={submitting}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1.5rem',
                background: submitting ? 'rgba(156, 163, 175, 0.7)' : 'linear-gradient(135deg, var(--color-success) 0%, #059669 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: submitting ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: submitting ? 'none' : '0 4px 12px rgba(16, 185, 129, 0.3)'
              }}
            >
              <Send style={{ width: '20px', height: '20px' }} />
              {submitting ? 'Envoi...' : 'Soumettre le quiz'}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default TakeQuiz;
