import React, { useState, useEffect } from 'react';
import { FileText, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import assignmentService from '../services/assignmentService';
import SubmitAssignment from '../components/Students/SubmitAssignment';

const StudentAssignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [assignmentsRes, submissionsRes] = await Promise.all([
        assignmentService.getAssignments(),
        assignmentService.getMySubmissions()
      ]);
      setAssignments(assignmentsRes.data.results);
      setSubmissions(submissionsRes.data.results);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSubmission = (assignmentId) => {
    if (!submissions || submissions.length === 0) return null;
    return submissions.find(s => s.assignment?.id === assignmentId || s.assignment === assignmentId);
  };

  const isLate = (dueDate) => {
    if (!dueDate) return false;
    return new Date() > new Date(dueDate);
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

  const getStatusBadge = (assignment) => {
    const submission = getSubmission(assignment.id);

    if (!submission) {
      if (isLate(assignment.due_date)) {
        return <span style={{ padding: '0.25rem 0.5rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '500', background: 'rgba(220, 53, 69, 0.1)', color: 'var(--color-danger)' }}>En retard</span>;
      }
      return <span style={{ padding: '0.25rem 0.5rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '500', background: 'rgba(244, 169, 0, 0.1)', color: 'var(--color-warning)' }}>À faire</span>;
    }

    if (submission.status === 'graded') {
      return <span style={{ padding: '0.25rem 0.5rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '500', background: 'rgba(28, 200, 138, 0.1)', color: 'var(--color-success)' }}>Noté</span>;
    }

    return <span style={{ padding: '0.25rem 0.5rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '500', background: 'var(--color-primaryLight)', color: 'var(--color-primary)' }}>Soumis</span>;
  };

  const filteredAssignments = assignments.filter(a => {
    const submission = getSubmission(a.id);

    if (filter === 'todo') return !submission;
    if (filter === 'submitted') return submission && submission.status !== 'graded';
    if (filter === 'graded') return submission && submission.status === 'graded';

    return true;
  });

  if (selectedAssignment) {
    return (
      <SubmitAssignment
        assignment={selectedAssignment}
        onComplete={() => {
          setSelectedAssignment(null);
          loadData();
        }}
        onCancel={() => setSelectedAssignment(null)}
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
      style={{ minHeight: '100%', background: 'var(--color-bodyBg)', padding: '1.5rem' }}
    >
      <div style={{ maxWidth: '80rem', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 style={{ fontSize: '1.875rem', fontWeight: '700', color: 'var(--color-textPrimary)', marginBottom: '0.5rem' }}>Mes Devoirs (TP/TD)</h2>
          <p style={{ color: 'var(--color-textSecondary)' }}>Gérez vos travaux pratiques et dirigés</p>
        </motion.div>

        {/* Filtres */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setFilter('all')}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              fontWeight: '600',
              transition: 'all 0.3s ease',
              background: filter === 'all' ? 'var(--color-gradientPrimary)' : 'var(--color-cardBg)',
              color: filter === 'all' ? 'white' : 'var(--color-textPrimary)',
              border: filter === 'all' ? 'none' : '1px solid var(--color-border)',
              cursor: 'pointer',
              boxShadow: filter === 'all' ? '0 4px 12px rgba(59, 130, 246, 0.3)' : '0 2px 8px rgba(0,0,0,0.05)'
            }}
          >
            Tous ({assignments.length})
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setFilter('todo')}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              fontWeight: '600',
              transition: 'all 0.3s ease',
              background: filter === 'todo' ? 'var(--color-gradientWarning)' : 'var(--color-cardBg)',
              color: filter === 'todo' ? 'white' : 'var(--color-textPrimary)',
              border: filter === 'todo' ? 'none' : '1px solid var(--color-border)',
              cursor: 'pointer',
              boxShadow: filter === 'todo' ? '0 4px 12px rgba(245, 158, 11, 0.3)' : '0 2px 8px rgba(0,0,0,0.05)'
            }}
          >
            À faire ({assignments.filter(a => !getSubmission(a.id)).length})
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setFilter('submitted')}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              fontWeight: '600',
              transition: 'all 0.3s ease',
              background: filter === 'submitted' ? 'var(--color-gradientPrimary)' : 'var(--color-cardBg)',
              color: filter === 'submitted' ? 'white' : 'var(--color-textPrimary)',
              border: filter === 'submitted' ? 'none' : '1px solid var(--color-border)',
              cursor: 'pointer',
              boxShadow: filter === 'submitted' ? '0 4px 12px rgba(59, 130, 246, 0.3)' : '0 2px 8px rgba(0,0,0,0.05)'
            }}
          >
            Soumis ({submissions.filter(s => s.status !== 'graded').length})
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setFilter('graded')}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              fontWeight: '600',
              transition: 'all 0.3s ease',
              background: filter === 'graded' ? 'var(--color-gradientSuccess)' : 'var(--color-cardBg)',
              color: filter === 'graded' ? 'white' : 'var(--color-textPrimary)',
              border: filter === 'graded' ? 'none' : '1px solid var(--color-border)',
              cursor: 'pointer',
              boxShadow: filter === 'graded' ? '0 4px 12px rgba(16, 185, 129, 0.3)' : '0 2px 8px rgba(0,0,0,0.05)'
            }}
          >
            Notés ({submissions.filter(s => s.status === 'graded').length})
          </motion.button>
        </motion.div>

        {/* Liste des devoirs */}
        <AnimatePresence mode="wait">
          {filteredAssignments.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{
                textAlign: 'center',
                padding: '3rem',
                background: 'var(--color-cardBg)',
                borderRadius: '16px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
                border: '1px solid var(--color-border)'
              }}
            >
              <FileText style={{ width: '4rem', height: '4rem', margin: '0 auto 1rem', color: 'rgba(0,0,0,0.3)' }} />
              <p style={{ color: 'var(--text-secondary)' }}>Aucun devoir trouvé</p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ display: 'grid', gap: '1rem' }}
            >
            {filteredAssignments.map((assignment, index) => {
              const submission = getSubmission(assignment.id);
              const late = isLate(assignment.due_date);

              return (
                <motion.div
                  key={assignment.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.02, y: -5 }}
                  style={{
                    background: 'var(--color-cardBg)',
                    borderRadius: '16px',
                    boxShadow: 'var(--color-cardShadow)',
                    padding: '1.5rem',
                    transition: 'all 0.3s ease',
                    border: '1px solid var(--color-cardBorder)'
                  }}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          assignment.assignment_type === 'TP'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {assignment.assignment_type}
                        </span>
                        {getStatusBadge(assignment)}
                        {late && !submission && (
                          <AlertCircle className="w-5 h-5 text-red-600" />
                        )}
                      </div>
                      <h3 className="text-xl font-semibold text-gray-800 mb-1">
                        {assignment.title}
                      </h3>
                      <p className="text-gray-600 text-sm">
                        {assignment.course?.name || assignment.course?.nom}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2 text-gray-600 mb-1">
                        <Clock className="w-4 h-4" />
                        <span className={`text-sm ${late && !submission ? 'text-red-600 font-semibold' : ''}`}>
                          {formatDate(assignment.due_date)}
                        </span>
                      </div>
                      {submission?.score !== null && (
                        <div className="text-lg font-bold text-green-600">
                          {submission?.score || 0} / {assignment.max_points}
                        </div>
                      )}
                    </div>
                  </div>

                  {assignment.description && (
                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {assignment.description}
                    </p>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '1rem', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      {assignment.questions?.length || 0} question(s)
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedAssignment(assignment)}
                      style={{
                        padding: '0.5rem 1rem',
                        borderRadius: '8px',
                        fontWeight: '600',
                        transition: 'all 0.3s ease',
                        background: submission?.status === 'graded'
                          ? 'rgba(0,0,0,0.05)'
                          : 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)',
                        color: submission?.status === 'graded' ? 'var(--text-primary)' : 'white',
                        border: 'none',
                        cursor: 'pointer',
                        boxShadow: submission?.status === 'graded' ? 'none' : '0 4px 12px rgba(59, 130, 246, 0.3)'
                      }}
                    >
                      {submission?.status === 'graded' ? 'Voir la correction' : submission ? 'Modifier ma soumission' : 'Commencer'}
                    </motion.button>
                  </div>

                  {submission?.feedback && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm font-medium text-gray-700 mb-1">Feedback:</p>
                      <p className="text-sm text-gray-700">{submission.feedback}</p>
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

export default StudentAssignments;
