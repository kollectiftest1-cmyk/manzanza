import { gradeWorkflowAPI } from '../services/api'
import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { Alert, Badge, Button, Col, Container, Form, Modal, Row, Spinner, Table } from "react-bootstrap"
import { FiArrowLeft, FiEye, FiPlus, FiRefreshCw } from "react-icons/fi"
import { useSelector } from "react-redux"
import { getCourseDetail } from "../services/courseService"
import gradeService from "../services/gradeService"
import { getUsers } from "../services/userService"
import { notify, notifyError } from "../utils/notify"

const CATEGORY_TYPE_COLORS = {
  interro: { bg: '#fff3cd', text: '#856404', label: 'Interrogation' },
  quiz: { bg: '#d1ecf1', text: '#0c5460', label: 'Quiz' },
  tp_td: { bg: '#d4edda', text: '#155724', label: 'TP/TD' },
  examen: { bg: '#f8d7da', text: '#721c24', label: 'Examen' },
  bonus: { bg: '#e2e3e5', text: '#383d41', label: 'Bonus' },
}

const unwrapList = (response) => {
  const data = response?.data ?? response
  if (Array.isArray(data)) return data
  return data?.results || []
}

const emptyBulkForm = {
  category: '',
  label: '',
  session_number: '',
  max_value: 20,
  entries: [],
}

