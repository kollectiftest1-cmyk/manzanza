"use client"
import { useState, useEffect } from "react"
import { Container, Row, Col, Button, Badge, Spinner, Alert, ListGroup, Form, Modal, Table } from "react-bootstrap"
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
  FiCheckCircle,
  FiPlus,
  FiEdit,
  FiTrash,
  FiEye,
} from "react-icons/fi"
import { getCourseDetail } from "../services/courseService"
import quizService from "../services/quizService"
import assignmentService from "../services/assignmentService"
import gradeService from "../services/gradeService"
import { getUsers } from "../services/userService"
import { useSelector } from "react-redux"

const CATEGORY_TYPE_COLORS = {
  interro: { bg: '#fff3cd', text: '#856404', label: 'Interrogation' },
  quiz:    { bg: '#d1ecf1', text: '#0c5460', label: 'Quiz' },
  tp_td:   { bg: '#d4edda', text: '#155724', label: 'TP/TD' },
  examen:  { bg: '#f8d7da', text: '#721c24', label: 'Examen' },
  bonus:   { bg: '#e2e3e5', text: '#383d41', label: 'Bonus' },
}

const EMPTY_GRADE_FORM = {
  student: '',
  category: '',
  label: '',
  session_number: 1,
  value: '',
  max_value: 20,
  comment: '',
}

const EMPTY_BULK_FORM = {
  category: '',
  label: '',
  session_number: '',
  max_value: 20,
  entries: [],
}

const unwrapList = (response) => {
  const data = response?.data ?? response
  if (Array.isArray(data)) return data
  return data?.results || []
}

