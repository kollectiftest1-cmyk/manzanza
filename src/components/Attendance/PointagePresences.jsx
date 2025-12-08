/**
 * 📋 POINTAGE PRÉSENCES
 * Composant pour pointer les présences des étudiants (Enseignant/Assistant)
 */

import { useState, useEffect } from 'react'
import { Card, Table, Button, Form, Badge, Alert, Spinner } from 'react-bootstrap'
import { FiCheckCircle, FiXCircle, FiClock, FiSave } from 'react-icons/fi'
import attendanceService from '../../services/attendanceService'
import api from '../../services/api'

const PointagePresences = ({ course, onSuccess }) => {
  const [students, setStudents] = useState([])
  const [attendances, setAttendances] = useState({})
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  useEffect(() => {
    if (course) {
      fetchEnrollments()
    }
  }, [course])

  const fetchEnrollments = async () => {
    try {
      setLoading(true)
      // Récupérer les étudiants inscrits au cours
      const response = await api.get('/courses/enrollments/', {
        params: { course: course.id, is_active: true }
      })
      const enrollments = response.data.results || response.data || []

      // Initialiser les présences
      const initialAttendances = {}
      enrollments.forEach(enrollment => {
        initialAttendances[enrollment.student] = {
          student_id: enrollment.student,
          status: 'present', // Par défaut
          comments: ''
        }
      })

      setStudents(enrollments)
      setAttendances(initialAttendances)
      setLoading(false)
    } catch (err) {
      console.error('Error fetching enrollments:', err)
      setError('Erreur lors du chargement des étudiants')
      setLoading(false)
    }
  }

  const handleStatusChange = (studentId, status) => {
    setAttendances(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status
      }
    }))
  }

  const handleCommentChange = (studentId, comments) => {
    setAttendances(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        comments
      }
    }))
  }

  const handleSubmit = async () => {
    try {
      setSaving(true)
      setError(null)

      // Préparer les données pour bulk-create
      const attendancesList = Object.values(attendances).map(att => ({
        student_id: att.student_id,
        status: att.status,
        comments: att.comments || ''
      }))

      const data = {
        course: course.id,
        date: selectedDate,
        attendances: attendancesList
      }

      const response = await attendanceService.bulkCreateAttendances(data)

      setSuccess(`✓ Présences enregistrées : ${response.data.created} créées, ${response.data.updated} mises à jour`)
      setSaving(false)

      if (onSuccess) {
        onSuccess()
      }
    } catch (err) {
      console.error('Error saving attendances:', err)
      setError('Erreur lors de l\'enregistrement des présences')
      setSaving(false)
    }
  }

  const getStatusBadge = (status) => {
    const variants = {
      'present': 'success',
      'absent': 'danger',
      'retard': 'warning',
      'excuse': 'info'
    }
    const labels = {
      'present': 'Présent',
      'absent': 'Absent',
      'retard': 'Retard',
      'excuse': 'Excusé'
    }
    return <Badge bg={variants[status]}>{labels[status]}</Badge>
  }

  if (loading) {
    return (
      <div className="text-center p-4">
        <Spinner animation="border" />
        <p className="mt-2">Chargement...</p>
      </div>
    )
  }

  return (
    <Card>
      <Card.Header>
        <div className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">📋 Pointage des Présences</h5>
          <Form.Control
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{ width: '200px' }}
          />
        </div>
      </Card.Header>
      <Card.Body>
        {error && <Alert variant="danger" dismissible onClose={() => setError(null)}>{error}</Alert>}
        {success && <Alert variant="success" dismissible onClose={() => setSuccess(null)}>{success}</Alert>}

        {students.length === 0 ? (
          <Alert variant="info">Aucun étudiant inscrit à ce cours</Alert>
        ) : (
          <>
            <Table responsive hover>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Étudiant</th>
                  <th>Matricule</th>
                  <th>Statut</th>
                  <th>Commentaire</th>
                </tr>
              </thead>
              <tbody>
                {students.map((enrollment, index) => {
                  const studentId = enrollment.student
                  const currentStatus = attendances[studentId]?.status || 'present'

                  return (
                    <tr key={studentId}>
                      <td>{index + 1}</td>
                      <td>
                        <strong>{enrollment.student_name || `Étudiant ${studentId}`}</strong>
                      </td>
                      <td>{enrollment.student_matricule || 'N/A'}</td>
                      <td>
                        <div className="d-flex gap-1">
                          <Button
                            size="sm"
                            variant={currentStatus === 'present' ? 'success' : 'outline-success'}
                            onClick={() => handleStatusChange(studentId, 'present')}
                            title="Présent"
                          >
                            <FiCheckCircle />
                          </Button>
                          <Button
                            size="sm"
                            variant={currentStatus === 'absent' ? 'danger' : 'outline-danger'}
                            onClick={() => handleStatusChange(studentId, 'absent')}
                            title="Absent"
                          >
                            <FiXCircle />
                          </Button>
                          <Button
                            size="sm"
                            variant={currentStatus === 'retard' ? 'warning' : 'outline-warning'}
                            onClick={() => handleStatusChange(studentId, 'retard')}
                            title="Retard"
                          >
                            <FiClock />
                          </Button>
                          <Button
                            size="sm"
                            variant={currentStatus === 'excuse' ? 'info' : 'outline-info'}
                            onClick={() => handleStatusChange(studentId, 'excuse')}
                            title="Excusé"
                          >
                            E
                          </Button>
                        </div>
                      </td>
                      <td>
                        <Form.Control
                          size="sm"
                          type="text"
                          placeholder="Commentaire (optionnel)"
                          value={attendances[studentId]?.comments || ''}
                          onChange={(e) => handleCommentChange(studentId, e.target.value)}
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </Table>

            <div className="d-flex justify-content-between align-items-center mt-3">
              <div>
                <strong>Total : {students.length} étudiants</strong>
              </div>
              <Button
                variant="primary"
                onClick={handleSubmit}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <FiSave className="me-2" />
                    Enregistrer les présences
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </Card.Body>
    </Card>
  )
}

export default PointagePresences
