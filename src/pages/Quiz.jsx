"use client"

import { useState, useEffect } from "react"
import { Container, Row, Col, Card, Button, Form, Alert, ProgressBar, Badge } from "react-bootstrap"
import { useParams, useNavigate } from "react-router-dom"
import { useSelector, useDispatch } from "react-redux"
import { fetchQuizById, setAnswer, submitQuizAttempt, resetQuiz } from "../store/slices/quizSlice"

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
      // Préparer les réponses pour l'API
      const answers = Object.entries(userAnswers).map(([questionId, selectedOption]) => ({
        question: parseInt(questionId),
        selected_option: selectedOption,
      }))

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
      <Container className="mt-4">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
        </div>
      </Container>
    )
  }

  if (error) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">
          <Alert.Heading>Erreur</Alert.Heading>
          <p>{error}</p>
          <Button variant="outline-danger" onClick={() => navigate("/courses")}>
            Retour aux cours
          </Button>
        </Alert>
      </Container>
    )
  }

  if (submitted) {
    return (
      <Container className="mt-4">
        <Row className="justify-content-center">
          <Col md={8}>
            <Card className="shadow">
              <Card.Header className="bg-success text-white text-center">
                <h4>Quiz Terminé !</h4>
              </Card.Header>
              <Card.Body className="text-center">
                <h2 className="mb-4">Votre Score</h2>
                <div className="display-1 text-primary mb-4">{score?.toFixed(1) || 0}%</div>
                <Alert variant={(score || 0) >= 60 ? "success" : "danger"}>
                  {(score || 0) >= 60
                    ? "Félicitations ! Vous avez réussi le quiz."
                    : "Vous devez obtenir au moins 60% pour réussir."}
                </Alert>
                {currentAttempt && (
                  <div className="mb-3">
                    <p className="text-muted">
                      Tentative {currentAttempt.attempt_number} / {currentQuiz.max_attempts || "∞"}
                    </p>
                  </div>
                )}
                <div className="d-grid gap-2">
                  <Button variant="primary" onClick={() => navigate("/courses")}>
                    Retour aux Cours
                  </Button>
                  {score < 60 && (
                    <Button variant="outline-primary" onClick={() => window.location.reload()}>
                      Reprendre le Quiz
                    </Button>
                  )}
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    )
  }

  const currentQ = currentQuiz.questions[currentQuestion]

  return (
    <Container className="mt-4">
      <Row>
        <Col md={8}>
          <Card className="shadow">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <div>
                <h5 className="mb-0">{currentQuiz.title}</h5>
                <small className="text-muted">{currentQuiz.course?.name || "Quiz"}</small>
              </div>
              {timeLeft !== null && (
                <Badge bg="warning" className="fs-6">
                  ⏰ {formatTime(timeLeft)}
                </Badge>
              )}
            </Card.Header>
            <Card.Body>
              <div className="mb-3">
                <div className="d-flex justify-content-between mb-2">
                  <span>
                    Question {currentQuestion + 1} sur {quiz.questions.length}
                  </span>
                  <span>{Math.round(((currentQuestion + 1) / quiz.questions.length) * 100)}%</span>
                </div>
                <ProgressBar now={((currentQuestion + 1) / quiz.questions.length) * 100} variant="info" />
              </div>

              <h5 className="mb-4">{currentQ.question}</h5>

              <Form>
                {currentQ.options.map((option, index) => (
                  <Form.Check
                    key={index}
                    type="radio"
                    name={`question-${currentQ.id}`}
                    id={`option-${index}`}
                    label={option}
                    checked={answers[currentQ.id] === index}
                    onChange={() => handleAnswerChange(currentQ.id, index)}
                    className="mb-3 p-3 border rounded"
                  />
                ))}
              </Form>

              <div className="d-flex justify-content-between mt-4">
                <Button
                  variant="outline-secondary"
                  disabled={currentQuestion === 0}
                  onClick={() => setCurrentQuestion(currentQuestion - 1)}
                >
                  ← Précédent
                </Button>

                {currentQuestion === currentQuiz.questions.length - 1 ? (
                  <Button
                    variant="success"
                    onClick={handleSubmit}
                    disabled={userAnswers[currentQ.id] === undefined}
                  >
                    Terminer le Quiz
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    disabled={userAnswers[currentQ.id] === undefined}
                    onClick={() => setCurrentQuestion(currentQuestion + 1)}
                  >
                    Suivant →
                  </Button>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="shadow">
            <Card.Header>
              <h6 className="mb-0">Navigation</h6>
            </Card.Header>
            <Card.Body>
              <div className="d-grid gap-2">
                {quiz.questions.map((_, index) => (
                  <Button
                    key={index}
                    variant={
                      answers[quiz.questions[index].id] !== undefined
                        ? "success"
                        : index === currentQuestion
                          ? "primary"
                          : "outline-secondary"
                    }
                    size="sm"
                    onClick={() => setCurrentQuestion(index)}
                  >
                    Question {index + 1}
                  </Button>
                ))}
              </div>
            </Card.Body>
          </Card>

          <Card className="shadow mt-3">
            <Card.Header>
              <h6 className="mb-0">Informations</h6>
            </Card.Header>
            <Card.Body>
              <p>
                <strong>Durée :</strong> {currentQuiz.duration} minutes
              </p>
              <p>
                <strong>Questions :</strong> {currentQuiz.questions.length}
              </p>
              <p>
                <strong>Note de passage :</strong> {currentQuiz.passing_score || 60}%
              </p>
              {currentQuiz.max_attempts && (
                <p>
                  <strong>Tentatives max :</strong> {currentQuiz.max_attempts}
                </p>
              )}
              <Alert variant="info" className="small">
                💡 Vous pouvez naviguer entre les questions et modifier vos réponses avant de soumettre.
              </Alert>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}

export default Quiz
