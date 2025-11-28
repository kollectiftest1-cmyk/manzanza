"use client"

import { Row, Col, Card, Badge, ListGroup, Tab, Tabs } from "react-bootstrap"
import { Link } from "react-router-dom"
import { Bar, Doughnut } from 'react-chartjs-2'

const StatCard = ({ title, value, icon, color }) => (
  <Col md={6} lg={3} className="mb-4">
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

const StudentDashboard = ({ user }) => {
  // Access stats from the nested object
  const stats = user.student_stats || {}
  const { courses } = user

  // --- Chart Data (placeholders for now) ---
  const gradeDistributionData = {
    labels: ['A (90+)', 'B (80-89)', 'C (70-79)', 'D (60-69)', 'F (<60)'],
    datasets: [{
      label: 'Distribution des Notes',
      data: [5, 12, 18, 7, 2], // Placeholder data
      backgroundColor: ['#1cc88a', '#4e73df', '#f6c23e', '#e74a3b', '#858796'],
    }],
  }

  const courseProgressData = {
    labels: courses?.map(c => c.nom) || [],
    datasets: [{
      label: 'Progression par Cours (%)',
      data: courses?.map(() => Math.floor(Math.random() * 100)) || [], // Placeholder data
      backgroundColor: 'rgba(78, 115, 223, 0.8)',
    }],
  }

  return (
    <>
      {/* Stat Cards */}
      <Row>
        <StatCard title="Moyenne Générale" value={stats.average_grade || 'N/A'} icon="fa-graduation-cap" color="primary" />
        <StatCard title="Crédits Obtenus" value={stats.total_credits_obtained || 0} icon="fa-award" color="success" />
        <StatCard title="Cours Validés" value={stats.validated_courses_count || 0} icon="fa-check-circle" color="info" />
        <StatCard title="Devoirs Rendus" value={stats.assignments_submitted || 0} icon="fa-file-alt" color="warning" />
      </Row>

      {/* Charts */}
      <Row>
        <Col xl={8} lg={7}>
          <Card className="shadow mb-4">
            <Card.Header className="py-3 d-flex flex-row align-items-center justify-content-between">
              <h6 className="m-0 fw-bold text-primary">Progression des Cours</h6>
            </Card.Header>
            <Card.Body>
              <div className="chart-bar" style={{ height: '320px' }}>
                <Bar data={courseProgressData} options={{ maintainAspectRatio: false }} />
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col xl={4} lg={5}>
          <Card className="shadow mb-4">
            <Card.Header className="py-3 d-flex flex-row align-items-center justify-content-between">
              <h6 className="m-0 fw-bold text-primary">Distribution des Notes</h6>
            </Card.Header>
            <Card.Body>
              <div className="chart-pie pt-4" style={{ height: '320px' }}>
                <Doughnut data={gradeDistributionData} options={{ maintainAspectRatio: false }} />
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
              <h6 className="m-0 fw-bold text-primary">Détails des Cours et Activités</h6>
            </Card.Header>
            <Card.Body>
              <Tabs defaultActiveKey="courses" id="student-details-tabs">
                <Tab eventKey="courses" title="Cours Inscrits">
                  <ListGroup variant="flush">
                    {courses?.length > 0 ? courses.map(course => (
                      <ListGroup.Item key={course.id}>
                        <Link to={`/courses/${course.id}`}>{course.nom}</Link>
                        <Badge bg="secondary" className="ms-2">{course.teacher_name}</Badge>
                      </ListGroup.Item>
                    )) : <ListGroup.Item>Aucun cours.</ListGroup.Item>}
                  </ListGroup>
                </Tab>
                <Tab eventKey="activity" title="Activité Récente">
                  {/* Placeholder for activity feed */}
                  <ListGroup variant="flush">
                    <ListGroup.Item>Quiz "Introduction à l'IA" complété - Score: 85%</ListGroup.Item>
                    <ListGroup.Item>Devoir "Analyse de cas" rendu.</ListGroup.Item>
                    <ListGroup.Item>Présence enregistrée pour le cours "Algorithmique".</ListGroup.Item>
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

export default StudentDashboard
