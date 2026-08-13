import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import QuizList from '../components/Quiz/QuizList';
import QuizForm from '../components/Quiz/QuizForm';
import QuizGrading from '../components/Quiz/QuizGrading';

const TeacherQuizzes = () => {
  const [view, setView] = useState('list'); // 'list', 'create', 'edit', 'grade'
  const [selectedQuiz, setSelectedQuiz] = useState(null);

  const handleCreate = () => {
    setSelectedQuiz(null);
    setView('create');
  };

  const handleEdit = (quiz) => {
    setSelectedQuiz(quiz);
    setView('edit');
  };

  const handleViewAttempts = (quiz) => {
    setSelectedQuiz(quiz);
    setView('grade');
  };

  const handleSuccess = () => {
    setView('list');
    setSelectedQuiz(null);
  };

  const handleCancel = () => {
    setView('list');
    setSelectedQuiz(null);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--color-bodyBg)',
      padding: '24px'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <AnimatePresence mode="wait">
          {view === 'list' && (
            <motion.div
              key="list"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <QuizList
                onCreate={handleCreate}
                onEdit={handleEdit}
                onViewAttempts={handleViewAttempts}
              />
            </motion.div>
          )}

          {(view === 'create' || view === 'edit') && (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <motion.button
                whileHover={{ x: -4 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCancel}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: 'var(--color-textSecondary)',
                  background: 'transparent',
                  border: 'none',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  marginBottom: '20px',
                  cursor: 'pointer',
                  padding: '8px 0',
                  transition: 'color 0.2s ease'
                }}
                onMouseEnter={(e) => e.target.style.color = 'var(--color-primary)'}
                onMouseLeave={(e) => e.target.style.color = 'var(--color-textSecondary)'}
              >
                <ArrowLeft size={20} />
                Retour à la liste
              </motion.button>
              <QuizForm
                quiz={selectedQuiz}
                onSuccess={handleSuccess}
                onCancel={handleCancel}
              />
            </motion.div>
          )}

          {view === 'grade' && selectedQuiz && (
            <motion.div
              key="grade"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <QuizGrading
                quiz={selectedQuiz}
                onBack={handleCancel}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default TeacherQuizzes;
