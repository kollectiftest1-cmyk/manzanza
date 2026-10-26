import React, { useState, useEffect } from 'react';
import { ArrowLeft, User, Calendar, Clock, CheckCircle, FileText, Download, Save, Star, Award, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector, useDispatch } from 'react-redux';
import { fetchSubmissionsByAssignment, gradeSubmission } from '../../store/slices/assignmentsSlice';
import { notify, notifyError } from "../../utils/notify"

// Modern color palette
const colors = {
  primary: '#6366f1',
  primaryLight: '#818cf8',
  primaryDark: '#4f46e5',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',
  bg: '#f8fafc',
  cardBg: '#ffffff',
  text: '#1e293b',
  textSecondary: '#64748b',
  border: '#e2e8f0',
  hover: '#f1f5f9'
};

const AssignmentCorrection = ({ assignment, onBack }) => {
  const dispatch = useDispatch();
  const { submissions, loading } = useSelector((state) => state.assignments);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [gradeData, setGradeData] = useState({
    grade: '',
    feedback: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (assignment?.id) {
      dispatch(fetchSubmissionsByAssignment(assignment.id));
    }
  }, [assignment, dispatch]);

  const handleSelectSubmission = (submission) => {
    setSelectedSubmission(submission);
    setGradeData({
      grade: submission.grade || '',
      feedback: submission.feedback || ''
    });
  };

  const handleGradeChange = (field, value) => {
    setGradeData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmitGrade = async () => {
    if (!selectedSubmission || !gradeData.grade) {
      notify.warning('Veuillez saisir une note');
      return;
    }

    try {
      setSaving(true);
      await dispatch(gradeSubmission({
        submissionId: selectedSubmission.id,
        grade: parseFloat(gradeData.grade),
        feedback: gradeData.feedback
      })).unwrap();

      notify.info('Note enregistrée avec succès!');
      dispatch(fetchSubmissionsByAssignment(assignment.id));
      setSelectedSubmission(null);
    } catch (error) {
      console.error('Erreur lors de la notation:', error);
      notifyError(error, 'Erreur lors de l\'enregistrement de la note');
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (submission) => {
    if (submission.grade !== null) {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 flex items-center gap-1">
          <CheckCircle className="w-3 h-3" />
          Noté
        </span>
      );
    }
    return (
      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
        En attente
      </span>
    );
  };

  const getGradeColor = (grade) => {
    if (grade >= 14) return colors.success;
    if (grade >= 10) return colors.warning;
    return colors.danger;
  };

  const getGradeEmoji = (grade) => {
    if (grade >= 18) return '🏆';
    if (grade >= 14) return '🌟';
    if (grade >= 10) return '👍';
    return '📚';
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
        <p style={{ color: colors.textSecondary, fontWeight: '500' }}>Chargement des soumissions...</p>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </motion.div>
    );
  }

  // Detail view for a specific submission
  if (selectedSubmission) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
      >
        {/* Header */}
        <div style={{
          background: 'var(--color-cardBg)',
          borderRadius: '16px',
          padding: '1.5rem',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          border: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <motion.button
            whileHover={{ scale: 1.1, backgroundColor: colors.primary }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setSelectedSubmission(null)}
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
                {selectedSubmission.student?.first_name?.charAt(0)}{selectedSubmission.student?.last_name?.charAt(0)}
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
                  {selectedSubmission.student?.first_name} {selectedSubmission.student?.last_name}
                </h3>
                <p style={{ fontSize: '0.875rem', color: colors.textSecondary, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Calendar style={{ width: '14px', height: '14px' }} />
                  Soumis le {new Date(selectedSubmission.submitted_at).toLocaleString('fr-FR')}
                </p>
              </div>
            </div>
          </div>
          {selectedSubmission.grade !== null && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
              style={{
                padding: '1.25rem 1.75rem',
                background: `linear-gradient(135deg, ${getGradeColor(selectedSubmission.grade)}15 0%, ${getGradeColor(selectedSubmission.grade)}25 100%)`,
                borderRadius: '16px',
                border: `3px solid ${getGradeColor(selectedSubmission.grade)}`,
                boxShadow: `0 8px 20px ${getGradeColor(selectedSubmission.grade)}30`,
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
                {getGradeEmoji(selectedSubmission.grade)}
              </div>
              <p style={{ fontSize: '0.75rem', color: colors.textSecondary, marginBottom: '0.25rem', fontWeight: '600' }}>Note actuelle</p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
                <p style={{ fontSize: '2.5rem', fontWeight: '800', color: getGradeColor(selectedSubmission.grade), lineHeight: 1 }}>
                  {selectedSubmission.grade}
                </p>
                <p style={{ fontSize: '1.25rem', fontWeight: '600', color: colors.textSecondary }}>/20</p>
              </div>
            </motion.div>
          )}
        </div>

        {/* Content Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
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
          {/* Assignment Info */}
          <div style={{
            padding: '2rem',
            background: `linear-gradient(135deg, ${colors.primary}08 0%, ${colors.primaryLight}05 100%)`,
            borderBottom: `2px solid ${colors.border}`,
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: '-50px',
              right: '-50px',
              width: '150px',
              height: '150px',
              borderRadius: '50%',
              background: `radial-gradient(circle, ${colors.primary}10 0%, transparent 70%)`,
              pointerEvents: 'none'
            }}></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
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
                {assignment.title}
              </h4>
            </div>
            <p style={{
              color: colors.textSecondary,
              lineHeight: '1.8',
              fontSize: '0.95rem',
              margin: 0
            }}>
              {assignment.description}
            </p>
          </div>

          {/* Student Submission */}
          <div style={{ padding: '2rem' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              marginBottom: '1.5rem'
            }}>
              <div style={{
                padding: '0.5rem',
                background: `${colors.info}15`,
                borderRadius: '10px'
              }}>
                <FileText style={{ width: '20px', height: '20px', color: colors.info }} />
              </div>
              <h5 style={{
                fontSize: '1.125rem',
                fontWeight: '700',
                color: colors.text,
                margin: 0
              }}>
                Soumission de l'étudiant
              </h5>
            </div>

            <div style={{
              background: 'var(--color-bodyBg)',
              padding: '1.5rem',
              borderRadius: '12px',
              border: '1px solid var(--color-border)',
              marginBottom: '1.5rem'
            }}>
              <p style={{
                color: 'var(--color-text)',
                lineHeight: '1.8',
                whiteSpace: 'pre-wrap',
                fontSize: '0.95rem'
              }}>
                {selectedSubmission.content || 'Aucun contenu texte'}
              </p>

              {selectedSubmission.file && (
                <motion.a
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  href={selectedSubmission.file}
                  download
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    marginTop: '1.25rem',
                    padding: '1rem 1.5rem',
                    background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryLight} 100%)`,
                    color: 'white',
                    borderRadius: '12px',
                    textDecoration: 'none',
                    fontWeight: '600',
                    fontSize: '0.875rem',
                    boxShadow: `0 8px 20px ${colors.primary}40`,
                    transition: 'all 0.3s ease'
                  }}
                >
                  <Download style={{ width: '18px', height: '18px' }} />
                  Télécharger le fichier joint
                </motion.a>
              )}
            </div>

            {/* Grading Section */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(5, 150, 105, 0.05) 100%)',
              padding: '1.5rem',
              borderRadius: '12px',
              border: '2px dashed var(--color-success)40'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '1rem'
              }}>
                <Star style={{ width: '20px', height: '20px', color: 'var(--color-success)' }} />
                <h5 style={{
                  fontSize: '1rem',
                  fontWeight: '700',
                  color: 'var(--color-text)'
                }}>
                  Notation
                </h5>
              </div>

              <div style={{ display: 'grid', gap: '1rem' }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: 'var(--color-text)',
                    marginBottom: '0.5rem'
                  }}>
                    Note sur 20
                  </label>
                  <input
                    type="number"
                    value={gradeData.grade}
                    onChange={(e) => handleGradeChange('grade', e.target.value)}
                    min="0"
                    max="20"
                    step="0.5"
                    placeholder="Ex: 15.5"
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      background: 'var(--color-cardBg)',
                      border: '2px solid var(--color-border)',
                      borderRadius: '8px',
                      color: 'var(--color-text)',
                      fontSize: '1rem',
                      fontWeight: '600',
                      outline: 'none',
                      transition: 'all 0.2s ease'
                    }}
                    onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                    onBlur={(e) => e.target.style.borderColor = 'var(--color-border)'}
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: 'var(--color-text)',
                    marginBottom: '0.5rem'
                  }}>
                    Feedback / Commentaires
                  </label>
                  <textarea
                    value={gradeData.feedback}
                    onChange={(e) => handleGradeChange('feedback', e.target.value)}
                    rows="5"
                    placeholder="Commentaires pour l'étudiant..."
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      background: 'var(--color-cardBg)',
                      border: '2px solid var(--color-border)',
                      borderRadius: '8px',
                      color: 'var(--color-text)',
                      fontSize: '0.95rem',
                      lineHeight: '1.6',
                      outline: 'none',
                      transition: 'all 0.2s ease',
                      resize: 'vertical'
                    }}
                    onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                    onBlur={(e) => e.target.style.borderColor = 'var(--color-border)'}
                  />
                </div>
              </div>
            </div>

            {/* Previous Feedback Display */}
            {selectedSubmission.feedback && (
              <div style={{
                marginTop: '1.5rem',
                padding: '1rem',
                background: 'rgba(59, 130, 246, 0.05)',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                borderRadius: '8px'
              }}>
                <p style={{
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  color: 'var(--color-textSecondary)',
                  marginBottom: '0.5rem'
                }}>
                  Feedback précédent:
                </p>
                <p style={{
                  color: 'var(--color-text)',
                  fontSize: '0.875rem',
                  lineHeight: '1.6'
                }}>
                  {selectedSubmission.feedback}
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{
            padding: '1.5rem',
            borderTop: '1px solid var(--color-border)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '1rem',
            background: 'var(--color-bodyBg)'
          }}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedSubmission(null)}
              style={{
                padding: '0.75rem 1.5rem',
                border: '2px solid var(--color-border)',
                borderRadius: '10px',
                color: 'var(--color-text)',
                background: 'var(--color-cardBg)',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              Annuler
            </motion.button>
            <motion.button
              whileHover={{ scale: saving ? 1 : 1.02 }}
              whileTap={{ scale: saving ? 1 : 0.98 }}
              onClick={handleSubmitGrade}
              disabled={saving || !gradeData.grade}
              style={{
                padding: '0.75rem 1.5rem',
                background: saving || !gradeData.grade
                  ? 'rgba(156, 163, 175, 0.7)'
                  : 'linear-gradient(135deg, var(--color-success) 0%, #059669 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontWeight: '600',
                cursor: saving || !gradeData.grade ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: saving ? 'none' : '0 4px 12px rgba(16, 185, 129, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <Save style={{ width: '16px', height: '16px' }} />
              {saving ? 'Enregistrement...' : 'Enregistrer la note'}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  // List view of all submissions
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
    >
      {/* Header */}
      <div style={{
        background: 'var(--color-cardBg)',
        borderRadius: '16px',
        padding: '1.5rem',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        border: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem'
      }}>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onBack}
          style={{
            padding: '0.75rem',
            background: 'var(--color-bodyBg)',
            border: '1px solid var(--color-border)',
            borderRadius: '10px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            transition: 'all 0.2s ease'
          }}
        >
          <ArrowLeft style={{ width: '20px', height: '20px', color: 'var(--color-text)' }} />
        </motion.button>
        <div style={{ flex: 1 }}>
          <h3 style={{
            fontSize: '1.5rem',
            fontWeight: '700',
            color: 'var(--color-text)',
            marginBottom: '0.25rem'
          }}>
            {assignment.title}
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-textSecondary)' }}>
            {submissions?.length || 0} soumission(s)
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
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
            label: 'Total Soumissions',
            value: submissions?.length || 0,
            color: 'var(--color-primary)',
            bgColor: 'rgba(99, 102, 241, 0.1)'
          },
          {
            label: 'À Corriger',
            value: submissions?.filter(s => s.grade === null).length || 0,
            color: '#f59e0b',
            bgColor: 'rgba(245, 158, 11, 0.1)'
          },
          {
            label: 'Corrigés',
            value: submissions?.filter(s => s.grade !== null).length || 0,
            color: 'var(--color-success)',
            bgColor: 'rgba(16, 185, 129, 0.1)'
          },
          {
            label: 'Moyenne',
            value: submissions?.filter(s => s.grade !== null).length > 0
              ? (submissions.reduce((sum, s) => sum + (s.grade || 0), 0) / submissions.filter(s => s.grade !== null).length).toFixed(1)
              : '-',
            color: '#9333EA',
            bgColor: 'rgba(147, 51, 234, 0.1)'
          }
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + index * 0.05 }}
            whileHover={{ scale: 1.05, y: -5 }}
            style={{
              background: 'var(--color-cardBg)',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              padding: '1.5rem',
              border: '1px solid var(--color-border)',
              transition: 'all 0.3s ease'
            }}
          >
            <p style={{
              fontSize: '0.875rem',
              color: 'var(--color-textSecondary)',
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

      {/* Submissions List */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        style={{
          background: 'var(--color-cardBg)',
          borderRadius: '16px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
          overflow: 'hidden',
          border: '1px solid var(--color-border)'
        }}
      >
        {submissions && submissions.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{
                background: 'linear-gradient(135deg, var(--color-bodyBg) 0%, rgba(0,0,0,0.02) 100%)'
              }}>
                <tr>
                  {['Étudiant', 'Date de soumission', 'Statut', 'Note', 'Action'].map(header => (
                    <th key={header} style={{
                      padding: '1rem 1.5rem',
                      textAlign: 'left',
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      color: 'var(--color-textSecondary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      borderBottom: '2px solid var(--color-border)'
                    }}>
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {submissions.map((submission, index) => (
                  <motion.tr
                    key={submission.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    style={{
                      borderBottom: '1px solid var(--color-border)',
                      transition: 'background 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-bodyBg)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, var(--color-primary) 0%, #667eea 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontWeight: '700',
                          fontSize: '0.875rem'
                        }}>
                          {submission.student?.first_name?.charAt(0)}{submission.student?.last_name?.charAt(0)}
                        </div>
                        <div>
                          <div style={{
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            color: 'var(--color-text)'
                          }}>
                            {submission.student?.first_name} {submission.student?.last_name}
                          </div>
                          <div style={{
                            fontSize: '0.75rem',
                            color: 'var(--color-textSecondary)'
                          }}>
                            {submission.student?.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{
                      padding: '1rem 1.5rem',
                      fontSize: '0.875rem',
                      color: 'var(--color-text)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Calendar style={{ width: '14px', height: '14px', color: 'var(--color-textSecondary)' }} />
                        {new Date(submission.submitted_at).toLocaleDateString('fr-FR')}
                      </div>
                      <div style={{
                        fontSize: '0.75rem',
                        color: 'var(--color-textSecondary)',
                        marginTop: '0.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        <Clock style={{ width: '12px', height: '12px' }} />
                        {new Date(submission.submitted_at).toLocaleTimeString('fr-FR')}
                      </div>
                    </td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      {getStatusBadge(submission)}
                    </td>
                    <td style={{
                      padding: '1rem 1.5rem',
                      fontSize: '0.875rem',
                      fontWeight: '700'
                    }}>
                      {submission.grade !== null ? (
                        <span style={{ color: getGradeColor(submission.grade) }}>
                          {submission.grade}/20
                        </span>
                      ) : (
                        <span style={{ color: 'var(--color-textSecondary)' }}>-</span>
                      )}
                    </td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleSelectSubmission(submission)}
                        style={{
                          padding: '0.5rem 1rem',
                          background: 'linear-gradient(135deg, var(--color-primary) 0%, #667eea 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          fontWeight: '600',
                          fontSize: '0.875rem',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)'
                        }}
                      >
                        {submission.grade !== null ? 'Modifier' : 'Corriger'}
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
              color: 'var(--color-textSecondary)',
              margin: '0 auto 1rem'
            }} />
            <h5 style={{
              fontSize: '1.1rem',
              fontWeight: '600',
              color: 'var(--color-text)',
              marginBottom: '0.5rem'
            }}>
              Aucune soumission
            </h5>
            <p style={{ color: 'var(--color-textSecondary)', fontSize: '0.875rem' }}>
              Les étudiants n'ont pas encore soumis de travaux
            </p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default AssignmentCorrection;
