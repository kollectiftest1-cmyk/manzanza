"use client"

import { Row, Col, Card, Badge, ListGroup, Tab, Tabs } from "react-bootstrap"
import { Link } from "react-router-dom"
import { Bar, Line } from 'react-chartjs-2'

const StatCard = ({ title, value, icon, color }) => (
  <Col md={6} lg={4} className="mb-4">
    <Card className={`border-start border-4 border-${color} shadow-sm h-100`}>
      <Card.Body>
        <Row className="no-gutters align-items-center">
          <Col className="mr-2">
            <div className={`text-xs fw-bold text-${color} text-uppercase mb-1`}>{title}</div>
            <div className="h5 mb-0 fw-bold text-gray-800">{value}</div>
          </Col>
          <Col xs="auto">
            <i className={`fas ${icon} fa-2x text-gray-300`}></i>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  </Col>
)

const TeacherDashboard = ({ user }) => {
  // Access stats from the nested object
  const stats = user.teacher_stats || {}
  const { courses } = user

  // --- Chart Data ---
  const studentPerformanceData = {
    labels: courses?.map(c => c.nom) || [],
    datasets: [{
      label: 'Performance Moyenne des Étudiants par Cours (%)',
      data: courses?.map(() => Math.floor(Math.random() * (85 - 60 + 1)) + 60) || [], // Placeholder data
      backgroundColor: 'rgba(28, 200, 138, 0.8)',
    }],
  }

  const attendanceData = {
    labels: ['Semaine 1', 'Semaine 2', 'Semaine 3', 'Semaine 4', 'Semaine 5'],
    datasets: [{
      label: 'Taux de Présence Global (%)',
      data: [95, 92, 96, 88, 90], // Placeholder data
      fill: false,
      borderColor: 'rgba(78, 115, 223, 1)',
      tension: 0.1,
    }],
  }

  return (
    <>
      {/* Stat Cards */}
      <Row>
        <StatCard title="Cours Enseignés" value={stats.courses_taught_count || 0} icon="fa-chalkboard-teacher" color="primary" />
        <StatCard title="Étudiants Gérés" value={stats.total_students_managed || 0} icon="fa-users" color="success" />
        <StatCard title="Performance Moyenne" value={`${stats.average_student_performance || 0}%`} icon="fa-chart-line" color="info" />
      </Row>

      {/* Charts */}
      <Row>
        <Col xl={6} lg={6}>
          <Card className="shadow mb-4">
            <Card.Header className="py-3">
              <h6 className="m-0 fw-bold text-primary">Performance par Cours</h6>
            </Card.Header>
            <Card.Body>
              <div className="chart-bar" style={{ height: '320px' }}>
                <Bar data={studentPerformanceData} options={{ maintainAspectRatio: false }} />
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col xl={6} lg={6}>
          <Card className="shadow mb-4">
            <Card.Header className="py-3">
              <h6 className="m-0 fw-bold text-primary">Suivi des Présences</h6>
            </Card.Header>
            <Card.Body>
              <div className="chart-line" style={{ height: '320px' }}>
                <Line data={attendanceData} options={{ maintainAspectRatio: false }} />
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Course List and Activities */}
      <Row>
        <Col>
          <Card className="shadow">
            <Card.Header>
              <h6 className="m-0 fw-bold text-primary">Mes Cours et Activités</h6>
            </Card.Header>
            <Card.Body>
              <Tabs defaultActiveKey="courses" id="teacher-details-tabs">
                <Tab eventKey="courses" title="Liste des Cours">
                  <ListGroup variant="flush">
                    {courses?.length > 0 ? courses.map(course => (
                      <ListGroup.Item key={course.id}>
                        <Link to={`/courses/${course.id}`}>{course.nom}</Link>
                        <Badge bg="info" className="ms-2">{course.auditoire_name}</Badge>
                        <Badge bg="primary" className="ms-2">{course.students_count} étudiants</Badge>
                      </ListGroup.Item>
                    )) : <ListGroup.Item>Aucun cours.</ListGroup.Item>}
                  </ListGroup>
                </Tab>
                <Tab eventKey="activity" title="Activité Récente">
                  {/* Placeholder for activity feed */}
                  <ListGroup variant="flush">
                    <ListGroup.Item>Devoir "Projet Final" ajouté au cours "Génie Logiciel".</ListGroup.Item>
                    <ListGroup.Item>Correction de 15 soumissions pour le TP 2.</ListGroup.Item>
                    <ListGroup.Item>Quiz "Chapitre 5" créé pour l'auditoire L3.</ListGroup.Item>
                  </ListGroup>
                </Tab>
              </Tabs>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  )
}

export default TeacherDashboard
