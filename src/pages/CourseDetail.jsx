"use client"
import { useState, useEffect } from "react"
import { Container, Row, Col, Button, Badge, Spinner, Alert, ListGroup } from "react-bootstrap"
import { useParams, Link } from "react-router-dom"
import { motion } from "framer-motion"
import {
  FiBook,
  FiUser,
  FiMapPin,
  FiAward,
  FiUsers,
  FiFileText,
  FiDownload,
  FiMessageCircle,
  FiBarChart2,
  FiClock,
  FiCheckCircle
} from "react-icons/fi"
import { getCourseDetail } from "../services/courseService"
import quizService from "../services/quizService"
import assignmentService from "../services/assignmentService"

const CourseDetail = () => {
  const { id } = useParams()
  const [course, setCourse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState("overview")
  const [quizzes, setQuizzes] = useState([])
  const [assignments, setAssignments] = useState([])
  const [loadingQuizzes, setLoadingQuizzes] = useState(false)
  const [loadingAssignments, setLoadingAssignments] = useState(false)

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        setLoading(true)
        const res = await getCourseDetail(id)
        console.log("jbnbjnkdgb",res.data);
        
        setCourse(res.data)
      } catch (err) {
        setError("Impossible de charger les détails du cours.")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchCourse()
  }, [id])

  // Charger les quiz quand l'onglet quiz est activé
  useEffect(() => {
    const fetchQuizzes = async () => {
      if (activeTab === 'quiz' && course) {
        try {
          setLoadingQuizzes(true)
          const res = await quizService.getQuizzes({ course: id })
          setQuizzes(res.data.results || res.data || [])
        } catch (err) {
          console.error("Erreur chargement quiz:", err)
        } finally {
          setLoadingQuizzes(false)
        }
      }
    }
    fetchQuizzes()
  }, [activeTab, course, id])

  // Charger les assignments quand l'onglet assignments est activé
  useEffect(() => {
    const fetchAssignments = async () => {
      if (activeTab === 'assignments' && course) {
        try {
          setLoadingAssignments(true)
          const res = await assignmentService.getAssignments({ course: id })
          setAssignments(res.data.results || res.data || [])
        } catch (err) {
          console.error("Erreur chargement assignments:", err)
        } finally {
          setLoadingAssignments(false)
        }
      }
    }
    fetchAssignments()
  }, [activeTab, course, id])

  if (loading) {
    return (
      <Container style={{ padding: '100px 24px', textAlign: 'center' }}>
        <Spinner animation="border" style={{ color: 'var(--color-primary)', width: '3rem', height: '3rem' }} />
        <p style={{ color: 'var(--color-textSecondary)', marginTop: '16px' }}>Chargement du cours...</p>
      </Container>
    )
  }

  if (error) {
    return (
      <Container style={{ padding: '100px 24px' }}>
        <Alert variant="danger" style={{ borderRadius: '12px' }}>{error}</Alert>
      </Container>
    )
  }

  if (!course) {
    return (
      <Container style={{ padding: '100px 24px' }}>
        <Alert variant="warning" style={{ borderRadius: '12px' }}>Cours non trouvé.</Alert>
      </Container>
    )
  }

  const tabs = [
    { id: 'overview', label: 'Aperçu', icon: FiBook },
    { id: 'materials', label: 'Matériel', icon: FiFileText },
    { id: 'assignments', label: 'Devoirs', icon: FiCheckCircle },
    { id: 'quiz', label: 'Quizs', icon: FiCheckCircle },
    { id: 'grades', label: 'Notes', icon: FiBarChart2 }
  ]

  return (
    <div style={{ background: 'var(--color-bodyBg)', minHeight: '100vh', padding: '24px' }}>
      <Container fluid>
        {/* Course Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{
            padding: '32px',
            background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
            borderRadius: '20px',
            marginBottom: '32px',
            color: 'white',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div style={{
            position: 'absolute',
            top: '-50px',
            right: '-50px',
            width: '200px',
            height: '200px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.1)',
            filter: 'blur(40px)'
          }} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <FiBook size={32} />
              <h1 style={{ fontSize: '2rem', fontWeight: '700', margin: 0 }}>
                {course.name}
              </h1>
              <Badge bg="light" text="dark" style={{ fontSize: '0.9rem', padding: '6px 14px', borderRadius: '8px' }}>
                {course.code}
              </Badge>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', fontSize: '0.95rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FiUser size={18} />
                {course.titulaire_name}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FiMapPin size={18} />
                {course.auditoire_detail?.nom || 'N/A'}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FiAward size={18} />
                {course.credits} crédits
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FiUsers size={18} />
                {course.students_count || 0} étudiants
              </span>
            </div>
          </div>
        </motion.div>

        <Row>
          <Col lg={8}>
            {/* Tabs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              style={{
                display: 'flex',
                gap: '8px',
                marginBottom: '24px',
                background: 'var(--color-cardBg)',
                padding: '8px',
                borderRadius: '12px',
                border: '1px solid var(--color-border)'
              }}
            >
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    border: 'none',
                    borderRadius: '8px',
                    background: activeTab === tab.id ? 'var(--color-primary)' : 'transparent',
                    color: activeTab === tab.id ? 'white' : 'var(--color-textPrimary)',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    fontSize: '0.95rem'
                  }}
                >
                  <tab.icon size={18} />
                  {tab.label}
                </button>
              ))}
            </motion.div>

            {/* Tab Content */}
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              style={{
                padding: '32px',
                background: 'var(--color-cardBg)',
                borderRadius: '16px',
                border: '1px solid var(--color-border)',
                minHeight: '400px'
              }}
            >
              {activeTab === 'overview' && (
                <>
                  <h5 style={{ fontWeight: '700', color: 'var(--color-textPrimary)', marginBottom: '16px' }}>
                    Description du cours
                  </h5>
                  <p style={{ color: 'var(--color-textSecondary)', lineHeight: '1.8', fontSize: '1rem' }}>
                    {course.description || "Aucune description disponible."}
                  </p>
                </>
              )}

              {activeTab === 'materials' && (
                <>
                  <h5 style={{ fontWeight: '700', color: 'var(--color-textPrimary)', marginBottom: '24px' }}>
                    Documents et Ressources
                  </h5>
                  <ListGroup variant="flush">
                    {(course.materials || []).map((material, index) => (
                      <motion.div
                        key={material.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <ListGroup.Item
                          style={{
                            background: 'var(--color-bodyBg)',
                            border: '1px solid var(--color-border)',
                            borderRadius: '12px',
                            padding: '20px',
                            marginBottom: '12px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: '600', color: 'var(--color-textPrimary)', marginBottom: '6px' }}>
                              {material.title}
                            </div>
                            <small style={{
                              color: 'var(--color-textSecondary)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              textTransform: 'capitalize'
                            }}>
                              <FiFileText size={14} />
                              {material.material_type}
                            </small>
                          </div>
                          <Button
                            size="sm"
                            variant="outline-primary"
                            href={material.file || material.link}
                            target="_blank"
                            style={{
                              borderRadius: '8px',
                              padding: '8px 16px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              fontWeight: '600'
                            }}
                          >
                            <FiDownload size={16} /> Ouvrir
                          </Button>
                        </ListGroup.Item>
                      </motion.div>
                    ))}
                    {(course.materials?.length === 0 || !course.materials) && (
                      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                        <FiFileText style={{ fontSize: '3rem', color: 'var(--color-textSecondary)', marginBottom: '16px' }} />
                        <p style={{ color: 'var(--color-textSecondary)' }}>Aucun matériel disponible.</p>
                      </div>
                    )}
                  </ListGroup>
                </>
              )}

              {activeTab === 'assignments' && (
                <>
                  <h5 style={{ fontWeight: '700', color: 'var(--color-textPrimary)', marginBottom: '16px' }}>
                    Travaux Pratiques et Dirigés
                  </h5>
                  {loadingAssignments ? (
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                      <Spinner animation="border" style={{ color: 'var(--color-primary)' }} />
                    </div>
                  ) : assignments.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                      <FiCheckCircle style={{ fontSize: '3rem', color: 'var(--color-textSecondary)', marginBottom: '16px' }} />
                      <p style={{ color: 'var(--color-textSecondary)' }}>
                        Aucun TP/TD disponible pour le moment
                      </p>
                    </div>
                  ) : (
                    <ListGroup>
                      {assignments.map((assignment, idx) => (
                        <ListGroup.Item
                          key={assignment.id}
                          as={motion.div}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          style={{
                            background: 'var(--color-bodyBg)',
                            border: '1px solid var(--color-border)',
                            borderRadius: '8px',
                            marginBottom: '12px',
                            padding: '16px',
                            cursor: 'pointer'
                          }}
                          onClick={() => window.location.href = `/student/assignments/${assignment.id}`}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '12px' }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: '600', color: 'var(--color-textPrimary)', marginBottom: '6px' }}>
                                {assignment.title}
                              </div>
                              <div style={{ fontSize: '0.85rem', color: 'var(--color-textSecondary)', marginBottom: '8px' }}>
                                {assignment.description?.substring(0, 100)}{assignment.description?.length > 100 ? '...' : ''}
                              </div>
                              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', fontSize: '0.85rem' }}>
                                <Badge bg={assignment.assignment_type === 'TP' ? 'success' : 'info'}>
                                  {assignment.assignment_type}
                                </Badge>
                                <span style={{ color: 'var(--color-textSecondary)' }}>
                                  <FiClock size={14} style={{ marginRight: '4px' }} />
                                  Échéance: {new Date(assignment.due_date).toLocaleDateString('fr-FR')}
                                </span>
                                <span style={{ color: 'var(--color-textSecondary)' }}>
                                  Points: {assignment.max_points}
                                </span>
                              </div>
                            </div>
                          </div>
                        </ListGroup.Item>
                      ))}
                    </ListGroup>
                  )}
                </>
              )}

              {activeTab === 'quiz' && (
                <>
                  <h5 style={{ fontWeight: '700', color: 'var(--color-textPrimary)', marginBottom: '16px' }}>
                    Quiz et Évaluations
                  </h5>
                  {loadingQuizzes ? (
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                      <Spinner animation="border" style={{ color: 'var(--color-primary)' }} />
                    </div>
                  ) : quizzes.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                      <FiAward style={{ fontSize: '3rem', color: 'var(--color-textSecondary)', marginBottom: '16px' }} />
                      <p style={{ color: 'var(--color-textSecondary)' }}>
                        Aucun quiz disponible pour le moment
                      </p>
                    </div>
                  ) : (
                    <ListGroup>
                      {quizzes.filter(q => {
                        const now = new Date();
                        const startDate = new Date(q.start_date);
                        const endDate = new Date(q.end_date);
                        return startDate <= now && endDate >= now;
                      }).map((quiz, idx) => (
                        <ListGroup.Item
                          key={quiz.id}
                          as={motion.div}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          style={{
                            background: 'var(--color-bodyBg)',
                            border: '1px solid var(--color-border)',
                            borderRadius: '8px',
                            marginBottom: '12px',
                            padding: '16px',
                            cursor: 'pointer'
                          }}
                          onClick={() => window.location.href = `/student/quizzes/${quiz.id}`}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '12px' }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: '600', color: 'var(--color-textPrimary)', marginBottom: '6px' }}>
                                {quiz.title}
                              </div>
                              <div style={{ fontSize: '0.85rem', color: 'var(--color-textSecondary)', marginBottom: '8px' }}>
                                {quiz.description?.substring(0, 100)}{quiz.description?.length > 100 ? '...' : ''}
                              </div>
                              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', fontSize: '0.85rem' }}>
                                <Badge bg="warning">
                                  Quiz
                                </Badge>
                                <span style={{ color: 'var(--color-textSecondary)' }}>
                                  <FiClock size={14} style={{ marginRight: '4px' }} />
                                  Début: {new Date(quiz.start_date).toLocaleDateString('fr-FR')}
                                </span>
                                <span style={{ color: 'var(--color-textSecondary)' }}>
                                  Durée: {quiz.duration_minutes} min
                                </span>
                                <span style={{ color: 'var(--color-textSecondary)' }}>
                                  Points: {quiz.max_points}
                                </span>
                              </div>
                            </div>
                          </div>
                        </ListGroup.Item>
                      ))}

                      {/* Quiz en attente */}
                      {quizzes.filter(q => new Date(q.start_date) > new Date()).length > 0 && (
                        <>
                          <h6 style={{ fontWeight: '600', color: 'var(--color-textSecondary)', marginTop: '24px', marginBottom: '12px' }}>
                            Quiz à venir
                          </h6>
                          {quizzes.filter(q => new Date(q.start_date) > new Date()).map((quiz, idx) => (
                            <ListGroup.Item
                              key={quiz.id}
                              as={motion.div}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: idx * 0.05 }}
                              style={{
                                background: 'var(--color-bodyBg)',
                                border: '1px solid var(--color-border)',
                                borderRadius: '8px',
                                marginBottom: '12px',
                                padding: '16px',
                                opacity: 0.7
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '12px' }}>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontWeight: '600', color: 'var(--color-textPrimary)', marginBottom: '6px' }}>
                                    {quiz.title}
                                  </div>
                                  <div style={{ fontSize: '0.85rem', color: 'var(--color-textSecondary)', marginBottom: '8px' }}>
                                    {quiz.description?.substring(0, 100)}{quiz.description?.length > 100 ? '...' : ''}
                                  </div>
                                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', fontSize: '0.85rem' }}>
                                    <Badge bg="secondary">
                                      En attente
                                    </Badge>
                                    <span style={{ color: 'var(--color-textSecondary)' }}>
                                      <FiClock size={14} style={{ marginRight: '4px' }} />
                                      Début: {new Date(quiz.start_date).toLocaleDateString('fr-FR')}
                                    </span>
                                    <span style={{ color: 'var(--color-textSecondary)' }}>
                                      Durée: {quiz.duration_minutes} min
                                    </span>
                                    <span style={{ color: 'var(--color-textSecondary)' }}>
                                      Points: {quiz.max_points}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </ListGroup.Item>
                          ))}
                        </>
                      )}
                    </ListGroup>
                  )}
                </>
              )}

              {activeTab === 'grades' && (
                <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                  <FiBarChart2 style={{ fontSize: '3rem', color: 'var(--color-textSecondary)', marginBottom: '16px' }} />
                  <p style={{ color: 'var(--color-textSecondary)' }}>La section des notes sera bientôt disponible.</p>
                </div>
              )}
            </motion.div>
          </Col>

          <Col lg={4}>
            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              style={{
                padding: '24px',
                background: 'var(--color-cardBg)',
                borderRadius: '16px',
                border: '1px solid var(--color-border)',
                marginBottom: '24px'
              }}
            >
              <h6 style={{ fontWeight: '700', color: 'var(--color-textPrimary)', marginBottom: '20px' }}>
                Actions Rapides
              </h6>
              <div style={{ display: 'grid', gap: '12px' }}>
                <Button
                  as={Link}
                  to={`/chat?course=${course.id}`}
                  style={{
                    background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '12px 16px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    justifyContent: 'center'
                  }}
                >
                  <FiMessageCircle size={18} />
                  Rejoindre la discussion
                </Button>
                <Button
                  variant="outline-primary"
                  disabled
                  style={{
                    borderRadius: '10px',
                    padding: '12px 16px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    justifyContent: 'center',
                    borderWidth: '2px'
                  }}
                >
                  <FiBarChart2 size={18} />
                  Mes notes
                </Button>
              </div>
            </motion.div>

            {/* Course Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              style={{
                padding: '24px',
                background: 'var(--color-cardBg)',
                borderRadius: '16px',
                border: '1px solid var(--color-border)'
              }}
            >
              <h6 style={{ fontWeight: '700', color: 'var(--color-textPrimary)', marginBottom: '20px' }}>
                Informations
              </h6>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <small style={{ color: 'var(--color-textSecondary)', display: 'block', marginBottom: '4px' }}>
                    Enseignant
                  </small>
                  <div style={{ color: 'var(--color-textPrimary)', fontWeight: '600' }}>
                    {course.titulaire_name || 'N/A'}
                  </div>
                </div>
                <div>
                  <small style={{ color: 'var(--color-textSecondary)', display: 'block', marginBottom: '4px' }}>
                    Crédits
                  </small>
                  <div style={{ color: 'var(--color-textPrimary)', fontWeight: '600' }}>
                    {course.credits} ECTS
                  </div>
                </div>
                <div>
                  <small style={{ color: 'var(--color-textSecondary)', display: 'block', marginBottom: '4px' }}>
                    Étudiants inscrits
                  </small>
                  <div style={{ color: 'var(--color-textPrimary)', fontWeight: '600' }}>
                    {course.students_count || 0} étudiants
                  </div>
                </div>
                <div>
                  <small style={{ color: 'var(--color-textSecondary)', display: 'block', marginBottom: '4px' }}>
                    Auditoire
                  </small>
                  <div style={{ color: 'var(--color-textPrimary)', fontWeight: '600' }}>
                    {course.auditoire_detail?.nom || 'Non défini'}
                  </div>
                </div>
              </div>
            </motion.div>
          </Col>
        </Row>
      </Container>
    </div>
  )
}

export default CourseDetail
