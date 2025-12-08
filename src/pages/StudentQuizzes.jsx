import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, AlertCircle, BarChart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import quizService from '../services/quizService';
import TakeQuiz from '../components/Students/TakeQuiz';

const StudentQuizzes = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [filter, setFilter] = useState('available');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [quizzesRes, attemptsRes] = await Promise.all([
        quizService.getAvailableQuizzes(),
        quizService.getMyAttempts()
      ]);
      console.log('quiz',quizzesRes.data);
      
      setQuizzes(quizzesRes.data.results);
      setAttempts(attemptsRes.data.results);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAttempts = (quizId) => {
    return attempts.filter(a => a.quiz?.id === quizId || a.quiz === quizId);
  };

  const getBestScore = (quizId) => {
    const quizAttempts = getAttempts(quizId);
    if (quizAttempts.length === 0) return null;
    return Math.max(...quizAttempts.filter(a => a.score !== null).map(a => a.score));
  };

  const canTakeQuiz = (quiz) => {
    const quizAttempts = getAttempts(quiz.id);
    if (!quiz.allow_multiple_attempts && quizAttempts.length > 0) return false;
    if (quizAttempts.length >= quiz.max_attempts) return false;

    // Vérifier les dates
    const now = new Date();
    if (quiz.start_date && new Date(quiz.start_date) > now) return false;
    if (quiz.end_date && new Date(quiz.end_date) < now) return false;

    return true;
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

  const getStatusBadge = (quiz) => {
    const quizAttempts = getAttempts(quiz.id);
    const bestScore = getBestScore(quiz.id);

    if (quizAttempts.some(a => a.status === 'graded')) {
      return <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Noté</span>;
    }

    if (quizAttempts.some(a => a.status === 'submitted')) {
      return <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">En attente</span>;
    }

    if (!canTakeQuiz(quiz)) {
      return <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Terminé</span>;
    }

    return <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Disponible</span>;
  };

  const filteredQuizzes = quizzes.filter(q => {
    const quizAttempts = getAttempts(q.id);

    if (filter === 'available') return canTakeQuiz(q);
    if (filter === 'completed') return quizAttempts.length > 0;
    if (filter === 'graded') return quizAttempts.some(a => a.status === 'graded');

    return true;
  });

  if (selectedQuiz) {
    return (
      <TakeQuiz
        quiz={selectedQuiz}
        onComplete={() => {
          setSelectedQuiz(null);
          loadData();
        }}
        onCancel={() => setSelectedQuiz(null)}
      />
    );
  }

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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)', padding: '1.5rem' }}
    >
      <div style={{ maxWidth: '80rem', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 style={{ fontSize: '1.875rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Mes Quiz</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Passez vos quiz et consultez vos résultats</p>
        </motion.div>

        {/* Filtres */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}
        >
          {[
            { key: 'all', label: `Tous (${quizzes.length})`, gradient: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)', shadow: 'rgba(59, 130, 246, 0.3)' },
            { key: 'available', label: `Disponibles (${quizzes.filter(q => canTakeQuiz(q)).length})`, gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', shadow: 'rgba(245, 158, 11, 0.3)' },
            { key: 'completed', label: `Complétés (${quizzes.filter(q => getAttempts(q.id).length > 0).length})`, gradient: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)', shadow: 'rgba(59, 130, 246, 0.3)' },
            { key: 'graded', label: `Notés (${quizzes.filter(q => getAttempts(q.id).some(a => a.status === 'graded')).length})`, gradient: 'linear-gradient(135deg, var(--color-success) 0%, #059669 100%)', shadow: 'rgba(16, 185, 129, 0.3)' }
          ].map(btn => (
            <motion.button
              key={btn.key}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setFilter(btn.key)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                fontWeight: '600',
                transition: 'all 0.3s ease',
                background: filter === btn.key ? btn.gradient : 'white',
                color: filter === btn.key ? 'white' : 'var(--text-primary)',
                border: 'none',
                cursor: 'pointer',
                boxShadow: filter === btn.key ? `0 4px 12px ${btn.shadow}` : '0 2px 8px rgba(0,0,0,0.05)'
              }}
            >
              {btn.label}
            </motion.button>
          ))}
        </motion.div>

        {/* Liste des quiz */}
        <AnimatePresence mode="wait">
          {filteredQuizzes.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{
                textAlign: 'center',
                padding: '3rem',
                background: 'white',
                borderRadius: '16px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.08)'
              }}
            >
              <BarChart style={{ width: '4rem', height: '4rem', margin: '0 auto 1rem', color: 'rgba(0,0,0,0.3)' }} />
              <p style={{ color: 'var(--text-secondary)' }}>Aucun quiz trouvé</p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ display: 'grid', gap: '1rem' }}
            >
            {filteredQuizzes.map((quiz, index) => {
              const quizAttempts = getAttempts(quiz.id);
              const bestScore = getBestScore(quiz.id);
              const canTake = canTakeQuiz(quiz);

              return (
                <motion.div
                  key={quiz.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.02, y: -5 }}
                  style={{
                    background: 'white',
                    borderRadius: '16px',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                    padding: '1.5rem',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusBadge(quiz)}
                        {quiz.allow_multiple_attempts && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                            {quizAttempts.length}/{quiz.max_attempts} tentatives
                          </span>
                        )}
                      </div>
                      <h3 className="text-xl font-semibold text-gray-800 mb-1">
                        {quiz.title}
                      </h3>
                      <p className="text-gray-600 text-sm">
                        {quiz.course?.name || quiz.course?.nom}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2 text-gray-600 mb-1">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm">{quiz.duration_minutes} min</span>
                      </div>
                      {bestScore !== null && (
                        <div className="text-lg font-bold text-green-600">
                          {bestScore.toFixed(1)} / {quiz.max_points}
                        </div>
                      )}
                    </div>
                  </div>

                  {quiz.description && (
                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {quiz.description}
                    </p>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">{quiz.questions?.length || 0}</span> questions
                    </div>
                    <div>
                      Points: <span className="font-medium">{quiz.max_points}</span>
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      Fin: {formatDate(quiz.end_date)}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '1rem', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      {quizAttempts.length > 0 && `${quizAttempts.length} tentative(s) effectuée(s)`}
                    </div>
                    <motion.button
                      whileHover={{ scale: canTake ? 1.05 : 1 }}
                      whileTap={{ scale: canTake ? 0.95 : 1 }}
                      onClick={() => setSelectedQuiz(quiz)}
                      disabled={!canTake}
                      style={{
                        padding: '0.5rem 1rem',
                        borderRadius: '8px',
                        fontWeight: '600',
                        transition: 'all 0.3s ease',
                        background: canTake
                          ? 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)'
                          : 'rgba(0,0,0,0.1)',
                        color: canTake ? 'white' : 'rgba(0,0,0,0.4)',
                        border: 'none',
                        cursor: canTake ? 'pointer' : 'not-allowed',
                        boxShadow: canTake ? '0 4px 12px rgba(59, 130, 246, 0.3)' : 'none'
                      }}
                    >
                      {canTake ? 'Commencer' : 'Non disponible'}
                    </motion.button>
                  </div>

                  {/* Afficher les tentatives précédentes */}
                  {quizAttempts.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-sm font-medium text-gray-700 mb-2">Tentatives précédentes:</p>
                      <div className="space-y-2">
                        {quizAttempts.map((attempt, index) => (
                          <div key={attempt.id} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                            <span className="text-gray-600">
                              Tentative #{attempt.attempt_number} - {new Date(attempt.started_at).toLocaleDateString('fr-FR')}
                            </span>
                            {attempt.score !== null && (
                              <span className="font-semibold text-green-600">
                                {attempt.score} / {quiz.max_points}
                              </span>
                            )}
                            {attempt.status === 'submitted' && (
                              <span className="text-blue-600">En cours de correction</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default StudentQuizzes;