const CourseAssessments = () => {
  const { id } = useParams()
  const { user } = useSelector((state) => state.auth)
  const canEdit = ['enseignant', 'assistant', 'chef_section', 'chef_departement', 'sga', 'pdg', 'directeur_general'].includes(user?.role)

  const [course, setCourse] = useState(null)
  const [categories, setCategories] = useState([])
  const [students, setStudents] = useState([])
  const [assessments, setAssessments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [selectedAssessment, setSelectedAssessment] = useState(null)
  const [assessmentDetail, setAssessmentDetail] = useState(null)
  const [showDetail, setShowDetail] = useState(false)
  const [loadingDetail, setLoadingDetail] = useState(false)

  const [showBulk, setShowBulk] = useState(false)
  const [bulkForm, setBulkForm] = useState(emptyBulkForm)
  const [bulkError, setBulkError] = useState(null)
  const [savingBulk, setSavingBulk] = useState(false)

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [courseRes, categoriesRes, assessmentsRes] = await Promise.all([
        getCourseDetail(id),
        gradeService.getCategories(),
        gradeService.getCourseAssessments(id),
      ])
      const courseData = courseRes.data
      setCourse(courseData)
      setCategories(unwrapList(categoriesRes))
      setAssessments(assessmentsRes.data?.assessments || [])

      const auditoireId = courseData?.auditoire || courseData?.auditoire_detail?.id
      if (auditoireId && canEdit) {
        const studentsRes = await getUsers({ auditoire: auditoireId, role: 'etudiant', page_size: 500 }).catch(() => ({ data: [] }))
        setStudents(unwrapList(studentsRes))
      }
    } catch (err) {
      notifyError(err, err.response?.data?.error || "Impossible de charger les épreuves du cours.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [id])

  const assessmentParams = (assessment) => {
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

  const openDetail = async (assessment) => {
    setSelectedAssessment(assessment)
    setAssessmentDetail(null)
    setShowDetail(true)
    setLoadingDetail(true)
    try {
      const res = await gradeService.getAssessmentDetail(assessmentParams(assessment))
      setAssessmentDetail(res.data)
    } catch (err) {
      setAssessmentDetail({ error: err.response?.data?.error || "Impossible de charger cette épreuve." })
    } finally {
      setLoadingDetail(false)
    }
  }

  // Feuille soumise ou approuvée : la note ne se modifie plus, on dépose une demande tracée.
  const requestCorrection = async (row) => {
    const value = window.prompt(`Nouvelle note pour ${row.student_name} (sur ${row.max_value}) :`, row.value ?? '')
    if (value === null || value === '') return
    const reason = window.prompt('Motif de la correction (obligatoire) :')
    if (!reason) return
    try {
      await gradeWorkflowAPI.requestCorrection({ grade: row.grade_id, new_value: value, reason })
      notify.info('Demande de correction transmise au chef de filière / SGA.')
    } catch (err) {
      notifyError(err, err.response?.data?.detail || err.response?.data?.error || 'Demande impossible.')
    }
  }

  const openBulk = () => {
    const firstCategory = categories.find(category => category.category_type !== 'quiz')
    setBulkForm({
      ...emptyBulkForm,
      category: firstCategory?.id || '',
      entries: students.map(student => ({ student: student.id, value: '', comment: '' })),
    })
    setBulkError(null)
    setShowBulk(true)
  }

  const updateBulkEntry = (studentId, field, value) => {
    setBulkForm(prev => ({
      ...prev,
      entries: prev.entries.map(entry =>
        String(entry.student) === String(studentId) ? { ...entry, [field]: value } : entry
      ),
    }))
  }

  const saveBulk = async (statusValue) => {
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
      setShowBulk(false)
      await loadData()
    } catch (err) {
      notifyError(err, err.response?.data?.detail || err.response?.data?.error || "Erreur lors de l'enregistrement.")
    } finally {
      setSavingBulk(false)
    }
  }

  return (
    <Container fluid className="py-4 px-3 px-lg-4">
      <div className="d-flex justify-content-between align-items-center gap-3 flex-wrap mb-4">
        <div>
          <Button as={Link} to={`/courses/${id}`} variant="link" className="p-0 mb-2">
            <FiArrowLeft className="me-2" /> Retour au cours
          </Button>
          <h1 className="h3 fw-bold mb-1">Épreuves & résultats</h1>
          <div className="text-muted">{course?.name || "Cours"} - notes hors-ligne, TP/TD et quiz en ligne.</div>
        </div>
        <div className="d-flex gap-2">
          <Button variant="outline-secondary" onClick={loadData} disabled={loading}>
            <FiRefreshCw className="me-2" /> Actualiser
          </Button>
          {canEdit && (
            <Button variant="primary" onClick={openBulk}>
              <FiPlus className="me-2" /> Ajouter une épreuve/résultat
            </Button>
          )}
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {loading ? (
        <div className="text-center py-5"><Spinner animation="border" /></div>
      ) : assessments.length === 0 ? (
        <Alert variant="info">Aucune épreuve enregistrée pour ce cours.</Alert>
      ) : (
        <div className="table-responsive">
          <Table hover className="align-middle">
            <thead>
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
              {assessments.map((assessment) => {
                const color = CATEGORY_TYPE_COLORS[assessment.category_type] || CATEGORY_TYPE_COLORS.examen
                return (
                  <tr key={`${assessment.source}-${assessment.id}-${assessment.session_number}`}>
                    <td className="fw-semibold">{assessment.title}</td>
                    <td>
                      <span style={{ background: color.bg, color: color.text, borderRadius: 6, padding: '3px 8px', fontSize: '0.78rem', fontWeight: 700 }}>
                        {color.label}
                      </span>
                    </td>
                    <td>{assessment.source === 'assignment' ? 'TP/TD' : assessment.source === 'quiz' ? 'Quiz en ligne' : 'Hors ligne'}</td>
                    <td>{assessment.graded_count}/{assessment.students_count}</td>
                    <td>{Number(assessment.average_percentage || 0).toFixed(2)}%</td>
                    <td>
                      <Badge bg={assessment.status === 'draft' ? 'warning' : assessment.status === 'validated' ? 'success' : 'secondary'}>
                        {assessment.status === 'draft' ? 'Brouillon' : assessment.status === 'validated' ? 'Validée' : assessment.status}
                      </Badge>
                    </td>
                    <td className="text-end">
                      <Button variant="outline-primary" size="sm" onClick={() => openDetail(assessment)}>
                        <FiEye className="me-1" /> Voir
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </Table>
        </div>
      )}

      <Modal show={showDetail} onHide={() => setShowDetail(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>{selectedAssessment?.title || "Détail de l'épreuve"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {loadingDetail ? (
            <div className="text-center py-4"><Spinner animation="border" /></div>
          ) : assessmentDetail?.error ? (
            <Alert variant="danger">{assessmentDetail.error}</Alert>
          ) : (
            <div className="table-responsive">
              <Table hover size="sm">
                <thead>
                  <tr>
                    <th>Étudiant</th>
                    <th>Matricule</th>
                    <th>Note</th>
                    <th>%</th>
                    <th>Statut</th>
                    <th>Commentaire</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {(assessmentDetail?.students || []).map(row => (
                    <tr key={row.student}>
                      <td className="fw-semibold">{row.student_name}</td>
                      <td>{row.matricule || '-'}</td>
                      <td>{row.value === null || row.value === undefined ? '-' : `${row.value}/${row.max_value}`}</td>
                      <td>{row.percentage === null || row.percentage === undefined ? '-' : `${row.percentage}%`}</td>
                      <td>
                        <Badge bg={row.status === 'validated' || row.status === 'graded' || row.status === 'submitted' ? 'success' : row.status === 'draft' ? 'warning' : 'secondary'}>
                          {row.status === 'missing' ? 'Non saisi' : row.status}
                        </Badge>
                      </td>
                      <td>{row.comment || '-'}</td>
                      <td className="text-end">
                        {row.grade_id && row.status !== 'draft' && (
                          <Button variant="outline-secondary" size="sm" onClick={() => requestCorrection(row)}>Corriger</Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Modal.Body>
      </Modal>

      <Modal show={showBulk} onHide={() => setShowBulk(false)} size="xl" centered>
        <Modal.Header closeButton>
          <Modal.Title>Ajouter une épreuve/résultat</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {bulkError && <Alert variant="danger">{bulkError}</Alert>}
          <Alert variant="info" className="py-2" style={{ fontSize: '0.88rem' }}>
            Les notes restent en brouillon. Quand la feuille est complète, soumettez-la depuis{' '}
            <Link to="/validation-notes">Validation des notes</Link> : elle sera publiée aux étudiants après approbation.
          </Alert>
          <Row className="g-3 mb-4">
            <Col md={4}>
              <Form.Label>Type d'évaluation</Form.Label>
              <Form.Select value={bulkForm.category} onChange={event => setBulkForm({ ...bulkForm, category: event.target.value })}>
                <option value="">Sélectionner</option>
                {categories.filter(category => category.category_type !== 'quiz').map(category => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </Form.Select>
            </Col>
            <Col md={4}>
              <Form.Label>Libellé</Form.Label>
              <Form.Control value={bulkForm.label} onChange={event => setBulkForm({ ...bulkForm, label: event.target.value })} />
            </Col>
            <Col md={2}>
              <Form.Label>Session</Form.Label>
              <Form.Control type="number" min={1} value={bulkForm.session_number} onChange={event => setBulkForm({ ...bulkForm, session_number: event.target.value })} />
            </Col>
            <Col md={2}>
              <Form.Label>Note max</Form.Label>
              <Form.Control type="number" min={1} step="0.5" value={bulkForm.max_value} onChange={event => setBulkForm({ ...bulkForm, max_value: event.target.value })} />
            </Col>
          </Row>
          <div className="table-responsive" style={{ maxHeight: '52vh' }}>
            <Table hover size="sm">
              <thead>
                <tr>
                  <th>Étudiant</th>
                  <th style={{ width: 160 }}>Note</th>
                  <th>Commentaire</th>
                </tr>
              </thead>
              <tbody>
                {students.map(student => {
                  const entry = bulkForm.entries.find(item => String(item.student) === String(student.id)) || {}
                  return (
                    <tr key={student.id}>
                      <td className="fw-semibold">{student.first_name} {student.last_name}</td>
                      <td>
                        <Form.Control type="number" min={0} max={bulkForm.max_value} step="0.5" value={entry.value ?? ''}
                          onChange={event => updateBulkEntry(student.id, 'value', event.target.value)} />
                      </td>
                      <td>
                        <Form.Control value={entry.comment || ''}
                          onChange={event => updateBulkEntry(student.id, 'comment', event.target.value)} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </Table>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowBulk(false)}>Annuler</Button>
          <Button variant="primary" onClick={() => saveBulk('draft')} disabled={savingBulk}>
            {savingBulk && <Spinner size="sm" animation="border" className="me-2" />}
            Enregistrer (brouillon)
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  )
}

export default CourseAssessments
