import React, { useState, useEffect } from 'react';
import { FileText, Clock, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import assignmentService from '../../services/assignmentService';

const AssignmentsWidget = ({ role }) => {
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      if (role === 'etudiant') {
        const [assignmentsRes, submissionsRes] = await Promise.all([
          assignmentService.getAssignments({ status: 'published' }),
          assignmentService.getMySubmissions()
        ]);
        setAssignments(assignmentsRes.data.slice(0, 5));
        setSubmissions(submissionsRes.data);
      } else {
        const response = await assignmentService.getMyAssignments();
        setAssignments(response.data.slice(0, 5));
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSubmission = (assignmentId) => {
    return submissions.find(s => s.assignment?.id === assignmentId || s.assignment === assignmentId);
  };

  const isLate = (dueDate) => {
    if (!dueDate) return false;
    return new Date() > new Date(dueDate);
  };

  const handleViewAll = () => {
    if (role === 'etudiant') {
      navigate('/student/assignments');
    } else {
      navigate('/teacher/assignments');
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            {role === 'etudiant' ? 'Mes TP/TD' : 'TP/TD récents'}
          </h3>
          <button
            onClick={handleViewAll}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
          >
            Voir tout
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {assignments.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 mx-auto text-gray-300 mb-2" />
            <p className="text-gray-500 text-sm">Aucun devoir disponible</p>
          </div>
        ) : (
          <div className="space-y-3">
            {assignments.map((assignment) => {
              const submission = role === 'etudiant' ? getSubmission(assignment.id) : null;
              const late = role === 'etudiant' && !submission && isLate(assignment.due_date);

              return (
                <div
                  key={assignment.id}
                  className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={handleViewAll}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-800 text-sm mb-1">
                        {assignment.title}
                      </h4>
                      <p className="text-xs text-gray-600">
                        {assignment.course?.name || assignment.course?.nom}
                      </p>
                    </div>
                    <div className="ml-2">
                      {role === 'etudiant' ? (
                        submission?.status === 'graded' ? (
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                            {submission.score}/{assignment.max_points}
                          </span>
                        ) : submission ? (
                          <CheckCircle className="w-5 h-5 text-blue-600" />
                        ) : late ? (
                          <AlertCircle className="w-5 h-5 text-red-600" />
                        ) : (
                          <Clock className="w-5 h-5 text-yellow-600" />
                        )
                      ) : (
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">
                          {assignment.submissions_count || 0} soumissions
                        </span>
                      )}
                    </div>
                  </div>

                  {assignment.due_date && (
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      {new Date(assignment.due_date).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {role === 'etudiant' && assignments.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <div className="font-semibold text-gray-800">
                  {assignments.filter(a => !getSubmission(a.id)).length}
                </div>
                <div className="text-gray-600">À faire</div>
              </div>
              <div>
                <div className="font-semibold text-gray-800">
                  {submissions.filter(s => s.status === 'submitted').length}
                </div>
                <div className="text-gray-600">Soumis</div>
              </div>
              <div>
                <div className="font-semibold text-gray-800">
                  {submissions.filter(s => s.status === 'graded').length}
                </div>
                <div className="text-gray-600">Notés</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssignmentsWidget;
