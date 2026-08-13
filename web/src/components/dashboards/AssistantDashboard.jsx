/**
 * 👨‍🏫 ASSISTANT DASHBOARD
 * Dashboard spécifique pour les assistants
 * Affiche les cours où l'assistant aide, ses permissions, et actions autorisées
 */

import { useState, useEffect } from 'react'
import { Container, Row, Col, Card, Badge, Table, Button, Alert } from 'react-bootstrap'
import { FiBook, FiUsers, FiCheckCircle, FiAlertCircle, FiEdit } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import api from '../../services/api'

const AssistantDashboard = ({ user }) => {
  const [assignments, setAssignments] = useState([])
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchAssistantData()
  }, [])

  const fetchAssistantData = async () => {
    try {
      setLoading(true)

      // Récupérer mes assignations (enseignants qui m'ont assigné)
      const assignmentsRes = await api.get('/courses/teacher-assistants/my-assignments/')
      setAssignments(assignmentsRes.data.assignments || [])

      // Récupérer les cours où je suis assistant
      const coursesRes = await api.get('/courses/', {
        params: { assistants: user.id }
      })
      setCourses(coursesRes.data.results || coursesRes.data || [])

      setLoading(false)
    } catch (err) {
      console.error('Error fetching assistant data:', err)
      setError('Erreur lors du chargement des données')
      setLoading(false)
    }
  }

  const getPermissionBadge = (permission, value) => {
    return (
      <Badge bg={value ? 'success' : 'secondary'} className="me-1">
        {permission}
      </Badge>
    )
  }

  if (loading) {
    return (
      <Container className="mt-4">
        <Alert variant="info">Chargement...</Alert>
      </Container>
    )
  }

  if (error) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">{error}</Alert>
      </Container>
    )
  }

  return (
    <Container fluid style={{ padding: '24px', background: 'var(--color-bodyBg)' }}>
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '32px',
            borderRadius: '16px',
            color: 'white'
          }}>
            <h2 style={{ margin: 0, fontSize: '28px', fontWeight: '600' }}>
              👨‍🏫 Dashboard Assistant
            </h2>
            <p style={{ margin: '8px 0 0', opacity: 0.9 }}>
              Bienvenue {user.first_name} {user.last_name}
            </p>
          </div>
        </Col>
      </Row>

      {/* Statistics Cards */}
      <Row className="mb-4">
        <Col md={4}>
          <Card style={{
            border: '1px solid var(--color-border)',
            borderRadius: '12px',
            padding: '20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <FiBook size={28} color="white" />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-textSecondary)' }}>
                  Cours assignés
                </p>
                <h3 style={{ margin: '4px 0 0', fontSize: '32px', fontWeight: '700' }}>
                  {courses.length}
                </h3>
              </div>
            </div>
          </Card>
        </Col>

        <Col md={4}>
          <Card style={{
            border: '1px solid var(--color-border)',
            borderRadius: '12px',
            padding: '20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #f093fb, #f5576c)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <FiUsers size={28} color="white" />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-textSecondary)' }}>
                  Enseignants
                </p>
                <h3 style={{ margin: '4px 0 0', fontSize: '32px', fontWeight: '700' }}>
                  {new Set(assignments.map(a => a.teacher)).size}
                </h3>
              </div>
            </div>
          </Card>
        </Col>

        <Col md={4}>
          <Card style={{
            border: '1px solid var(--color-border)',
            borderRadius: '12px',
            padding: '20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #4facfe, #00f2fe)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <FiCheckCircle size={28} color="white" />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-textSecondary)' }}>
                  Assignations actives
                </p>
                <h3 style={{ margin: '4px 0 0', fontSize: '32px', fontWeight: '700' }}>
                  {assignments.filter(a => a.is_active).length}
                </h3>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Mes Assignations */}
      <Row className="mb-4">
        <Col>
          <Card style={{
            border: '1px solid var(--color-border)',
            borderRadius: '12px',
            overflow: 'hidden'
          }}>
            <Card.Header style={{
              background: 'var(--color-cardBg)',
              borderBottom: '1px solid var(--color-border)',
              padding: '20px'
            }}>
              <h5 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
                📋 Mes Assignations
              </h5>
            </Card.Header>
            <Card.Body style={{ padding: 0 }}>
              {assignments.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center' }}>
                  <FiAlertCircle size={48} color="var(--color-textSecondary)" />
                  <p style={{ marginTop: '16px', color: 'var(--color-textSecondary)' }}>
                    Aucune assignation pour le moment
                  </p>
                </div>
              ) : (
                <Table responsive hover style={{ margin: 0 }}>
                  <thead style={{ background: 'var(--color-bodyBg)' }}>
                    <tr>
                      <th>Enseignant</th>
                      <th>Cours</th>
                      <th>Permissions</th>
                      <th>Date d'assignation</th>
                      <th>Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignments.map((assignment) => (
                      <tr key={assignment.id}>
                        <td>
                          <strong>{assignment.teacher_name}</strong>
                          <br />
                          <small style={{ color: 'var(--color-textSecondary)' }}>
                            {assignment.teacher_email}
                          </small>
                        </td>
                        <td>
                          {assignment.course_name ? (
                            <Link to={`/courses/${assignment.course}`}>
                              {assignment.course_name}
                              <br />
                              <small style={{ color: 'var(--color-textSecondary)' }}>
                                {assignment.course_code}
                              </small>
                            </Link>
                          ) : (
                            <em style={{ color: 'var(--color-textSecondary)' }}>
                              Tous les cours
                            </em>
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {assignment.can_edit_materials && getPermissionBadge('Matériels', true)}
                            {assignment.can_take_attendance && getPermissionBadge('Présences', true)}
                            {assignment.can_manage_assignments && getPermissionBadge('Devoirs', true)}
                            {assignment.can_grade && getPermissionBadge('Notes', true)}
                          </div>
                        </td>
                        <td>
                          {new Date(assignment.assigned_date).toLocaleDateString('fr-FR')}
                        </td>
                        <td>
                          <Badge bg={assignment.is_active ? 'success' : 'secondary'}>
                            {assignment.is_active ? 'Actif' : 'Inactif'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Mes Cours */}
      <Row>
        <Col>
          <Card style={{
            border: '1px solid var(--color-border)',
            borderRadius: '12px',
            overflow: 'hidden'
          }}>
            <Card.Header style={{
              background: 'var(--color-cardBg)',
              borderBottom: '1px solid var(--color-border)',
              padding: '20px'
            }}>
              <h5 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
                📚 Mes Cours
              </h5>
            </Card.Header>
            <Card.Body style={{ padding: 0 }}>
              {courses.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center' }}>
                  <FiBook size={48} color="var(--color-textSecondary)" />
                  <p style={{ marginTop: '16px', color: 'var(--color-textSecondary)' }}>
                    Aucun cours assigné
                  </p>
                </div>
              ) : (
                <Table responsive hover style={{ margin: 0 }}>
                  <thead style={{ background: 'var(--color-bodyBg)' }}>
                    <tr>
                      <th>Cours</th>
                      <th>Enseignant Titulaire</th>
                      <th>Auditoire</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courses.map((course) => (
                      <tr key={course.id}>
                        <td>
                          <strong>{course.name}</strong>
                          <br />
                          <small style={{ color: 'var(--color-textSecondary)' }}>
                            {course.code} - {course.credits} crédits
                          </small>
                        </td>
                        <td>
                          {course.titulaire_name || 'Non assigné'}
                        </td>
                        <td>
                          {course.auditoire_detail?.nom || 'N/A'}
                        </td>
                        <td>
                          <Link to={`/courses/${course.id}`}>
                            <Button variant="outline-primary" size="sm">
                              <FiEdit className="me-1" />
                              Voir le cours
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Note d'information */}
      <Row className="mt-4">
        <Col>
          <Alert variant="info" style={{ borderRadius: '12px' }}>
            <strong>ℹ️ Information</strong>
            <p style={{ margin: '8px 0 0' }}>
              Vos permissions peuvent varier selon les cours. Vérifiez vos permissions spécifiques
              dans la section "Mes Assignations" ci-dessus. Si vous pensez qu'il manque des permissions,
              contactez l'enseignant titulaire du cours.
            </p>
          </Alert>
        </Col>
      </Row>
    </Container>
  )
}

export default AssistantDashboard
