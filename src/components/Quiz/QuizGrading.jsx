import React, { useState, useEffect } from 'react';
import { ArrowLeft, User, Clock, CheckCircle, XCircle, Calendar, Star, Award, Save, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import quizService from '../../services/quizService';

// Modern color palette
const colors = {
  primary: '#6366f1',
  primaryLight: '#818cf8',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',
  purple: '#9333EA',
  bg: '#f8fafc',
  cardBg: '#ffffff',
  text: '#1e293b',
  textSecondary: '#64748b',
  border: '#e2e8f0',
  hover: '#f1f5f9'
};

const QuizGrading = ({ quiz, onBack }) => {
  const [attempts, setAttempts] = useState([]);
  const [selectedAttempt, setSelectedAttempt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [grading, setGrading] = useState(false);
  const [grades, setGrades] = useState({});
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    
    if (quiz?.id) {
      loadAttempts();
    }
  }, [quiz]);

  const loadAttempts = async () => {
    try {
      setLoading(true);
      const response = await quizService.getQuizAttempts(quiz.id);
    console.log('kkk',response.data);

      setAttempts(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des tentatives:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAttempt = async (attempt) => {
    console.log('Selected attempt:', attempt);
    console.log('Attempt answers:', attempt.answers);

    setSelectedAttempt(attempt);
    setFeedback(attempt.feedback || '');

    // Initialiser les notes
    const initialGrades = {};
    if (attempt.answers && Array.isArray(attempt.answers)) {
      attempt.answers.forEach(answer => {
        if (answer.question && answer.question.id) {
          initialGrades[answer.question.id] = {
            points_earned: answer.points_earned || '',
            comment: answer.comment || ''
          };
        }
      });
    }
    setGrades(initialGrades);
  };

  const handleGradeChange = (questionId, field, value) => {
    setGrades(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        [field]: value
      }
    }));
  };

  const calculateTotalScore = () => {
    let total = 0;
    Object.values(grades).forEach(grade => {
      total += parseFloat(grade.points_earned || 0);
    });
    return total;
  };

  const handleSubmitGrade = async () => {
    if (!selectedAttempt) return;

    try {
      setGrading(true);

      const gradeData = {
        score: calculateTotalScore(),
        feedback: feedback,
        answers: Object.entries(grades).map(([questionId, grade]) => ({
          question_id: parseInt(questionId),
          points_earned: parseFloat(grade.points_earned || 0),
          comment: grade.comment
        }))
      };

      await quizService.gradeAttempt(selectedAttempt.id, gradeData);
      alert('Note enregistrée avec succès!');
      loadAttempts();
      setSelectedAttempt(null);
    } catch (error) {
      console.error('Erreur lors de la notation:', error);
      alert('Erreur lors de l\'enregistrement de la note');
    } finally {
      setGrading(false);
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      in_progress: { bg: `${colors.warning}15`, color: colors.warning, label: 'En cours', icon: '⏳' },
      submitted: { bg: `${colors.info}15`, color: colors.info, label: 'Soumis', icon: '📝' },
      graded: { bg: `${colors.success}15`, color: colors.success, label: 'Noté', icon: '✅' },
      expired: { bg: `${colors.danger}15`, color: colors.danger, label: 'Expiré', icon: '⚠️' }
    };
    const { bg, color, label, icon } = config[status] || config.submitted;

    return (
      <span style={{
        padding: '0.375rem 0.875rem',
        borderRadius: '20px',
        fontSize: '0.75rem',
        fontWeight: '600',
        background: bg,
        color: color,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.375rem'
      }}>
        <span>{icon}</span>
        {label}
      </span>
    );
  };

  const getGradeColor = (score, maxPoints) => {
    const percentage = (score / maxPoints) * 100;
    if (percentage >= 70) return colors.success;
    if (percentage >= 50) return colors.warning;
    return colors.danger;
  };

  const getGradeEmoji = (score, maxPoints) => {
    const percentage = (score / maxPoints) * 100;
    if (percentage >= 90) return '🏆';
    if (percentage >= 70) return '🌟';
    if (percentage >= 50) return '👍';
    return '📚';
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '16rem',
          flexDirection: 'column',
          gap: '1rem',
          background: colors.bg
        }}
      >
        <div style={{
          animation: 'spin 1s linear infinite',
          borderRadius: '50%',
          height: '3rem',
          width: '3rem',
          border: '3px solid transparent',
          borderTopColor: colors.primary
        }}></div>
        <p style={{ color: colors.textSecondary, fontWeight: '500' }}>Chargement des tentatives...</p>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </motion.div>
    );
  }

  if (selectedAttempt) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
      >
        {/* Header moderne */}
        <div style={{
          background: `linear-gradient(135deg, ${colors.cardBg} 0%, #fefefe 100%)`,
          borderRadius: '20px',
          padding: '1.5rem',
          boxShadow: '0 10px 40px rgba(99, 102, 241, 0.1), 0 2px 8px rgba(0,0,0,0.06)',
          border: `1px solid ${colors.border}`,
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <motion.button
            whileHover={{ scale: 1.1, backgroundColor: colors.primary }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setSelectedAttempt(null)}
            style={{
              padding: '0.75rem',
              background: colors.bg,
              border: `2px solid ${colors.border}`,
              borderRadius: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              transition: 'all 0.3s ease',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.querySelector('svg').style.color = colors.cardBg;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.querySelector('svg').style.color = colors.text;
            }}
          >
            <ArrowLeft style={{ width: '20px', height: '20px', color: colors.text, transition: 'color 0.3s ease' }} />
          </motion.button>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryLight} 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: '700',
                fontSize: '1.25rem',
                boxShadow: `0 4px 12px ${colors.primary}40`
              }}>
                {selectedAttempt.student?.first_name?.charAt(0)}{selectedAttempt.student?.last_name?.charAt(0)}
              </div>
              <div>
                <h3 style={{
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  color: colors.text,
                  marginBottom: '0.25rem',
                  background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryLight} 100%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  {selectedAttempt.student?.first_name} {selectedAttempt.student?.last_name}
                </h3>
                <p style={{ fontSize: '0.875rem', color: colors.textSecondary, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Star style={{ width: '14px', height: '14px' }} />
                  Tentative #{selectedAttempt.attempt_number} | ⏱️ {formatTime(selectedAttempt.time_spent_seconds)}
                </p>
              </div>
            </div>
          </div>

          {selectedAttempt.score !== null && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
              style={{
                padding: '1.25rem 1.75rem',
                background: `linear-gradient(135deg, ${getGradeColor(selectedAttempt.score, quiz.max_points)}15 0%, ${getGradeColor(selectedAttempt.score, quiz.max_points)}25 100%)`,
                borderRadius: '16px',
                border: `3px solid ${getGradeColor(selectedAttempt.score, quiz.max_points)}`,
                boxShadow: `0 8px 20px ${getGradeColor(selectedAttempt.score, quiz.max_points)}30`,
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <div style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                fontSize: '2rem',
                opacity: 0.3
              }}>
                {getGradeEmoji(selectedAttempt.score, quiz.max_points)}
              </div>
              <p style={{ fontSize: '0.75rem', color: colors.textSecondary, marginBottom: '0.25rem', fontWeight: '600' }}>Note</p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
                <p style={{ fontSize: '2.5rem', fontWeight: '800', color: getGradeColor(selectedAttempt.score, quiz.max_points), lineHeight: 1 }}>
                  {selectedAttempt.score}
                </p>
                <p style={{ fontSize: '1.25rem', fontWeight: '600', color: colors.textSecondary }}>/{quiz.max_points}</p>
              </div>
            </motion.div>
          )}
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          style={{
            background: colors.cardBg,
            borderRadius: '20px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.08)',
            border: `1px solid ${colors.border}`,
            overflow: 'hidden'
          }}
        >
          <div style={{
            padding: '2rem',
            background: `linear-gradient(135deg, ${colors.primary}08 0%, ${colors.primaryLight}05 100%)`,
            borderBottom: `2px solid ${colors.border}`
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                padding: '0.75rem',
                background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryLight} 100%)`,
                borderRadius: '12px',
                boxShadow: `0 4px 12px ${colors.primary}30`
              }}>
                <FileText style={{ width: '24px', height: '24px', color: 'white' }} />
              </div>
              <h4 style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                color: colors.text,
                margin: 0
              }}>
                Réponses de l'étudiant
              </h4>
            </div>
          </div>

          <div style={{ padding: '2rem' }}>
            {(!selectedAttempt.answers || selectedAttempt.answers.length === 0) ? (
              <div style={{
                textAlign: 'center',
                padding: '3rem',
                background: colors.bg,
                borderRadius: '16px',
                border: `2px dashed ${colors.border}`
              }}>
                <FileText style={{
                  width: '64px',
                  height: '64px',
                  color: colors.textSecondary,
                  margin: '0 auto 1rem'
                }} />
                <h5 style={{
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  color: colors.text,
                  marginBottom: '0.5rem'
                }}>
                  Aucune réponse disponible
                </h5>
                <p style={{ color: colors.textSecondary, fontSize: '0.875rem' }}>
                  L'étudiant n'a pas encore répondu aux questions ou les réponses ne sont pas chargées.
                </p>
              </div>
            ) : selectedAttempt.answers.map((answer, index) => (
              <motion.div
                key={answer.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
                style={{
                  paddingBottom: '2rem',
                  marginBottom: '2rem',
                  borderBottom: index < selectedAttempt.answers.length - 1 ? `2px solid ${colors.border}` : 'none'
                }}
              >
                {/* Question header */}
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '1rem',
                  marginBottom: '1.5rem'
                }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: `linear-gradient(135deg, ${colors.info} 0%, ${colors.primary} 100%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: '700',
                    fontSize: '1.125rem',
                    flexShrink: 0,
                    boxShadow: `0 4px 12px ${colors.info}30`
                  }}>
                    {index + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h5 style={{
                      fontSize: '1.125rem',
                      fontWeight: '600',
                      color: colors.text,
                      marginBottom: '0.5rem',
                      lineHeight: '1.5'
                    }}>
                      {answer.question.question_text}
                    </h5>
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.25rem 0.75rem',
                      background: `${colors.warning}15`,
                      color: colors.warning,
                      borderRadius: '20px',
                      fontSize: '0.75rem',
                      fontWeight: '600'
                    }}>
                      <Star style={{ width: '12px', height: '12px' }} />
                      {answer.question.points} points
                    </div>
                  </div>
                </div>

                {/* Réponse de l'étudiant */}
                <div style={{
                  background: colors.bg,
                  padding: '1.5rem',
                  borderRadius: '16px',
                  border: `2px solid ${colors.border}`,
                  marginBottom: '1.5rem',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                }}>
                  <p style={{
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: colors.textSecondary,
                    marginBottom: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    📝 Réponse de l'étudiant:
                  </p>

                  {answer.answer_text && (
                    <p style={{
                      color: colors.text,
                      whiteSpace: 'pre-wrap',
                      lineHeight: '1.8',
                      fontSize: '0.95rem',
                      margin: 0
                    }}>
                      {answer.answer_text}
                    </p>
                  )}

                  {answer.selected_choices && answer.selected_choices.length > 0 && (
                    <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {answer.selected_choices.map(choice => (
                        <div
                          key={choice.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '0.75rem',
                            background: choice.is_correct ? `${colors.success}10` : `${colors.danger}10`,
                            border: `2px solid ${choice.is_correct ? colors.success : colors.danger}30`,
                            borderRadius: '10px'
                          }}
                        >
                          {choice.is_correct ? (
                            <CheckCircle style={{ width: '20px', height: '20px', color: colors.success }} />
                          ) : (
                            <XCircle style={{ width: '20px', height: '20px', color: colors.danger }} />
                          )}
                          <span style={{
                            color: choice.is_correct ? colors.success : colors.danger,
                            fontWeight: '500',
                            fontSize: '0.875rem'
                          }}>
                            {choice.choice_text}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {answer.is_correct_auto !== null && (
                    <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{
                        padding: '0.5rem 1rem',
                        background: answer.is_correct_auto ? `${colors.success}15` : `${colors.danger}15`,
                        color: answer.is_correct_auto ? colors.success : colors.danger,
                        borderRadius: '8px',
                        fontSize: '0.875rem',
                        fontWeight: '600'
                      }}>
                        {answer.is_correct_auto ? '✓ Correct' : '✗ Incorrect'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Explication */}
                {answer.question.explanation && (
                  <div style={{
                    background: `${colors.info}08`,
                    padding: '1rem',
                    borderRadius: '12px',
                    marginBottom: '1.5rem',
                    border: `1px solid ${colors.info}30`
                  }}>
                    <p style={{
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: colors.info,
                      marginBottom: '0.5rem'
                    }}>
                      💡 Explication:
                    </p>
                    <p style={{
                      fontSize: '0.875rem',
                      color: colors.text,
                      lineHeight: '1.6',
                      margin: 0
                    }}>
                      {answer.question.explanation}
                    </p>
                  </div>
                )}

                {/* Notation manuelle */}
                {!['single_choice', 'multiple_choice', 'true_false'].includes(answer.question.question_type) && (
                  <div style={{
                    background: `linear-gradient(135deg, ${colors.success}08 0%, ${colors.success}05 100%)`,
                    padding: '1.5rem',
                    borderRadius: '16px',
                    border: `2px dashed ${colors.success}40`
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                      <Award style={{ width: '20px', height: '20px', color: colors.success }} />
                      <h6 style={{
                        fontSize: '1rem',
                        fontWeight: '700',
                        color: colors.text,
                        margin: 0
                      }}>
                        Notation manuelle
                      </h6>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
                      <div>
                        <label style={{
                          display: 'block',
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          color: colors.text,
                          marginBottom: '0.5rem'
                        }}>
                          Points obtenus
                        </label>
                        <input
                          type="number"
                          value={grades[answer.question.id]?.points_earned || ''}
                          onChange={(e) => handleGradeChange(answer.question.id, 'points_earned', e.target.value)}
                          min="0"
                          max={answer.question.points}
                          step="0.5"
                          style={{
                            width: '100%',
                            padding: '0.75rem 1rem',
                            background: colors.cardBg,
                            border: `2px solid ${colors.border}`,
                            borderRadius: '10px',
                            color: colors.text,
                            fontSize: '1rem',
                            fontWeight: '600',
                            outline: 'none',
                            transition: 'all 0.2s ease'
                          }}
                          onFocus={(e) => e.target.style.borderColor = colors.primary}
                          onBlur={(e) => e.target.style.borderColor = colors.border}
                        />
                      </div>
                      <div>
                        <label style={{
                          display: 'block',
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          color: colors.text,
                          marginBottom: '0.5rem'
                        }}>
                          Commentaire
                        </label>
                        <textarea
                          value={grades[answer.question.id]?.comment || ''}
                          onChange={(e) => handleGradeChange(answer.question.id, 'comment', e.target.value)}
                          rows="2"
                          placeholder="Commentaire pour cette question..."
                          style={{
                            width: '100%',
                            padding: '0.75rem 1rem',
                            background: colors.cardBg,
                            border: `2px solid ${colors.border}`,
                            borderRadius: '10px',
                            color: colors.text,
                            fontSize: '0.875rem',
                            lineHeight: '1.6',
                            outline: 'none',
                            transition: 'all 0.2s ease',
                            resize: 'vertical'
                          }}
                          onFocus={(e) => e.target.style.borderColor = colors.primary}
                          onBlur={(e) => e.target.style.borderColor = colors.border}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {answer.points_earned !== null && (
                  <div style={{
                    marginTop: '1rem',
                    padding: '1rem',
                    background: `${colors.success}10`,
                    border: `2px solid ${colors.success}40`,
                    borderRadius: '12px'
                  }}>
                    <p style={{
                      fontSize: '0.875rem',
                      color: colors.success,
                      fontWeight: '600',
                      margin: 0
                    }}>
                      Points obtenus: <span style={{ fontSize: '1.125rem' }}>{answer.points_earned} / {answer.question.points}</span>
                    </p>
                  </div>
                )}
              </motion.div>
            ))}

            {/* Feedback général - Seulement si des réponses existent */}
            {selectedAttempt.answers && selectedAttempt.answers.length > 0 && (
            <>
            <div style={{
              marginTop: '2rem',
              padding: '1.5rem',
              background: `linear-gradient(135deg, ${colors.info}08 0%, ${colors.primary}05 100%)`,
              borderRadius: '16px',
              border: `2px solid ${colors.border}`
            }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '700',
                color: colors.text,
                marginBottom: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <FileText style={{ width: '18px', height: '18px', color: colors.info }} />
                Feedback général
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows="4"
                placeholder="Commentaires généraux sur la tentative..."
                style={{
                  width: '100%',
                  padding: '1rem',
                  background: colors.cardBg,
                  border: `2px solid ${colors.border}`,
                  borderRadius: '12px',
                  color: colors.text,
                  fontSize: '0.95rem',
                  lineHeight: '1.8',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  resize: 'vertical'
                }}
                onFocus={(e) => e.target.style.borderColor = colors.primary}
                onBlur={(e) => e.target.style.borderColor = colors.border}
              />
            </div>

            {/* Note totale */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              style={{
                marginTop: '2rem',
                padding: '1.75rem',
                background: `linear-gradient(135deg, ${getGradeColor(selectedAttempt.score || calculateTotalScore(), quiz.max_points)}15 0%, ${getGradeColor(selectedAttempt.score || calculateTotalScore(), quiz.max_points)}25 100%)`,
                borderRadius: '16px',
                border: `3px solid ${getGradeColor(selectedAttempt.score || calculateTotalScore(), quiz.max_points)}`,
                boxShadow: `0 8px 20px ${getGradeColor(selectedAttempt.score || calculateTotalScore(), quiz.max_points)}30`,
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <div style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                fontSize: '3rem',
                opacity: 0.2
              }}>
                {getGradeEmoji(selectedAttempt.score || calculateTotalScore(), quiz.max_points)}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{
                  fontSize: '1.125rem',
                  fontWeight: '700',
                  color: colors.text,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <Award style={{ width: '24px', height: '24px', color: getGradeColor(selectedAttempt.score || calculateTotalScore(), quiz.max_points) }} />
                  Note totale:
                </span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                  <span style={{
                    fontSize: '3rem',
                    fontWeight: '800',
                    color: getGradeColor(selectedAttempt.score || calculateTotalScore(), quiz.max_points),
                    lineHeight: 1
                  }}>
                    {(selectedAttempt.score || calculateTotalScore()).toFixed(2)}
                  </span>
                  <span style={{
                    fontSize: '1.5rem',
                    fontWeight: '600',
                    color: colors.textSecondary
                  }}>
                    / {quiz.max_points}
                  </span>
                </div>
              </div>
            </motion.div>
            </>
            )}

            {/* Boutons d'action */}
            <div style={{
              marginTop: '2rem',
              padding: '1.5rem',
              borderTop: `2px solid ${colors.border}`,
              background: colors.bg,
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '1rem'
            }}>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedAttempt(null)}
                style={{
                  padding: '0.875rem 1.75rem',
                  border: `2px solid ${colors.border}`,
                  borderRadius: '12px',
                  color: colors.text,
                  background: colors.cardBg,
                  fontWeight: '600',
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                Annuler
              </motion.button>
              <motion.button
                whileHover={{ scale: grading ? 1 : 1.02 }}
                whileTap={{ scale: grading ? 1 : 0.98 }}
                onClick={handleSubmitGrade}
                disabled={grading}
                style={{
                  padding: '0.875rem 1.75rem',
                  background: grading
                    ? 'rgba(156, 163, 175, 0.7)'
                    : `linear-gradient(135deg, ${colors.success} 0%, #059669 100%)`,
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontWeight: '600',
                  fontSize: '0.95rem',
                  cursor: grading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: grading ? 'none' : `0 8px 20px ${colors.success}40`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <Save style={{ width: '18px', height: '18px' }} />
                {grading ? 'Enregistrement...' : 'Enregistrer la note'}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
    >
      {/* Header */}
      <div style={{
        background: `linear-gradient(135deg, ${colors.cardBg} 0%, #fefefe 100%)`,
        borderRadius: '20px',
        padding: '1.5rem',
        boxShadow: '0 10px 40px rgba(99, 102, 241, 0.1), 0 2px 8px rgba(0,0,0,0.06)',
        border: `1px solid ${colors.border}`,
        display: 'flex',
        alignItems: 'center',
        gap: '1rem'
      }}>
        <motion.button
          whileHover={{ scale: 1.1, backgroundColor: colors.primary }}
          whileTap={{ scale: 0.9 }}
          onClick={onBack}
          style={{
            padding: '0.75rem',
            background: colors.bg,
            border: `2px solid ${colors.border}`,
            borderRadius: '12px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            transition: 'all 0.3s ease',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.querySelector('svg').style.color = colors.cardBg;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.querySelector('svg').style.color = colors.text;
          }}
        >
          <ArrowLeft style={{ width: '20px', height: '20px', color: colors.text, transition: 'color 0.3s ease' }} />
        </motion.button>
        <div style={{ flex: 1 }}>
          <h3 style={{
            fontSize: '1.5rem',
            fontWeight: '700',
            color: colors.text,
            marginBottom: '0.25rem'
          }}>
            {quiz.title}
          </h3>
          <p style={{ fontSize: '0.875rem', color: colors.textSecondary }}>
            {attempts.length} tentative(s)
          </p>
        </div>
      </div>

      {/* Statistiques */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem'
        }}
      >
        {[
          {
            label: 'Total Tentatives',
            value: attempts.length,
            color: colors.primary,
            bgColor: `${colors.primary}15`,
            icon: '📊'
          },
          {
            label: 'Soumis',
            value: attempts.filter(a => a.status === 'submitted').length,
            color: colors.info,
            bgColor: `${colors.info}15`,
            icon: '📝'
          },
          {
            label: 'Notés',
            value: attempts.filter(a => a.status === 'graded').length,
            color: colors.success,
            bgColor: `${colors.success}15`,
            icon: '✅'
          },
          {
            label: 'Note moyenne',
            value: attempts.filter(a => a.score).length > 0 ? (attempts.reduce((sum, a) => sum + (a.score || 0), 0) / attempts.filter(a => a.score).length).toFixed(1) : '-',
            color: colors.purple,
            bgColor: `${colors.purple}15`,
            icon: '🎯'
          }
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + index * 0.05 }}
            whileHover={{ scale: 1.05, y: -5 }}
            style={{
              background: colors.cardBg,
              borderRadius: '16px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              padding: '1.5rem',
              border: `1px solid ${colors.border}`,
              transition: 'all 0.3s ease',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <div style={{
              position: 'absolute',
              top: '-10px',
              right: '-10px',
              fontSize: '3rem',
              opacity: 0.1
            }}>
              {stat.icon}
            </div>
            <p style={{
              fontSize: '0.875rem',
              color: colors.textSecondary,
              marginBottom: '0.5rem',
              fontWeight: '500'
            }}>
              {stat.label}
            </p>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: stat.bgColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <span style={{ fontSize: '1.5rem', fontWeight: '700', color: stat.color }}>
                  {typeof stat.value === 'number' && stat.value < 10 ? '0' : ''}{stat.value}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Liste des tentatives */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        style={{
          background: colors.cardBg,
          borderRadius: '16px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
          overflow: 'hidden',
          border: `1px solid ${colors.border}`
        }}
      >
        {attempts && attempts.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{
                background: `linear-gradient(135deg, ${colors.bg} 0%, rgba(0,0,0,0.02) 100%)`
              }}>
                <tr>
                  {['Étudiant', 'Tentative', 'Date', 'Temps', 'Statut', 'Note', 'Action'].map(header => (
                    <th key={header} style={{
                      padding: '1rem 1.5rem',
                      textAlign: 'left',
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      color: colors.textSecondary,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      borderBottom: `2px solid ${colors.border}`
                    }}>
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {attempts.map((attempt, index) => (
                  <motion.tr
                    key={attempt.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    style={{
                      borderBottom: `1px solid ${colors.border}`,
                      transition: 'background 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = colors.bg}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryLight} 100%)`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontWeight: '700',
                          fontSize: '0.875rem'
                        }}>
                          {attempt.student?.first_name?.charAt(0)}{attempt.student?.last_name?.charAt(0)}
                        </div>
                        <div>
                          <div style={{
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            color: colors.text
                          }}>
                            {attempt.student?.first_name} {attempt.student?.last_name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{
                      padding: '1rem 1.5rem',
                      fontSize: '0.875rem',
                      color: colors.text,
                      fontWeight: '600'
                    }}>
                      #{attempt.attempt_number}
                    </td>
                    <td style={{
                      padding: '1rem 1.5rem',
                      fontSize: '0.875rem',
                      color: colors.text
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Calendar style={{ width: '14px', height: '14px', color: colors.textSecondary }} />
                        {new Date(attempt.started_at).toLocaleDateString('fr-FR')}
                      </div>
                    </td>
                    <td style={{
                      padding: '1rem 1.5rem',
                      fontSize: '0.875rem',
                      color: colors.text
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Clock style={{ width: '14px', height: '14px', color: colors.textSecondary }} />
                        {formatTime(attempt.time_spent_seconds)}
                      </div>
                    </td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      {getStatusBadge(attempt.status)}
                    </td>
                    <td style={{
                      padding: '1rem 1.5rem',
                      fontSize: '0.875rem',
                      fontWeight: '700'
                    }}>
                      {attempt.score !== null ? (
                        <span style={{ color: getGradeColor(attempt.score, quiz.max_points) }}>
                          {attempt.score} / {quiz.max_points}
                        </span>
                      ) : (
                        <span style={{ color: colors.textSecondary }}>-</span>
                      )}
                    </td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleSelectAttempt(attempt)}
                        style={{
                          padding: '0.5rem 1rem',
                          background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryLight} 100%)`,
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          fontWeight: '600',
                          fontSize: '0.875rem',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          boxShadow: `0 2px 8px ${colors.primary}30`
                        }}
                      >
                        {attempt.status === 'graded' ? 'Modifier' : 'Corriger'}
                      </motion.button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{
            padding: '4rem 2rem',
            textAlign: 'center'
          }}>
            <FileText style={{
              width: '64px',
              height: '64px',
              color: colors.textSecondary,
              margin: '0 auto 1rem'
            }} />
            <h5 style={{
              fontSize: '1.1rem',
              fontWeight: '600',
              color: colors.text,
              marginBottom: '0.5rem'
            }}>
              Aucune tentative
            </h5>
            <p style={{ color: colors.textSecondary, fontSize: '0.875rem' }}>
              Les étudiants n'ont pas encore commencé ce quiz
            </p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default QuizGrading;