const CourseDetail = () => {
  const { id } = useParams()
  const { user } = useSelector((state) => state.auth)
  const [course, setCourse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState("overview")
  const [quizzes, setQuizzes] = useState([])
  const [assignments, setAssignments] = useState([])
  const [grades, setGrades] = useState([])
  const [categories, setCategories] = useState([])
  const [gradeStudents, setGradeStudents] = useState([])
  const [assessments, setAssessments] = useState([])
  const [selectedAssessment, setSelectedAssessment] = useState(null)
  const [assessmentDetail, setAssessmentDetail] = useState(null)
  const [showAssessmentDetail, setShowAssessmentDetail] = useState(false)
  const [loadingAssessmentDetail, setLoadingAssessmentDetail] = useState(false)
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [bulkForm, setBulkForm] = useState(EMPTY_BULK_FORM)
  const [bulkError, setBulkError] = useState(null)
  const [savingBulk, setSavingBulk] = useState(false)
  const [loadingQuizzes, setLoadingQuizzes] = useState(false)
  const [loadingAssignments, setLoadingAssignments] = useState(false)
  const [loadingGrades, setLoadingGrades] = useState(false)

  // Grade entry modal (teacher only)
  const [showGradeModal, setShowGradeModal] = useState(false)
  const [editingGrade, setEditingGrade] = useState(null)
  const [gradeForm, setGradeForm] = useState(EMPTY_GRADE_FORM)
  const [gradeFormError, setGradeFormError] = useState(null)
  const [savingGrade, setSavingGrade] = useState(false)

  const isTeacherOrAdmin = ['enseignant', 'assistant', 'chef_section', 'chef_departement',
    'sga', 'pdg', 'directeur_general'].includes(user?.role)


  useEffect(() => {
    const fetchCourse = async () => {
      try {
        setLoading(true)
        const res = await getCourseDetail(id)
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

  const loadTeacherGradeWorkflow = async () => {
    const auditoireId = course?.auditoire || course?.auditoire_detail?.id
    const [gradesRes, studentsRes, assessmentsRes] = await Promise.all([
      gradeService.getGrades({ course: id }),
      auditoireId
        ? getUsers({ auditoire: auditoireId, role: 'etudiant', page_size: 500 }).catch(() => ({ data: [] }))
        : Promise.resolve({ data: [] }),
      gradeService.getCourseAssessments(id),
    ])
    setGrades(unwrapList(gradesRes))
    setGradeStudents(unwrapList(studentsRes))
    setAssessments(assessmentsRes.data?.assessments || [])
  }

  // Charger les notes quand l'onglet notes est activé
  useEffect(() => {
    const fetchGrades = async () => {
      if (activeTab === 'grades' && course) {
        try {
          setLoadingGrades(true)
          // Always load categories
          const catRes = await gradeService.getCategories()
          setCategories(catRes.data?.results || catRes.data || [])

          if (user?.role === 'etudiant') {
            const res = await gradeService.getMyGrades()
            const courseGrades = (res.data || []).find(cg => String(cg.course_id) === String(id))
            setGrades(courseGrades ? [courseGrades] : [])
          } else {
            await loadTeacherGradeWorkflow()
          }
        } catch (err) {
          console.error("Erreur chargement notes:", err)
        } finally {
          setLoadingGrades(false)
        }
      }
    }
    fetchGrades()
  }, [activeTab, course, id, user])

  // ── Grade CRUD handlers (teacher / admin) ────────────────────────────────
  const openCreateGrade = () => {
    setEditingGrade(null)
    setGradeForm({ ...EMPTY_GRADE_FORM, course: id })
    setGradeFormError(null)
    setShowGradeModal(true)
  }

  const openEditGrade = (g) => {
    setEditingGrade(g)
    setGradeForm({
      student: g.student,
      category: g.category,
      label: g.label || '',
      session_number: g.session_number || 1,
      value: g.value,
      max_value: g.max_value,
      comment: g.comment || '',
      course: id,
    })
    setGradeFormError(null)
    setShowGradeModal(true)
  }

  const handleSaveGrade = async () => {
    setGradeFormError(null)
    if (!gradeForm.student || !gradeForm.category || gradeForm.value === '') {
      setGradeFormError("Étudiant, catégorie et note sont obligatoires.")
      return
    }
    setSavingGrade(true)
    try {
      const payload = { ...gradeForm, course: id }
      if (editingGrade) {
        await gradeService.updateGrade(editingGrade.id, payload)
      } else {
        await gradeService.createGrade(payload)
      }
      setShowGradeModal(false)
      // Reload grade list
      await loadTeacherGradeWorkflow()
    } catch (e) {
      const msg = e.response?.data
      if (msg && typeof msg === 'object') {
        const first = Object.values(msg)[0]
        setGradeFormError(Array.isArray(first) ? first[0] : JSON.stringify(msg))
      } else {
        setGradeFormError("Erreur lors de la sauvegarde.")
      }
    } finally {
      setSavingGrade(false)
    }
  }

  const handleDeleteGrade = async (gradeId) => {
    if (!window.confirm("Supprimer cette note ?")) return
    await gradeService.deleteGrade(gradeId)
    setGrades(prev => prev.filter(g => g.id !== gradeId))
    if (isTeacherOrAdmin) {
      await loadTeacherGradeWorkflow()
    }
  }

  const assessmentParams = (assessment) => {
    if (!assessment) return { course: id }
    if (assessment.source === 'manual') {
      return {
        course: id,
        source: 'manual',
        category: assessment.category,
        session_number: assessment.session_number,
        label: assessment.label || assessment.title,
      }
    }
    return { course: id, source: assessment.source, id: assessment.id }
  }

  const openAssessmentDetail = async (assessment) => {
    setSelectedAssessment(assessment)
    setAssessmentDetail(null)
    setShowAssessmentDetail(true)
    setLoadingAssessmentDetail(true)
    try {
      const res = await gradeService.getAssessmentDetail(assessmentParams(assessment))
      setAssessmentDetail(res.data)
    } catch (err) {
      setAssessmentDetail({ error: err.response?.data?.error || "Impossible de charger cette épreuve." })
    } finally {
      setLoadingAssessmentDetail(false)
    }
  }

  const openBulkAssessment = () => {
    const firstCategory = categories.find(c => c.category_type !== 'quiz')
    setBulkForm({
      ...EMPTY_BULK_FORM,
      category: firstCategory?.id || '',
      entries: gradeStudents.map(student => ({ student: student.id, value: '', comment: '' })),
    })
    setBulkError(null)
    setShowBulkModal(true)
  }

  const updateBulkEntry = (studentId, field, value) => {
    setBulkForm(prev => ({
      ...prev,
      entries: prev.entries.map(entry =>
        String(entry.student) === String(studentId) ? { ...entry, [field]: value } : entry
      ),
    }))
  }

  const saveBulkAssessment = async (statusValue) => {
    setBulkError(null)
    if (!bulkForm.category) {
      setBulkError("Sélectionnez un type d'évaluation.")
      return
    }
    setSavingBulk(true)
    try {
      await gradeService.saveBulkAssessment({
        course: id,
        category: bulkForm.category,
        label: bulkForm.label,
        session_number: bulkForm.session_number,
        max_value: bulkForm.max_value,
        status: statusValue,
        entries: bulkForm.entries,
      })
      setShowBulkModal(false)
      await loadTeacherGradeWorkflow()
    } catch (err) {
      setBulkError(err.response?.data?.error || "Erreur lors de l'enregistrement.")
    } finally {
      setSavingBulk(false)
    }
  }

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
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h5 style={{ fontWeight: '700', color: 'var(--color-textPrimary)', margin: 0 }}>
                      Notes & Résultats
                    </h5>
                    {isTeacherOrAdmin && (
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <Button size="sm" variant="outline-primary" as={Link} to={`/courses/${id}/assessments`}
                          style={{ display: 'flex', alignItems: 'center', gap: '6px', borderRadius: '8px' }}>
                          <FiEye size={14} /> Voir plus
                        </Button>
                        <Button size="sm" variant="primary" onClick={openBulkAssessment}
                          style={{ display: 'flex', alignItems: 'center', gap: '6px', borderRadius: '8px' }}>
                          <FiPlus size={14} /> Ajouter une épreuve/résultat
                        </Button>
                        <Button size="sm" variant="outline-secondary" onClick={openCreateGrade}
                          style={{ display: 'flex', alignItems: 'center', gap: '6px', borderRadius: '8px' }}>
                          Saisie rapide
                        </Button>
                      </div>
                    )}
                  </div>
                  {loadingGrades ? (
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                      <Spinner animation="border" style={{ color: 'var(--color-primary)' }} />
                    </div>
                  ) : user?.role === 'etudiant' ? (
                    /* ── Student view: personal grades with weighted average ── */
                    <div>
                      {grades.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                          <FiBarChart2 style={{ fontSize: '3rem', color: 'var(--color-textSecondary)', marginBottom: '16px' }} />
                          <p style={{ color: 'var(--color-textSecondary)' }}>Aucune note enregistrée pour ce cours.</p>
                        </div>
                      ) : grades.map((cg) => (
                        <div key={cg.course_id}>
                          {cg.average !== null && (
                            <div style={{
                              padding: '20px',
                              background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
                              borderRadius: '12px', color: 'white', marginBottom: '20px', textAlign: 'center'
                            }}>
                              <div style={{ fontSize: '2.5rem', fontWeight: '700' }}>{cg.average}%</div>
                              <div style={{ opacity: 0.9 }}>Moyenne pondérée</div>
                            </div>
                          )}
                          <ListGroup variant="flush">
                            {cg.grades.map((g, idx) => {
                              const ct = CATEGORY_TYPE_COLORS[g.category_type] || CATEGORY_TYPE_COLORS.examen
                              return (
                                <ListGroup.Item key={idx} style={{
                                  background: 'var(--color-bodyBg)', border: '1px solid var(--color-border)',
                                  borderRadius: '8px', marginBottom: '8px', padding: '16px'
                                }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                      <span style={{
                                        background: ct.bg, color: ct.text, borderRadius: '6px',
                                        padding: '2px 8px', fontSize: '0.75rem', fontWeight: '600', marginRight: '8px'
                                      }}>{ct.label}</span>
                                      <span style={{ fontWeight: '600', color: 'var(--color-textPrimary)' }}>
                                        {g.label || g.category}
                                      </span>
                                      <small style={{ color: 'var(--color-textSecondary)', marginLeft: '8px' }}>
                                        ({g.weight}%)
                                      </small>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                      <span style={{ fontWeight: '700', fontSize: '1.2rem',
                                        color: g.percentage >= 50 ? '#28a745' : '#dc3545' }}>
                                        {g.value}/{g.max_value}
                                      </span>
                                      <small style={{ color: 'var(--color-textSecondary)', marginLeft: '6px' }}>
                                        ({g.percentage}%)
                                      </small>
                                    </div>
                                  </div>
                                </ListGroup.Item>
                              )
                            })}
                          </ListGroup>
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* ── Teacher/admin view: full grade table with entry ── */
                    <>
                      <div style={{ marginBottom: '24px' }}>
                        <h6 style={{ fontWeight: '700', color: 'var(--color-textPrimary)', marginBottom: '12px' }}>
                          Épreuves du cours
                        </h6>
                        {assessments.length === 0 ? (
                          <div style={{
                            background: 'var(--color-bodyBg)',
                            border: '1px dashed var(--color-border)',
                            borderRadius: '10px',
                            padding: '20px',
                            color: 'var(--color-textSecondary)',
                            textAlign: 'center'
                          }}>
                            Aucune épreuve enregistrée pour ce cours.
                          </div>
                        ) : (
                          <div style={{ overflowX: 'auto' }}>
                            <Table hover size="sm" style={{ fontSize: '0.875rem', marginBottom: 0 }}>
                              <thead style={{ background: 'var(--color-bodyBg)' }}>
                                <tr>
                                  <th>Épreuve</th>
                                  <th>Type</th>
                                  <th>Source</th>
                                  <th>Notes</th>
                                  <th>Moyenne</th>
                                  <th>Statut</th>
                                  <th></th>
                                </tr>
                              </thead>
                              <tbody>
                                {assessments.slice(0, 6).map((assessment) => {
                                  const ct = CATEGORY_TYPE_COLORS[assessment.category_type] || CATEGORY_TYPE_COLORS.examen
                                  return (
                                    <tr key={`${assessment.source}-${assessment.id}-${assessment.session_number}`}>
                                      <td style={{ fontWeight: '600' }}>{assessment.title}</td>
                                      <td>
                                        <span style={{
                                          background: ct.bg, color: ct.text,
                                          borderRadius: '6px', padding: '2px 7px',
                                          fontSize: '0.72rem', fontWeight: '600'
                                        }}>{ct.label}</span>
                                      </td>
                                      <td style={{ textTransform: 'capitalize' }}>
                                        {assessment.source === 'assignment' ? 'TP/TD' : assessment.source === 'quiz' ? 'Quiz en ligne' : 'Hors ligne'}
                                      </td>
                                      <td>{assessment.graded_count}/{assessment.students_count}</td>
                                      <td>{Number(assessment.average_percentage || 0).toFixed(2)}%</td>
                                      <td>
                                        <Badge bg={assessment.status === 'draft' ? 'warning' : assessment.status === 'validated' ? 'success' : 'secondary'}>
                                          {assessment.status === 'draft' ? 'Brouillon' : assessment.status === 'validated' ? 'Validée' : assessment.status}
                                        </Badge>
                                      </td>
                                      <td className="text-end">
                                        <Button variant="link" size="sm" onClick={() => openAssessmentDetail(assessment)}
                                          style={{ color: 'var(--color-primary)', padding: '2px 5px' }}>
                                          <FiEye size={14} />
                                        </Button>
                                      </td>
                                    </tr>
                                  )
                                })}
                              </tbody>
                            </Table>
                          </div>
                        )}
                      </div>

                      {grades.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                          <FiBarChart2 style={{ fontSize: '3rem', color: 'var(--color-textSecondary)', marginBottom: '16px' }} />
                          <p style={{ color: 'var(--color-textSecondary)' }}>Aucune note saisie. Cliquez sur "Ajouter une épreuve/résultat".</p>
                        </div>
                      ) : (
                        <div style={{ overflowX: 'auto' }}>
                          <Table hover size="sm" style={{ fontSize: '0.875rem' }}>
                            <thead style={{ background: 'var(--color-bodyBg)' }}>
                              <tr>
                                <th>Étudiant</th>
                                <th>Type</th>
                                <th>Libellé</th>
                                <th>Note</th>
                                <th>/Max</th>
                                <th>%</th>
                                <th>Commentaire</th>
                                <th></th>
                              </tr>
                            </thead>
                            <tbody>
                              {grades.map((g) => {
                                const ct = CATEGORY_TYPE_COLORS[g.category_type] || CATEGORY_TYPE_COLORS.examen
                                const pct = g.max_value > 0
                                  ? Math.round(parseFloat(g.value) / parseFloat(g.max_value) * 100)
                                  : 0
                                return (
                                  <tr key={g.id}>
                                    <td style={{ fontWeight: '600' }}>
                                      {g.student_name || `#${g.student}`}
                                    </td>
                                    <td>
                                      <span style={{
                                        background: ct.bg, color: ct.text,
                                        borderRadius: '6px', padding: '2px 7px',
                                        fontSize: '0.72rem', fontWeight: '600'
                                      }}>{ct.label}</span>
                                    </td>
                                    <td>{g.label || g.category_name}</td>
                                    <td style={{ fontWeight: '700', color: pct >= 50 ? '#28a745' : '#dc3545' }}>
                                      {g.value}
                                    </td>
                                    <td style={{ color: 'var(--color-textSecondary)' }}>{g.max_value}</td>
                                    <td>
                                      <Badge bg={pct >= 50 ? 'success' : 'danger'} style={{ fontSize: '0.75rem' }}>
                                        {pct}%
                                      </Badge>
                                    </td>
                                    <td style={{ color: 'var(--color-textSecondary)', maxWidth: '120px' }}>
                                      <span title={g.comment}>{(g.comment || '').substring(0, 30)}</span>
                                    </td>
                                    <td>
                                      <Button variant="link" size="sm" style={{ color: '#FF9800', padding: '2px 5px' }}
                                        onClick={() => openEditGrade(g)}>
                                        <FiEdit size={13} />
                                      </Button>
                                      <Button variant="link" size="sm" style={{ color: '#f44336', padding: '2px 5px' }}
                                        onClick={() => handleDeleteGrade(g.id)}>
                                        <FiTrash size={13} />
                                      </Button>
                                    </td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </Table>
                        </div>
                      )}
                    </>
                  )}
                </>
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
                  onClick={() => setActiveTab('grades')}
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

      <Modal show={showAssessmentDetail} onHide={() => setShowAssessmentDetail(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>{selectedAssessment?.title || "Détail de l'épreuve"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {loadingAssessmentDetail ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <Spinner animation="border" style={{ color: 'var(--color-primary)' }} />
            </div>
          ) : assessmentDetail?.error ? (
            <Alert variant="danger">{assessmentDetail.error}</Alert>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <Table hover size="sm" style={{ fontSize: '0.875rem' }}>
                <thead>
                  <tr>
                    <th>Étudiant</th>
                    <th>Matricule</th>
                    <th>Note</th>
                    <th>%</th>
                    <th>Statut</th>
                    <th>Commentaire</th>
                  </tr>
                </thead>
                <tbody>
                  {(assessmentDetail?.students || []).map((row) => (
                    <tr key={row.student}>
                      <td style={{ fontWeight: '600' }}>{row.student_name}</td>
                      <td>{row.matricule || '-'}</td>
                      <td>{row.value === null || row.value === undefined ? '-' : `${row.value}/${row.max_value}`}</td>
                      <td>{row.percentage === null || row.percentage === undefined ? '-' : `${row.percentage}%`}</td>
                      <td>
                        <Badge bg={row.status === 'validated' || row.status === 'graded' || row.status === 'submitted' ? 'success' : row.status === 'draft' ? 'warning' : 'secondary'}>
                          {row.status === 'missing' ? 'Non saisi' : row.status}
                        </Badge>
                      </td>
                      <td style={{ maxWidth: '180px' }}>
                        <span title={row.comment}>{(row.comment || '').substring(0, 60)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Modal.Body>
      </Modal>

      <Modal show={showBulkModal} onHide={() => setShowBulkModal(false)} size="xl" centered>
        <Modal.Header closeButton>
          <Modal.Title>Ajouter une épreuve/résultat</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {bulkError && <Alert variant="danger">{bulkError}</Alert>}
          <Row className="g-3 mb-4">
            <Col md={4}>
              <Form.Group>
                <Form.Label>Type d'évaluation</Form.Label>
                <Form.Select value={bulkForm.category}
                  onChange={e => setBulkForm({ ...bulkForm, category: e.target.value })}>
                  <option value="">Sélectionner</option>
                  {categories.filter(c => c.category_type !== 'quiz').map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name} ({category.category_type_display || category.category_type})
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Libellé</Form.Label>
                <Form.Control value={bulkForm.label} placeholder="Ex: Examen mi-session"
                  onChange={e => setBulkForm({ ...bulkForm, label: e.target.value })} />
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group>
                <Form.Label>Session</Form.Label>
                <Form.Control type="number" min={1} value={bulkForm.session_number}
                  onChange={e => setBulkForm({ ...bulkForm, session_number: e.target.value })} />
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group>
                <Form.Label>Note max</Form.Label>
                <Form.Control type="number" min={1} step="0.5" value={bulkForm.max_value}
                  onChange={e => setBulkForm({ ...bulkForm, max_value: e.target.value })} />
              </Form.Group>
            </Col>
          </Row>
          <div style={{ overflowX: 'auto', maxHeight: '52vh' }}>
            <Table hover size="sm" style={{ fontSize: '0.875rem' }}>
              <thead style={{ position: 'sticky', top: 0, background: 'var(--color-cardBg)' }}>
                <tr>
                  <th>Étudiant</th>
                  <th style={{ width: 160 }}>Note</th>
                  <th>Commentaire</th>
                </tr>
              </thead>
              <tbody>
                {gradeStudents.map(student => {
                  const entry = bulkForm.entries.find(item => String(item.student) === String(student.id)) || {}
                  return (
                    <tr key={student.id}>
                      <td style={{ fontWeight: '600' }}>
                        {student.first_name} {student.last_name}
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-textSecondary)' }}>{student.email}</div>
                      </td>
                      <td>
                        <Form.Control type="number" min={0} max={bulkForm.max_value} step="0.5"
                          value={entry.value ?? ''}
                          onChange={e => updateBulkEntry(student.id, 'value', e.target.value)} />
                      </td>
                      <td>
                        <Form.Control value={entry.comment || ''}
                          onChange={e => updateBulkEntry(student.id, 'comment', e.target.value)} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </Table>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowBulkModal(false)}>Annuler</Button>
          <Button variant="outline-primary" onClick={() => saveBulkAssessment('draft')} disabled={savingBulk}>
            {savingBulk && <Spinner size="sm" animation="border" className="me-2" />}
            Brouillon
          </Button>
          <Button variant="primary" onClick={() => saveBulkAssessment('validated')} disabled={savingBulk}>
            {savingBulk && <Spinner size="sm" animation="border" className="me-2" />}
            Valider
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ── Grade Entry Modal (teacher/admin) ─────────────────────────────── */}
      <Modal show={showGradeModal} onHide={() => setShowGradeModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{editingGrade ? "Modifier la note" : "Saisir une note"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {gradeFormError && <Alert variant="danger" style={{ borderRadius: '8px', fontSize: '0.875rem' }}>{gradeFormError}</Alert>}
          <Form>
            <Row className="g-3">
              <Col md={12}>
                <Form.Group>
                  <Form.Label>Étudiant *</Form.Label>
                  <Form.Select value={gradeForm.student}
                    onChange={e => setGradeForm({ ...gradeForm, student: e.target.value })}>
                    <option value="">— Sélectionner —</option>
                    {gradeStudents.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.first_name} {s.last_name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Catégorie *</Form.Label>
                  <Form.Select value={gradeForm.category}
                    onChange={e => setGradeForm({ ...gradeForm, category: e.target.value })}>
                    <option value="">— Sélectionner —</option>
                    {categories.filter(c => c.category_type !== 'quiz').map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.weight}%)
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>N° session</Form.Label>
                  <Form.Control type="number" min={1} value={gradeForm.session_number}
                    onChange={e => setGradeForm({ ...gradeForm, session_number: parseInt(e.target.value) || 1 })} />
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Group>
                  <Form.Label>Libellé</Form.Label>
                  <Form.Control type="text" placeholder='Ex: "Interro 1", "TP Semaine 4"'
                    value={gradeForm.label}
                    onChange={e => setGradeForm({ ...gradeForm, label: e.target.value })} />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Note obtenue *</Form.Label>
                  <Form.Control type="number" step="0.5" min={0} value={gradeForm.value}
                    onChange={e => setGradeForm({ ...gradeForm, value: e.target.value })} />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Note maximale</Form.Label>
                  <Form.Control type="number" step="0.5" min={1} value={gradeForm.max_value}
                    onChange={e => setGradeForm({ ...gradeForm, max_value: e.target.value })} />
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Group>
                  <Form.Label>Commentaire</Form.Label>
                  <Form.Control as="textarea" rows={2} value={gradeForm.comment}
                    onChange={e => setGradeForm({ ...gradeForm, comment: e.target.value })} />
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowGradeModal(false)}>Annuler</Button>
          <Button variant="primary" onClick={handleSaveGrade} disabled={savingGrade}>
            {savingGrade && <Spinner size="sm" animation="border" className="me-2" />}
            {editingGrade ? "Enregistrer" : "Ajouter"}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}

export default CourseDetail
