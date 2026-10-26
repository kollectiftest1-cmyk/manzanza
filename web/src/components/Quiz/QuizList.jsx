import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit, Trash2, Eye, Clock, Users, CheckCircle, Award, Search, Filter, Calendar, Trophy } from 'lucide-react';
import quizService from '../../services/quizService';
import { notify, notifyError } from "../../utils/notify"

const QuizList = ({ onEdit, onCreate, onViewAttempts }) => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadQuizzes();
  }, []);

  const loadQuizzes = async () => {
    try {
      setLoading(true);
      const response = await quizService.getMyQuizzes();
      console.log('quiz :',response.data.results);
      
      setQuizzes(Array.isArray(response.data.results) ? response.data.results : []);
    } catch (error) {
      console.error('Erreur lors du chargement des quiz:', error);
      setQuizzes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce quiz ?')) {
      return;
    }

    try {
      await quizService.deleteQuiz(id);
      setQuizzes(prev => prev.filter(q => q.id !== id));
      notify.info('Quiz supprimé avec succès');
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      notifyError(error, 'Erreur lors de la suppression du quiz');
    }
  };

  const handlePublish = async (id) => {
    try {
      await quizService.publishQuiz(id);
      loadQuizzes();
      notify.info('Quiz publié avec succès');
    } catch (error) {
      console.error('Erreur lors de la publication:', error);
      notifyError(error, 'Erreur lors de la publication du quiz');
    }
  };

  const filteredQuizzes = quizzes.filter(q => {
    if (filter !== 'all' && q.status !== filter) return false;
    if (searchTerm && !q.title.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const getStatusStyle = (status) => {
    const styles = {
      draft: { background: 'rgba(128, 128, 128, 0.1)', color: 'var(--color-textSecondary)' },
      published: { background: 'rgba(28, 200, 138, 0.1)', color: 'var(--color-success)' },
      closed: { background: 'rgba(231, 74, 59, 0.1)', color: 'var(--color-danger)' }
    };
    return styles[status] || styles.draft;
  };

  const getStatusLabel = (status) => {
    const labels = { draft: 'Brouillon', published: 'Publié', closed: 'Fermé' };
    return labels[status] || status;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px',
        color: 'var(--color-primary)'
      }}>
        <div className="spinner-border" style={{ width: '3rem', height: '3rem' }}></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          marginBottom: '32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div>
          <h2 style={{
            fontSize: '2rem',
            fontWeight: '700',
            color: 'var(--color-textPrimary)',
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <Trophy size={32} style={{ color: 'var(--color-warning)' }} />
            Gestion des Quiz
          </h2>
          <p style={{ color: 'var(--color-textSecondary)', margin: 0 }}>
            Créez et gérez vos quiz et évaluations
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onCreate}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 24px',
            borderRadius: '12px',
            border: 'none',
            background: 'linear-gradient(135deg, var(--color-warning), #e67e22)',
            color: 'white',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(246, 194, 62, 0.3)',
            fontSize: '1rem'
          }}
        >
          <Plus size={20} />
          Nouveau Quiz
        </motion.button>
      </motion.div>

      {/* Filtres */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={{
          display: 'flex',
          gap: '16px',
          marginBottom: '24px',
          flexWrap: 'wrap'
        }}
      >
        <div style={{ flex: 1, minWidth: '250px', position: 'relative' }}>
          <Search
            size={20}
            style={{
              position: 'absolute',
              left: '16px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--color-textSecondary)'
            }}
          />
          <input
            type="text"
            placeholder="Rechercher un quiz..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px 12px 48px',
              borderRadius: '12px',
              border: '2px solid var(--color-border)',
              background: 'var(--color-cardBg)',
              color: 'var(--color-textPrimary)',
              fontSize: '1rem',
              outline: 'none',
              transition: 'border-color 0.3s ease'
            }}
            onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
            onBlur={(e) => e.target.style.borderColor = 'var(--color-border)'}
          />
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Filter size={20} style={{ color: 'var(--color-textSecondary)' }} />
          {['all', 'draft', 'published', 'closed'].map(status => (
            <motion.button
              key={status}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setFilter(status)}
              style={{
                padding: '10px 20px',
                borderRadius: '10px',
                border: filter === status ? 'none' : '2px solid var(--color-border)',
                background: filter === status ? 'var(--color-primary)' : 'transparent',
                color: filter === status ? 'white' : 'var(--color-textPrimary)',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '0.9rem',
                transition: 'all 0.2s ease'
              }}
            >
              {status === 'all' ? 'Tous' : getStatusLabel(status)}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Liste des quiz */}
      <AnimatePresence mode="wait">
        {filteredQuizzes.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            style={{
              textAlign: 'center',
              padding: '80px 20px',
              background: 'var(--color-cardBg)',
              borderRadius: '16px',
              border: '1px solid var(--color-border)'
            }}
          >
            <Trophy size={64} style={{ color: 'var(--color-textSecondary)', marginBottom: '20px', opacity: 0.5 }} />
            <h3 style={{ color: 'var(--color-textPrimary)', fontSize: '1.3rem', marginBottom: '8px', fontWeight: '600' }}>
              Aucun quiz trouvé
            </h3>
            <p style={{ color: 'var(--color-textSecondary)', marginBottom: '24px' }}>
              Commencez par créer votre premier quiz
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onCreate}
              style={{
                padding: '12px 32px',
                borderRadius: '10px',
                border: 'none',
                background: 'var(--color-warning)',
                color: 'white',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              Créer votre premier quiz
            </motion.button>
          </motion.div>
        ) : (
          <div style={{ display: 'grid', gap: '20px' }}>
            {filteredQuizzes.map((quiz, index) => (
              <motion.div
                key={quiz.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -4 }}
                style={{
                  background: 'var(--color-cardBg)',
                  borderRadius: '16px',
                  padding: '24px',
                  border: '1px solid var(--color-border)',
                  boxShadow: 'var(--color-cardShadow)',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}
              >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', gap: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                      <span style={{
                        ...getStatusStyle(quiz.status),
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontSize: '0.85rem',
                        fontWeight: '600'
                      }}>
                        {getStatusLabel(quiz.status)}
                      </span>
                      {quiz.allow_multiple_attempts && (
                        <span style={{
                          background: 'rgba(111, 66, 193, 0.1)',
                          color: '#6f42c1',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          fontSize: '0.85rem',
                          fontWeight: '600'
                        }}>
                          🔄 Plusieurs tentatives
                        </span>
                      )}
                    </div>
                    <h3 style={{
                      fontSize: '1.3rem',
                      fontWeight: '700',
                      color: 'var(--color-textPrimary)',
                      marginBottom: '8px'
                    }}>
                      {quiz.title}
                    </h3>
                    <p style={{ color: 'var(--color-textSecondary)', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Award size={16} />
                      {quiz.course_name || quiz.course?.nom || 'Cours non défini'}
                    </p>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {quiz.status === 'draft' && (
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => { e.stopPropagation(); handlePublish(quiz.id); }}
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '10px',
                          border: 'none',
                          background: 'rgba(28, 200, 138, 0.1)',
                          color: 'var(--color-success)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s ease'
                        }}
                        title="Publier"
                      >
                        <CheckCircle size={20} />
                      </motion.button>
                    )}
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => { e.stopPropagation(); onEdit(quiz); }}
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        border: 'none',
                        background: 'rgba(78, 115, 223, 0.1)',
                        color: 'var(--color-primary)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title="Modifier"
                    >
                      <Edit size={20} />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => { e.stopPropagation(); onViewAttempts(quiz); }}
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        border: 'none',
                        background: 'rgba(111, 66, 193, 0.1)',
                        color: '#6f42c1',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title="Voir les tentatives"
                    >
                      <Eye size={20} />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => { e.stopPropagation(); handleDelete(quiz.id); }}
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        border: 'none',
                        background: 'rgba(231, 74, 59, 0.1)',
                        color: 'var(--color-danger)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title="Supprimer"
                    >
                      <Trash2 size={20} />
                    </motion.button>
                  </div>
                </div>

                {/* Description */}
                {quiz.description && (
                  <p style={{
                    color: 'var(--color-textSecondary)',
                    marginBottom: '20px',
                    fontSize: '0.95rem',
                    lineHeight: '1.6',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {quiz.description}
                  </p>
                )}

                {/* Stats Grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                  gap: '16px',
                  marginBottom: '20px'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px',
                    background: 'var(--color-bodyBg)',
                    borderRadius: '10px'
                  }}>
                    <Clock size={20} style={{ color: 'var(--color-primary)' }} />
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-textSecondary)', marginBottom: '2px' }}>
                        Durée
                      </div>
                      <div style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--color-textPrimary)' }}>
                        {quiz.duration_minutes} min
                      </div>
                    </div>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px',
                    background: 'var(--color-bodyBg)',
                    borderRadius: '10px'
                  }}>
                    <Award size={20} style={{ color: 'var(--color-warning)' }} />
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-textSecondary)', marginBottom: '2px' }}>
                        Questions
                      </div>
                      <div style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--color-textPrimary)' }}>
                        {quiz.questions?.length || 0}
                      </div>
                    </div>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px',
                    background: 'var(--color-bodyBg)',
                    borderRadius: '10px'
                  }}>
                    <Users size={20} style={{ color: 'var(--color-success)' }} />
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-textSecondary)', marginBottom: '2px' }}>
                        Tentatives
                      </div>
                      <div style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--color-textPrimary)' }}>
                        {quiz.attempts_count || 0}
                      </div>
                    </div>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px',
                    background: 'var(--color-bodyBg)',
                    borderRadius: '10px'
                  }}>
                    <Trophy size={20} style={{ color: 'var(--color-info)' }} />
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-textSecondary)', marginBottom: '2px' }}>
                        Points max
                      </div>
                      <div style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--color-textPrimary)' }}>
                        {quiz.max_points}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: '16px',
                  borderTop: '1px solid var(--color-border)',
                  flexWrap: 'wrap',
                  gap: '12px',
                  fontSize: '0.85rem',
                  color: 'var(--color-textSecondary)'
                }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={14} />
                    Début: {formatDate(quiz.start_date)}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={14} />
                    Fin: {formatDate(quiz.end_date)}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default QuizList;
