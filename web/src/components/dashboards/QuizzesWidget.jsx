import React, { useState, useEffect } from 'react';
import { BarChart, Clock, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import quizService from '../../services/quizService';

const QuizzesWidget = ({ role }) => {
  const [quizzes, setQuizzes] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      if (role === 'etudiant') {
        const [quizzesRes, attemptsRes] = await Promise.all([
          quizService.getAvailableQuizzes(),
          quizService.getMyAttempts()
        ]);
        setQuizzes(quizzesRes.data.slice(0, 5));
        setAttempts(attemptsRes.data);
      } else {
        const response = await quizService.getMyQuizzes();
        setQuizzes(response.data.slice(0, 5));
      }
    } catch (error) {
      console.error('Erreur:', error);
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

    const now = new Date();
    if (quiz.start_date && new Date(quiz.start_date) > now) return false;
    if (quiz.end_date && new Date(quiz.end_date) < now) return false;

    return true;
  };

  const handleViewAll = () => {
    if (role === 'etudiant') {
      navigate('/student/quizzes');
    } else {
      navigate('/teacher/quizzes');
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
            <BarChart className="w-5 h-5 text-purple-600" />
            {role === 'etudiant' ? 'Mes Quiz' : 'Quiz récents'}
          </h3>
          <button
            onClick={handleViewAll}
            className="text-purple-600 hover:text-purple-800 text-sm font-medium flex items-center gap-1"
          >
            Voir tout
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {quizzes.length === 0 ? (
          <div className="text-center py-8">
            <BarChart className="w-12 h-12 mx-auto text-gray-300 mb-2" />
            <p className="text-gray-500 text-sm">Aucun quiz disponible</p>
          </div>
        ) : (
          <div className="space-y-3">
            {quizzes.map((quiz) => {
              const quizAttempts = role === 'etudiant' ? getAttempts(quiz.id) : [];
              const bestScore = role === 'etudiant' ? getBestScore(quiz.id) : null;
              const canTake = role === 'etudiant' ? canTakeQuiz(quiz) : null;

              return (
                <div
                  key={quiz.id}
                  className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={handleViewAll}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-800 text-sm mb-1">
                        {quiz.title}
                      </h4>
                      <p className="text-xs text-gray-600">
                        {quiz.course?.name || quiz.course?.nom}
                      </p>
                    </div>
                    <div className="ml-2">
                      {role === 'etudiant' ? (
                        bestScore !== null ? (
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                            {bestScore.toFixed(0)}/{quiz.max_points}
                          </span>
                        ) : canTake ? (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium">
                            Disponible
                          </span>
                        ) : (
                          <AlertCircle className="w-5 h-5 text-gray-400" />
                        )
                      ) : (
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">
                          {quiz.attempts_count || 0} tentatives
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {quiz.duration_minutes} min
                    </div>
                    {role === 'etudiant' && quizAttempts.length > 0 && (
                      <span className="text-xs text-gray-600">
                        {quizAttempts.length}/{quiz.max_attempts} tentative(s)
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {role === 'etudiant' && quizzes.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <div className="font-semibold text-gray-800">
                  {quizzes.filter(q => canTakeQuiz(q)).length}
                </div>
                <div className="text-gray-600">Disponibles</div>
              </div>
              <div>
                <div className="font-semibold text-gray-800">
                  {quizzes.filter(q => getAttempts(q.id).length > 0).length}
                </div>
                <div className="text-gray-600">Commencés</div>
              </div>
              <div>
                <div className="font-semibold text-gray-800">
                  {quizzes.filter(q => getAttempts(q.id).some(a => a.status === 'graded')).length}
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

export default QuizzesWidget;
