"use client"

import { useState, useEffect } from "react"
import { Container, Row, Col, Card, Button, Form, Alert, ProgressBar, Badge } from "react-bootstrap"
import { useParams, useNavigate } from "react-router-dom"
import { useSelector, useDispatch } from "react-redux"

const Quiz = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { user } = useSelector((state) => state.auth)

  const [quiz, setQuiz] = useState(null)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState({})
  const [timeLeft, setTimeLeft] = useState(1800) // 30 minutes
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(null)

  // Mock quiz data
  useEffect(() => {
    const mockQuiz = {
      id: id,
      title: "Quiz Comptabilité Générale - Chapitre 1",
      course: "Comptabilité Générale",
      duration: 30,
      totalQuestions: 10,
      questions: [
        {
          id: 1,
          question: "Qu'est-ce que le bilan comptable ?",
          type: "multiple",
          options: [
            "Un document qui présente la situation financière à un moment donné",
            "Un document qui présente les résultats sur une période",
            "Un document fiscal obligatoire",
            "Un document de gestion interne",
          ],
          correct: 0,
        },
        {
          id: 2,
          question: "Quels sont les deux côtés du bilan ?",
          type: "multiple",
          options: ["Recettes et Dépenses", "Actif et Passif", "Charges et Produits", "Débit et Crédit"],
          correct: 1,
        },
      ],
    }
    setQuiz(mockQuiz)
  }, [id])

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
    setAnswers({
      ...answers,
      [questionId]: answer,
    })
  }

  const handleSubmit = () => {
    // Calculate score
    let correctAnswers = 0
    quiz.questions.forEach((q) => {
      if (answers[q.id] === q.correct) {
        correctAnswers++
      }
    })

    const finalScore = (correctAnswers / quiz.questions.length) * 100
    setScore(finalScore)
    setSubmitted(true)
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  if (!quiz) {
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
                <div className="display-1 text-primary mb-4">{score.toFixed(1)}%</div>
                <Alert variant={score >= 60 ? "success" : "danger"}>
                  {score >= 60
                    ? "Félicitations ! Vous avez réussi le quiz."
                    : "Vous devez obtenir au moins 60% pour réussir."}
                </Alert>
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

  const currentQ = quiz.questions[currentQuestion]

  return (
    <Container className="mt-4">
      <Row>
        <Col md={8}>
          <Card className="shadow">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <div>
                <h5 className="mb-0">{quiz.title}</h5>
                <small className="text-muted">{quiz.course}</small>
              </div>
              <Badge bg="warning" className="fs-6">
                ⏰ {formatTime(timeLeft)}
              </Badge>
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

                {currentQuestion === quiz.questions.length - 1 ? (
                  <Button
                    variant="success"
                    onClick={handleSubmit}
                    disabled={!answers[currentQ.id] && answers[currentQ.id] !== 0}
                  >
                    Terminer le Quiz
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    disabled={!answers[currentQ.id] && answers[currentQ.id] !== 0}
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
                <strong>Durée :</strong> {quiz.duration} minutes
              </p>
              <p>
                <strong>Questions :</strong> {quiz.totalQuestions}
              </p>
              <p>
                <strong>Note de passage :</strong> 60%
              </p>
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
