import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import AssignmentList from '../components/Assignments/AssignmentList';
import AssignmentForm from '../components/Assignments/AssignmentForm';
import AssignmentGrading from '../components/Assignments/AssignmentGrading';

const TeacherAssignments = () => {
  const [view, setView] = useState('list'); // 'list', 'create', 'edit', 'grade'
  const [selectedAssignment, setSelectedAssignment] = useState(null);

  const handleCreate = () => {
    setSelectedAssignment(null);
    setView('create');
  };

  const handleEdit = (assignment) => {
    setSelectedAssignment(assignment);
    setView('edit');
  };

  const handleViewSubmissions = (assignment) => {
    setSelectedAssignment(assignment);
    setView('grade');
  };

  const handleSuccess = () => {
    setView('list');
    setSelectedAssignment(null);
  };

  const handleCancel = () => {
    setView('list');
    setSelectedAssignment(null);
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
              <AssignmentList
                onCreate={handleCreate}
                onEdit={handleEdit}
                onViewSubmissions={handleViewSubmissions}
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
              <AssignmentForm
                assignment={selectedAssignment}
                onSuccess={handleSuccess}
                onCancel={handleCancel}
              />
            </motion.div>
          )}

          {view === 'grade' && (
            <motion.div
              key="grade"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <AssignmentGrading
                assignment={selectedAssignment}
                onBack={handleCancel}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default TeacherAssignments;
