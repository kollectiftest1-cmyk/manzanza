import React, { useState, useEffect } from 'react';
import { Upload, FileText, Send, Save, AlertCircle, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import assignmentService from '../../services/assignmentService';

const SubmitAssignment = ({ assignment, onComplete, onCancel }) => {
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [existingSubmission, setExistingSubmission] = useState(null);

  useEffect(() => {
    checkExistingSubmission();
  }, [assignment]);

  const checkExistingSubmission = async () => {
    try {
      const response = await assignmentService.getMySubmissions();
      const existing = response.data.find(s => s.assignment.id === assignment.id);
      if (existing) {
        setExistingSubmission(existing);
        // Load existing answers
        const loadedAnswers = {};
        existing.answers?.forEach(answer => {
          loadedAnswers[answer.question.id] = {
            question_id: answer.question.id,
            answer_text: answer.answer_text || '',
            answer_file: null,
            selected_choices: answer.selected_choices?.map(c => c.id) || []
          };
        });
        setAnswers(loadedAnswers);
      }
    } catch (error) {
      console.error('Erreur lors de la vérification de la soumission:', error);
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

  const handleSubmit = async () => {
    // Vérifier que toutes les questions ont une réponse
    const unanswered = assignment.questions?.filter(q => {
      const answer = answers[q.id];
      if (!answer) return true;

      if (q.question_type === 'file') {
        return !answer.answer_file && !existingSubmission?.answers?.find(a => a.question.id === q.id)?.answer_file;
      }
      if (['single_choice', 'multiple_choice'].includes(q.question_type)) {
        return !answer.selected_choices || answer.selected_choices.length === 0;
      }
      return !answer.answer_text;
    });

    if (unanswered?.length > 0) {
      if (!window.confirm(`${unanswered.length} question(s) non répondue(s). Soumettre quand même ?`)) {
        return;
      }
    }

    try {
      setSubmitting(true);
      const answersList = Object.values(answers);
      await assignmentService.submitAssignment(assignment.id, { answers: answersList });
      alert('Devoir soumis avec succès!');
      if (onComplete) onComplete();
    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
      alert('Erreur lors de la soumission du devoir');
    } finally {
      setSubmitting(false);
    }
  };

  const isLate = () => {
    if (!assignment.due_date) return false;
    return new Date() > new Date(assignment.due_date);
  };

  // console.log('kkkk ',existingSubmission);
  

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ maxWidth: '64rem', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{
          background: 'white',
          borderRadius: '16px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
          padding: '1.5rem'
        }}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                assignment.assignment_type === 'TP'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-purple-100 text-purple-800'
              }`}>
                {assignment.assignment_type}
              </span>
              {existingSubmission && (
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  existingSubmission.status === 'graded'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {existingSubmission.status === 'graded' ? 'Noté' : 'Soumis'}
                </span>
              )}
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              {assignment.title}
            </h2>
            <p className="text-gray-600">
              {assignment.course?.name || assignment.course?.nom}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Date limite</p>
            <p className={`font-semibold ${isLate() ? 'text-red-600' : 'text-gray-800'}`}>
              {formatDate(assignment.due_date)}
            </p>
            {isLate() && (
              <span className="text-xs text-red-600">En retard</span>
            )}
          </div>
        </div>

        {assignment.description && (
          <div className="mb-4">
            <h3 className="font-semibold text-gray-800 mb-2">Description</h3>
            <p className="text-gray-700 whitespace-pre-wrap">{assignment.description}</p>
          </div>
        )}

        {assignment.instructions && (
          <div className="mb-4">
            <h3 className="font-semibold text-gray-800 mb-2">Instructions</h3>
            <p className="text-gray-700 whitespace-pre-wrap">{assignment.instructions}</p>
          </div>
        )}

        {assignment.resources && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <a
              href={assignment.resources}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
            >
              <FileText className="w-5 h-5" />
              Télécharger les ressources
            </a>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              Type de remise: <span className="font-medium text-gray-800">
                {assignment.submission_type === 'electronic' ? 'Électronique' :
                 assignment.submission_type === 'physical' ? 'Physique' : 'Les deux'}
              </span>
            </span>
            <span className="text-gray-600">
              Note maximale: <span className="font-medium text-gray-800">{assignment.max_points}</span>
            </span>
          </div>
        </div>

        {existingSubmission?.score !== null && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-gray-800">Votre note:</span>
              <span className="text-2xl font-bold text-green-600">
                {existingSubmission?.score} / {assignment?.max_points}
              </span>
            </div>
            {existingSubmission?.feedback && (
              <div className="mt-3 pt-3 border-t border-green-200">
                <p className="text-sm font-medium text-gray-700 mb-1">Feedback:</p>
                <p className="text-gray-700 whitespace-pre-wrap">{existingSubmission?.feedback}</p>
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* Questions */}
      {existingSubmission?.status !== 'graded' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
        >
          <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)' }}>Questions</h3>

          {assignment.questions?.map((question, index) => (
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
                  <h4 className="text-lg font-semibold text-gray-800 mb-2">
                    {question.question_text}
                  </h4>
                  {question.points && (
                    <p className="text-sm text-gray-600">{question.points} points</p>
                  )}
                </div>
              </div>

              {question.attachment && (
                <div className="mb-4 ml-11">
                  <a
                    href={question.attachment}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
                  >
                    <FileText className="w-4 h-4" />
                    Voir le fichier joint
                  </a>
                </div>
              )}

              {/* Réponse selon le type */}
              <div className="ml-11">
                {question.question_type === 'text' && (
                  <textarea
                    value={answers[question.id]?.answer_text || ''}
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    placeholder="Votre réponse..."
                    rows="5"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                )}

                {question.question_type === 'code' && (
                  <textarea
                    value={answers[question.id]?.answer_text || ''}
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    placeholder="Votre code..."
                    rows="10"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  />
                )}

                {question.question_type === 'file' && (
                  <div>
                    <input
                      type="file"
                      onChange={(e) => handleAnswerChange(question.id, e.target.files[0], 'file')}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                    {existingSubmission?.answers?.find(a => a.question.id === question.id)?.answer_file && (
                      <p className="mt-2 text-sm text-gray-600">
                        Fichier déjà soumis:
                        <a
                          href={existingSubmission.answers.find(a => a.question.id === question.id).answer_file}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 ml-1"
                        >
                          Voir le fichier
                        </a>
                      </p>
                    )}
                  </div>
                )}

                {question.question_type === 'single_choice' && (
                  <div className="space-y-2">
                    {question.choices?.map(choice => (
                      <label key={choice.id} className="flex items-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                          type="radio"
                          name={`question_${question.id}`}
                          checked={answers[question.id]?.selected_choices?.includes(choice.id)}
                          onChange={() => handleChoiceToggle(question.id, choice.id, false)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-3">{choice.choice_text}</span>
                      </label>
                    ))}
                  </div>
                )}

                {question.question_type === 'multiple_choice' && (
                  <div className="space-y-2">
                    {question.choices?.map(choice => (
                      <label key={choice.id} className="flex items-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={answers[question.id]?.selected_choices?.includes(choice.id)}
                          onChange={() => handleChoiceToggle(question.id, choice.id, true)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 rounded"
                        />
                        <span className="ml-3">{choice.choice_text}</span>
                      </label>
                    ))}
                  </div>
                )}

                {/* Afficher la correction si déjà noté */}
                {existingSubmission?.answers?.find(a => a.question.id === question.id)?.comment && (
                  <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm font-medium text-gray-700 mb-1">Commentaire du correcteur:</p>
                    <p className="text-gray-700 text-sm">
                      {existingSubmission.answers.find(a => a.question.id === question.id).comment}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Boutons d'action */}
      {existingSubmission?.status !== 'graded' && (
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
            {isLate() && (
              <div className="flex items-start gap-2 text-red-600">
                <AlertCircle className="w-5 h-5 mt-0.5" />
                <p className="text-sm">
                  Attention: La date limite est dépassée. Votre soumission sera marquée comme en retard.
                </p>
              </div>
            )}
            <div style={{ display: 'flex', gap: '0.75rem', marginLeft: 'auto' }}>
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
                onClick={handleSubmit}
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
                {submitting ? 'Envoi...' : 'Soumettre le devoir'}
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default SubmitAssignment;
