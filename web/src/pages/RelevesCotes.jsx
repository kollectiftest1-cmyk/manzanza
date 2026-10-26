import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import {
  Alert, Badge, Button, Card, Col, Container, Form, Row, Spinner, Table,
} from 'react-bootstrap'
import { FiFileText, FiRefreshCw, FiSearch, FiTrendingUp } from 'react-icons/fi'
import api from '../services/api'
import gradeService from '../services/gradeService'
import { notifyError } from "../utils/notify"

const PAGE_ROLES = ['pdg', 'sga', 'sgad', 'directeur_general', 'chef_section', 'chef_departement', 'enseignant', 'assistant']

const unwrap = (response) => {
  const data = response?.data ?? response
  return Array.isArray(data) ? data : data?.results || []
}

const formatAverage = (value) => {
  const number = Number(value || 0)
  return `${number.toFixed(2)}%`
}

const RelevesCotes = () => {
  const { user } = useSelector((state) => state.auth)
  const [searchParams] = useSearchParams()
  const isStudent = user?.role === 'etudiant'
  const canUseFilters = !isStudent && PAGE_ROLES.includes(user?.role)

  const [filters, setFilters] = useState({
    student: searchParams.get('student') || '',
    auditoire: searchParams.get('auditoire') || '',
    year: searchParams.get('year') || '',
    semester: searchParams.get('semester') || '',
    search: '',
  })
  const [auditoires, setAuditoires] = useState([])
  const [transcripts, setTranscripts] = useState([])
  const [selectedTranscript, setSelectedTranscript] = useState(null)
  const [grades, setGrades] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingGrades, setLoadingGrades] = useState(false)
  const [error, setError] = useState(null)

  const loadAuditoires = useCallback(async () => {
    if (!canUseFilters) return
    try {
      const response = await api.get('/auditoires/')
      setAuditoires(unwrap(response))
    } catch {
      setAuditoires([])
    }
  }, [canUseFilters])

  const loadTranscripts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = {}
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params[key] = value
      })

      const response = isStudent
        ? await gradeService.getMyTranscript()
        : await gradeService.getTranscripts(params)
      const data = unwrap(response)
      setTranscripts(data)
      setSelectedTranscript((current) => {
        if (current && data.some(item => item.id === current.id)) return current
        return data[0] || null
      })
    } catch (err) {
      notifyError(err, err.response?.data?.detail || "Impossible de charger les releves de cotes.")
      setTranscripts([])
      setSelectedTranscript(null)
    } finally {
      setLoading(false)
    }
  }, [filters, isStudent])

  const loadGrades = useCallback(async () => {
    if (!selectedTranscript) {
      setGrades([])
      return
    }
    setLoadingGrades(true)
    try {
      const response = isStudent
        ? await gradeService.getMyGrades()
        : await gradeService.getStudentGrades(selectedTranscript.student)
      setGrades(unwrap(response))
    } catch {
      setGrades([])
    } finally {
      setLoadingGrades(false)
    }
  }, [isStudent, selectedTranscript])

  useEffect(() => {
    loadAuditoires()
  }, [loadAuditoires])

  useEffect(() => {
    loadTranscripts()
  }, [loadTranscripts])

  useEffect(() => {
    loadGrades()
  }, [loadGrades])

  const groupedGrades = useMemo(() => {
    if (isStudent) return grades

    const groups = new Map()
    grades.forEach((grade) => {
      const key = String(grade.course)
      if (!groups.has(key)) {
        groups.set(key, {
          course_id: grade.course,
          course_name: grade.course_name,
          course_code: '',
          grades: [],
          average: null,
        })
      }
      groups.get(key).grades.push({
        id: grade.id,
        category: grade.category_name,
        label: grade.label || `#${grade.session_number}`,
        value: Number(grade.value),
        max_value: Number(grade.max_value),
        percentage: Number(grade.percentage),
      })
    })

    return Array.from(groups.values()).map((course) => {
      const total = course.grades.reduce((sum, grade) => sum + grade.percentage, 0)
      return {
        ...course,
        average: course.grades.length ? total / course.grades.length : null,
      }
    })
  }, [grades, isStudent])

  const updateFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const resetFilters = () => {
    setFilters({ student: '', auditoire: '', year: '', semester: '', search: '' })
  }

  return (
    <Container fluid className="py-4 px-3 px-lg-4">
      <div className="d-flex align-items-center justify-content-between gap-3 flex-wrap mb-4">
        <div>
          <h1 className="h3 fw-bold mb-1 d-flex align-items-center gap-2">
            <FiFileText /> Releves des cotes
          </h1>
          <div className="text-muted">Bulletins, moyennes et details des notes par cours.</div>
        </div>
        <Button variant="outline-primary" onClick={loadTranscripts} disabled={loading}>
          <FiRefreshCw className="me-2" /> Actualiser
        </Button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {canUseFilters && (
        <Card className="mb-4 shadow-sm">
          <Card.Body>
            <Row className="g-3 align-items-end">
              <Col lg={3} md={6}>
                <Form.Label>Recherche</Form.Label>
                <div className="position-relative">
                  <FiSearch className="position-absolute" style={{ left: 12, top: 12, color: '#6c757d' }} />
                  <Form.Control
                    value={filters.search}
                    onChange={e => updateFilter('search', e.target.value)}
                    placeholder="Nom, email, auditoire..."
                    style={{ paddingLeft: 36 }}
                  />
                </div>
              </Col>
              <Col lg={2} md={6}>
                <Form.Label>Etudiant ID</Form.Label>
                <Form.Control
                  type="number"
                  value={filters.student}
                  onChange={e => updateFilter('student', e.target.value)}
                  placeholder="ID"
                />
              </Col>
              <Col lg={3} md={6}>
                <Form.Label>Auditoire</Form.Label>
                <Form.Select value={filters.auditoire} onChange={e => updateFilter('auditoire', e.target.value)}>
                  <option value="">Tous</option>
                  {auditoires.map(auditoire => (
                    <option key={auditoire.id} value={auditoire.id}>{auditoire.nom}</option>
                  ))}
                </Form.Select>
              </Col>
              <Col lg={2} md={6}>
                <Form.Label>Annee</Form.Label>
                <Form.Control
                  value={filters.year}
                  onChange={e => updateFilter('year', e.target.value)}
                  placeholder="2026-2027"
                />
              </Col>
              <Col lg={2} md={6}>
                <Form.Label>Semestre</Form.Label>
                <Form.Control
                  value={filters.semester}
                  onChange={e => updateFilter('semester', e.target.value)}
                  placeholder="courant"
                />
              </Col>
              <Col md="auto">
                <Button variant="outline-secondary" onClick={resetFilters}>Reinitialiser</Button>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      )}

      <Row className="g-4">
        <Col xl={4}>
          <Card className="shadow-sm h-100">
            <Card.Header className="bg-white fw-semibold">Bulletins</Card.Header>
            <Card.Body className="p-0">
              {loading ? (
                <div className="p-4 text-center"><Spinner animation="border" /></div>
              ) : transcripts.length === 0 ? (
                <div className="p-4 text-muted">Aucun releve disponible.</div>
              ) : (
                <div className="list-group list-group-flush">
                  {transcripts.map((transcript) => (
                    <button
                      key={transcript.id}
                      type="button"
                      className={`list-group-item list-group-item-action ${selectedTranscript?.id === transcript.id ? 'active' : ''}`}
                      onClick={() => setSelectedTranscript(transcript)}
                    >
                      <div className="d-flex justify-content-between gap-3">
                        <div>
                          <div className="fw-semibold">{transcript.student_name}</div>
                          <small>{transcript.auditoire_name}</small>
                        </div>
                        <Badge bg={selectedTranscript?.id === transcript.id ? 'light' : 'primary'} text={selectedTranscript?.id === transcript.id ? 'dark' : undefined}>
                          {formatAverage(transcript.average)}
                        </Badge>
                      </div>
                      <small className="d-block mt-1">
                        {transcript.semester} - {transcript.year}
                      </small>
                    </button>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col xl={8}>
          <Card className="shadow-sm mb-4">
            <Card.Body>
              {selectedTranscript ? (
                <Row className="g-3 align-items-center">
                  <Col md={7}>
                    <div className="text-muted small">Etudiant</div>
                    <h2 className="h4 fw-bold mb-1">{selectedTranscript.student_name}</h2>
                    <div>{selectedTranscript.auditoire_name}</div>
                  </Col>
                  <Col md={5}>
                    <div className="d-flex align-items-center justify-content-md-end gap-3">
                      <FiTrendingUp size={28} className="text-primary" />
                      <div className="text-md-end">
                        <div className="text-muted small">Moyenne generale</div>
                        <div className="h3 fw-bold mb-0">{formatAverage(selectedTranscript.average)}</div>
                        <div className="small text-muted">{selectedTranscript.semester} - {selectedTranscript.year}</div>
                      </div>
                    </div>
                  </Col>
                </Row>
              ) : (
                <div className="text-muted">Selectionnez un releve pour afficher le detail.</div>
              )}
            </Card.Body>
          </Card>

          <Card className="shadow-sm">
            <Card.Header className="bg-white fw-semibold">Details des cotes</Card.Header>
            <Card.Body>
              {loadingGrades ? (
                <div className="py-4 text-center"><Spinner animation="border" /></div>
              ) : groupedGrades.length === 0 ? (
                <div className="text-muted">Aucune cote detaillee pour ce releve.</div>
              ) : (
                groupedGrades.map((course) => (
                  <div key={course.course_id} className="mb-4">
                    <div className="d-flex align-items-center justify-content-between gap-3 flex-wrap mb-2">
                      <div>
                        <h3 className="h6 fw-bold mb-0">{course.course_name}</h3>
                        {course.course_code && <small className="text-muted">{course.course_code}</small>}
                      </div>
                      {course.average !== null && (
                        <Badge bg="success">{formatAverage(course.average)}</Badge>
                      )}
                    </div>
                    <div className="table-responsive">
                      <Table hover size="sm" className="mb-0 align-middle">
                        <thead>
                          <tr>
                            <th>Categorie</th>
                            <th>Evaluation</th>
                            <th className="text-end">Cote</th>
                            <th className="text-end">Pourcentage</th>
                          </tr>
                        </thead>
                        <tbody>
                          {course.grades.map((grade) => (
                            <tr key={grade.id}>
                              <td>{grade.category}</td>
                              <td>{grade.label}</td>
                              <td className="text-end">{grade.value}/{grade.max_value}</td>
                              <td className="text-end">{formatAverage(grade.percentage)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  </div>
                ))
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}

export default RelevesCotes
