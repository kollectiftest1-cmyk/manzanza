"use client"

import { useState, useEffect } from "react"
import { Container, Row, Col, Card, Button, Form, Alert, ProgressBar, Badge } from "react-bootstrap"
import { useParams, useNavigate } from "react-router-dom"
import { useSelector, useDispatch } from "react-redux"
import { fetchQuizById, setAnswer, submitQuizAttempt, resetQuiz } from "../store/slices/quizSlice"
import { motion } from "framer-motion"
import { FiClock, FiCheckCircle, FiXCircle, FiChevronLeft, FiChevronRight, FiGrid, FiInfo, FiAward, FiAlertCircle, FiRefreshCw, FiArrowLeft } from "react-icons/fi"

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

const Quiz = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { user } = useSelector((state) => state.auth)
  const { currentQuiz, currentAttempt, userAnswers, score, loading, error } = useSelector((state) => state.quiz)

  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [timeLeft, setTimeLeft] = useState(null)
  const [submitted, setSubmitted] = useState(false)

  // Charger le quiz depuis l'API
  useEffect(() => {
    if (id) {
      dispatch(fetchQuizById(id))
    }

    return () => {
      dispatch(resetQuiz())
    }
  }, [id, dispatch])

  // Initialiser le timer quand le quiz est chargé
  useEffect(() => {
    if (currentQuiz && timeLeft === null) {
      setTimeLeft(currentQuiz.duration * 60) // Convertir minutes en secondes
    }
  }, [currentQuiz, timeLeft])

  // Timer
  useEffect(() => {
    if (timeLeft > 0 && !submitted) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else if (timeLeft === 0) {
      handleSubmit()
    }
  }, [timeLeft, submitted])

  const handleAnswerChange = (questionId, answer) => {
    dispatch(setAnswer({ questionId, answer }))
  }

  const handleSubmit = async () => {
    if (!currentQuiz) return

    try {
      // Préparer les réponses pour l'API avec le bon format
      const answers = Object.entries(userAnswers).map(([questionId, answer]) => {
        const answerData = {
          question_id: parseInt(questionId),
          answer_text: '',
          selected_choices: []
        };

        // Si answer est un tableau (choix multiples), on l'utilise directement
        if (Array.isArray(answer)) {
          answerData.selected_choices = answer.map(id => parseInt(id));
        }
        // Si c'est un nombre (choix unique), on crée un tableau
        else if (typeof answer === 'number' || !isNaN(answer)) {
          answerData.selected_choices = [parseInt(answer)];
        }
        // Sinon c'est du texte
        else if (typeof answer === 'string') {
          answerData.answer_text = answer;
        }

        return answerData;
      });

      console.log('Submitting answers:', answers);

      await dispatch(submitQuizAttempt({ quizId: currentQuiz.id, answers })).unwrap()
      setSubmitted(true)
    } catch (error) {
      console.error("Erreur lors de la soumission:", error)
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  if (loading || !currentQuiz) {
    return (
      <Container fluid style={{ padding: '24px', background: 'var(--color-bodyBg)', minHeight: '100vh' }}>
        <div className="text-center" style={{ paddingTop: '100px' }}>
          <div className="spinner-border" style={{ color: 'var(--color-primary)' }} role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
        </div>
      </Container>
    )
  }

  if (error) {
    return (
      <Container fluid style={{ padding: '24px', background: 'var(--color-bodyBg)', minHeight: '100vh' }}>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants}>
            <Alert variant="danger" style={{
              background: 'var(--color-cardBg)',
              border: '1px solid #dc3545',
              borderRadius: '12px',
              padding: '24px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <FiAlertCircle size={24} />
                <h4 style={{ margin: 0 }}>Erreur</h4>
              </div>
              <p style={{ color: 'var(--color-text)' }}>{error}</p>
              <Button
                variant="outline-danger"
                onClick={() => navigate("/courses")}
                style={{
                  borderRadius: '8px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <FiArrowLeft />
                Retour aux cours
              </Button>
            </Alert>
          </motion.div>
        </motion.div>
      </Container>
    )
  }

  if (submitted) {
    const isPassed = (score || 0) >= 60
    return (
      <Container fluid style={{ padding: '24px', background: 'var(--color-bodyBg)', minHeight: '100vh' }}>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <Row className="justify-content-center">
            <Col lg={8}>
              <motion.div variants={itemVariants}>
                <div style={{
                  background: 'var(--color-cardBg)',
                  borderRadius: '16px',
                  boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
                  border: '1px solid var(--color-border)',
                  overflow: 'hidden'
                }}>
                  {/* Header with gradient */}
                  <div style={{
                    background: isPassed
                      ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                      : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    padding: '32px',
                    textAlign: 'center'
                  }}>
                    <div style={{
                      fontSize: '64px',
                      marginBottom: '16px'
                    }}>
                      {isPassed ? <FiCheckCircle color="white" /> : <FiXCircle color="white" />}
                    </div>
                    <h2 style={{ color: 'white', fontWeight: '700', margin: 0 }}>
                      Quiz Terminé !
                    </h2>
                  </div>

                  <div style={{ padding: '48px 32px', textAlign: 'center' }}>
                    <h3 style={{ color: 'var(--color-textSecondary)', marginBottom: '24px' }}>Votre Score</h3>

                    <div style={{
                      fontSize: '5rem',
                      fontWeight: '800',
                      background: 'linear-gradient(135deg, var(--color-primary) 0%, #667eea 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      marginBottom: '32px',
                      lineHeight: '1'
                    }}>
                      {score?.toFixed(1) || 0}%
                    </div>

                    <div style={{
                      background: isPassed ? '#d1fae5' : '#fee2e2',
                      border: `2px solid ${isPassed ? '#10b981' : '#ef4444'}`,
                      borderRadius: '12px',
                      padding: '20px',
                      marginBottom: '32px'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '12px',
                        color: isPassed ? '#065f46' : '#991b1b',
                        fontWeight: '600',
                        fontSize: '1.1rem'
                      }}>
                        {isPassed ? <FiCheckCircle size={24} /> : <FiXCircle size={24} />}
                        {isPassed
                          ? "Félicitations ! Vous avez réussi le quiz."
                          : "Vous devez obtenir au moins 60% pour réussir."}
                      </div>
                    </div>

                    {currentAttempt && (
                      <div style={{
                        padding: '16px',
                        background: 'var(--color-bodyBg)',
                        borderRadius: '8px',
                        marginBottom: '32px'
                      }}>
                        <p style={{
                          color: 'var(--color-textSecondary)',
                          margin: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px'
                        }}>
                          <FiInfo />
                          Tentative {currentAttempt.attempt_number} / {currentQuiz.max_attempts || "∞"}
                        </p>
                      </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <Button
                        onClick={() => navigate("/courses")}
                        style={{
                          background: 'linear-gradient(135deg, var(--color-primary) 0%, #667eea 100%)',
                          border: 'none',
                          padding: '14px',
                          borderRadius: '10px',
                          fontWeight: '600',
                          fontSize: '1rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px'
                        }}
                      >
                        <FiArrowLeft size={20} />
                        Retour aux Cours
                      </Button>
                      {score < 60 && (
                        <Button
                          variant="outline-primary"
                          onClick={() => window.location.reload()}
                          style={{
                            padding: '14px',
                            borderRadius: '10px',
                            fontWeight: '600',
                            fontSize: '1rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            borderColor: 'var(--color-primary)',
                            color: 'var(--color-primary)'
                          }}
                        >
                          <FiRefreshCw size={20} />
                          Reprendre le Quiz
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            </Col>
          </Row>
        </motion.div>
      </Container>
    )
  }

  const currentQ = currentQuiz.questions[currentQuestion]
  const progress = ((currentQuestion + 1) / currentQuiz.questions.length) * 100

  return (
    <Container fluid style={{ padding: '24px', background: 'var(--color-bodyBg)', minHeight: '100vh' }}>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <Row>
          {/* Main Quiz Section */}
          <Col lg={8}>
            <motion.div variants={itemVariants}>
              <div style={{
                background: 'var(--color-cardBg)',
                borderRadius: '16px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                border: '1px solid var(--color-border)',
                overflow: 'hidden',
                marginBottom: '24px'
              }}>
                {/* Header with gradient */}
                <div style={{
                  background: 'linear-gradient(135deg, var(--color-primary) 0%, #667eea 100%)',
                  padding: '24px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '16px'
                }}>
                  <div>
                    <h3 style={{ color: 'white', fontWeight: '700', margin: '0 0 8px 0' }}>
                      {currentQuiz.title}
                    </h3>
                    <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.95rem' }}>
                      {currentQuiz.course?.name || "Quiz"}
                    </div>
                  </div>
                  {timeLeft !== null && (
                    <div style={{
                      background: timeLeft < 60 ? '#ef4444' : 'rgba(255,255,255,0.2)',
                      padding: '12px 20px',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontWeight: '700',
                      fontSize: '1.2rem',
                      color: 'white'
                    }}>
                      <FiClock size={24} />
                      {formatTime(timeLeft)}
                    </div>
                  )}
                </div>

                {/* Progress Bar */}
                <div style={{ padding: '20px 24px', background: 'var(--color-bodyBg)' }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '12px',
                    color: 'var(--color-text)',
                    fontWeight: '600'
                  }}>
                    <span>Question {currentQuestion + 1} sur {currentQuiz.questions.length}</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <ProgressBar
                    now={progress}
                    style={{
                      height: '12px',
                      borderRadius: '6px',
                      background: 'var(--color-border)'
                    }}
                  />
                </div>

                {/* Question */}
                <div style={{ padding: '32px 24px' }}>
                  <h4 style={{
                    color: 'var(--color-text)',
                    fontWeight: '600',
                    marginBottom: '32px',
                    fontSize: '1.3rem',
                    lineHeight: '1.6'
                  }}>
                    {currentQ.question}
                  </h4>

                  {/* Options */}
                  <Form>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {currentQ.options.map((option, index) => {
                        const isSelected = userAnswers[currentQ.id] === index
                        return (
                          <label
                            key={index}
                            htmlFor={`option-${index}`}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              padding: '20px',
                              background: isSelected ? 'var(--color-primary)' : 'var(--color-bodyBg)',
                              border: `2px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-border)'}`,
                              borderRadius: '12px',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              color: isSelected ? 'white' : 'var(--color-text)',
                              fontWeight: isSelected ? '600' : '500'
                            }}
                            onMouseEnter={(e) => {
                              if (!isSelected) {
                                e.currentTarget.style.borderColor = 'var(--color-primary)'
                                e.currentTarget.style.transform = 'translateX(8px)'
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isSelected) {
                                e.currentTarget.style.borderColor = 'var(--color-border)'
                                e.currentTarget.style.transform = 'translateX(0)'
                              }
                            }}
                          >
                            <Form.Check
                              type="radio"
                              name={`question-${currentQ.id}`}
                              id={`option-${index}`}
                              checked={isSelected}
                              onChange={() => handleAnswerChange(currentQ.id, index)}
                              style={{ marginRight: '16px' }}
                            />
                            <span style={{ flex: 1 }}>{option}</span>
                            {isSelected && <FiCheckCircle size={24} />}
                          </label>
                        )
                      })}
                    </div>
                  </Form>

                  {/* Navigation Buttons */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginTop: '40px',
                    gap: '16px',
                    flexWrap: 'wrap'
                  }}>
                    <Button
                      variant="outline-secondary"
                      disabled={currentQuestion === 0}
                      onClick={() => setCurrentQuestion(currentQuestion - 1)}
                      style={{
                        borderRadius: '10px',
                        padding: '12px 24px',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        minWidth: '140px'
                      }}
                    >
                      <FiChevronLeft size={20} />
                      Précédent
                    </Button>

                    {currentQuestion === currentQuiz.questions.length - 1 ? (
                      <Button
                        variant="success"
                        onClick={handleSubmit}
                        disabled={userAnswers[currentQ.id] === undefined}
                        style={{
                          borderRadius: '10px',
                          padding: '12px 24px',
                          fontWeight: '600',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          minWidth: '140px',
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          border: 'none'
                        }}
                      >
                        <FiCheckCircle size={20} />
                        Terminer
                      </Button>
                    ) : (
                      <Button
                        disabled={userAnswers[currentQ.id] === undefined}
                        onClick={() => setCurrentQuestion(currentQuestion + 1)}
                        style={{
                          borderRadius: '10px',
                          padding: '12px 24px',
                          fontWeight: '600',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          minWidth: '140px',
                          background: 'linear-gradient(135deg, var(--color-primary) 0%, #667eea 100%)',
                          border: 'none'
                        }}
                      >
                        Suivant
                        <FiChevronRight size={20} />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </Col>

          {/* Sidebar */}
          <Col lg={4}>
            {/* Question Navigation */}
            <motion.div variants={itemVariants}>
              <div style={{
                background: 'var(--color-cardBg)',
                borderRadius: '16px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                border: '1px solid var(--color-border)',
                marginBottom: '24px',
                overflow: 'hidden'
              }}>
                <div style={{
                  padding: '16px 20px',
                  borderBottom: '1px solid var(--color-border)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontWeight: '600',
                  color: 'var(--color-text)'
                }}>
                  <FiGrid size={20} />
                  Navigation
                </div>
                <div style={{ padding: '20px' }}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))',
                    gap: '10px'
                  }}>
                    {currentQuiz.questions.map((q, index) => {
                      const isAnswered = userAnswers[q.id] !== undefined
                      const isCurrent = index === currentQuestion
                      return (
                        <button
                          key={index}
                          onClick={() => setCurrentQuestion(index)}
                          style={{
                            padding: '12px',
                            borderRadius: '8px',
                            border: 'none',
                            background: isAnswered
                              ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                              : isCurrent
                                ? 'linear-gradient(135deg, var(--color-primary) 0%, #667eea 100%)'
                                : 'var(--color-bodyBg)',
                            color: isAnswered || isCurrent ? 'white' : 'var(--color-text)',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            position: 'relative'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.05)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)'
                          }}
                        >
                          {index + 1}
                          {isAnswered && (
                            <div style={{
                              position: 'absolute',
                              top: '2px',
                              right: '2px',
                              width: '8px',
                              height: '8px',
                              background: 'white',
                              borderRadius: '50%'
                            }} />
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Quiz Information */}
            <motion.div variants={itemVariants}>
              <div style={{
                background: 'var(--color-cardBg)',
                borderRadius: '16px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                border: '1px solid var(--color-border)',
                overflow: 'hidden'
              }}>
                <div style={{
                  padding: '16px 20px',
                  borderBottom: '1px solid var(--color-border)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontWeight: '600',
                  color: 'var(--color-text)'
                }}>
                  <FiInfo size={20} />
                  Informations
                </div>
                <div style={{ padding: '20px' }}>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                    color: 'var(--color-text)'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px',
                      background: 'var(--color-bodyBg)',
                      borderRadius: '8px'
                    }}>
                      <FiClock style={{ color: 'var(--color-primary)' }} size={20} />
                      <div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--color-textSecondary)' }}>Durée</div>
                        <div style={{ fontWeight: '600' }}>{currentQuiz.duration} minutes</div>
                      </div>
                    </div>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px',
                      background: 'var(--color-bodyBg)',
                      borderRadius: '8px'
                    }}>
                      <FiGrid style={{ color: 'var(--color-primary)' }} size={20} />
                      <div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--color-textSecondary)' }}>Questions</div>
                        <div style={{ fontWeight: '600' }}>{currentQuiz.questions.length}</div>
                      </div>
                    </div>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px',
                      background: 'var(--color-bodyBg)',
                      borderRadius: '8px'
                    }}>
                      <FiAward style={{ color: 'var(--color-primary)' }} size={20} />
                      <div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--color-textSecondary)' }}>Note de passage</div>
                        <div style={{ fontWeight: '600' }}>{currentQuiz.passing_score || 60}%</div>
                      </div>
                    </div>

                    {currentQuiz.max_attempts && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px',
                        background: 'var(--color-bodyBg)',
                        borderRadius: '8px'
                      }}>
                        <FiRefreshCw style={{ color: 'var(--color-primary)' }} size={20} />
                        <div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--color-textSecondary)' }}>Tentatives max</div>
                          <div style={{ fontWeight: '600' }}>{currentQuiz.max_attempts}</div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div style={{
                    marginTop: '20px',
                    padding: '16px',
                    background: '#dbeafe',
                    border: '1px solid #3b82f6',
                    borderRadius: '8px',
                    color: '#1e40af',
                    fontSize: '0.9rem',
                    display: 'flex',
                    gap: '12px'
                  }}>
                    <FiInfo size={20} style={{ flexShrink: 0 }} />
                    <div>
                      Vous pouvez naviguer entre les questions et modifier vos réponses avant de soumettre.
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </Col>
        </Row>
      </motion.div>
    </Container>
  )
}

export default Quiz
