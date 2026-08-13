"use client"

import { useState } from "react"
import { Row, Col, Card, Badge, ListGroup, Tab, Tabs } from "react-bootstrap"
import { Link } from "react-router-dom"
import { Bar, Doughnut } from 'react-chartjs-2'
import { motion } from "framer-motion"
import { FiAward, FiCheckCircle, FiFileText, FiTrendingUp } from "react-icons/fi"

const StatCard = ({ title, value, icon: Icon, gradient }) => {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <Col md={6} lg={3} className="mb-4">
      <motion.div
        whileHover={{ y: -4 }}
        transition={{ duration: 0.2 }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Card style={{
          background: 'var(--color-cardBg)',
          border: '1px solid var(--color-border)',
          borderRadius: '16px',
          boxShadow: isHovered ? '0 8px 16px rgba(0,0,0,0.15)' : '0 4px 6px rgba(0,0,0,0.1)',
          transition: 'box-shadow 0.2s',
          height: '100%'
        }}>
          <Card.Body style={{ padding: '24px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px'
            }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                background: gradient,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 8px rgba(0,0,0,0.15)'
              }}>
                <Icon size={28} style={{ color: 'white' }} />
              </div>
            </div>
            <div style={{
              fontSize: '32px',
              fontWeight: '700',
              color: 'var(--color-text)',
              marginBottom: '4px'
            }}>
              {value}
            </div>
            <div style={{
              fontSize: '14px',
              color: 'var(--color-textSecondary)',
              fontWeight: '500'
            }}>
              {title}
            </div>
          </Card.Body>
        </Card>
      </motion.div>
    </Col>
  )
}

const StudentDashboard = ({ user }) => {
  // Access stats from the nested object
  const stats = user.student_stats || {}
  const { courses } = user

  const gradeDistribution = stats.grade_distribution || {}
  const gradeDistributionData = {
    labels: ['A (90+)', 'B (80-89)', 'C (70-79)', 'D (60-69)', 'F (<60)'],
    datasets: [{
      label: 'Distribution des Notes',
      data: [
        gradeDistribution.a || gradeDistribution.A || 0,
        gradeDistribution.b || gradeDistribution.B || 0,
        gradeDistribution.c || gradeDistribution.C || 0,
        gradeDistribution.d || gradeDistribution.D || 0,
        gradeDistribution.f || gradeDistribution.F || 0,
      ],
      backgroundColor: ['#1cc88a', '#4e73df', '#f6c23e', '#e74a3b', '#858796'],
    }],
  }

  const courseProgressData = {
    labels: courses?.map(c => c.nom) || [],
    datasets: [{
      label: 'Progression par Cours (%)',
      data: courses?.map(course => Number(course.progress || course.progress_percentage || 0)) || [],
      backgroundColor: 'rgba(78, 115, 223, 0.8)',
    }],
  }

  return (
    <>
      {/* Stat Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Row>
          <StatCard
            title="Moyenne Générale"
            value={stats.average_grade || 'N/A'}
            icon={FiTrendingUp}
            gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
          />
          <StatCard
            title="Quiz à Faire"
            value={stats.pending_quizzes || 0}
            icon={FiCheckCircle}
            gradient="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
          />
          <StatCard
            title="Cours Validés"
            value={stats.validated_courses_count || 0}
            icon={FiCheckCircle}
            gradient="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
          />
          <StatCard
            title="Devoirs Rendus"
            value={stats.assignments_submitted || 0}
            icon={FiFileText}
            gradient="linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)"
          />
        </Row>
      </motion.div>

      {/* Charts */}
      <Row>
        <Col xl={8} lg={7}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Card style={{
              background: 'var(--color-cardBg)',
              border: '1px solid var(--color-border)',
              borderRadius: '16px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              marginBottom: '24px'
            }}>
              <Card.Header style={{
                background: 'linear-gradient(135deg, var(--color-primary) 0%, #667eea 100%)',
                borderRadius: '16px 16px 0 0',
                padding: '20px 24px',
                border: 'none'
              }}>
                <h6 style={{ margin: 0, fontWeight: '700', fontSize: '18px', color: 'white' }}>
                  Progression des Cours
                </h6>
              </Card.Header>
              <Card.Body style={{ padding: '24px' }}>
                <div style={{ height: '320px' }}>
                  <Bar data={courseProgressData} options={{ maintainAspectRatio: false }} />
                </div>
              </Card.Body>
            </Card>
          </motion.div>
        </Col>
        <Col xl={4} lg={5}>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Card style={{
              background: 'var(--color-cardBg)',
              border: '1px solid var(--color-border)',
              borderRadius: '16px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              marginBottom: '24px'
            }}>
              <Card.Header style={{
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                borderRadius: '16px 16px 0 0',
                padding: '20px 24px',
                border: 'none'
              }}>
                <h6 style={{ margin: 0, fontWeight: '700', fontSize: '18px', color: 'white' }}>
                  Distribution des Notes
                </h6>
              </Card.Header>
              <Card.Body style={{ padding: '24px' }}>
                <div style={{ height: '320px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Doughnut data={gradeDistributionData} options={{ maintainAspectRatio: false }} />
                </div>
              </Card.Body>
            </Card>
          </motion.div>
        </Col>
      </Row>

      {/* Course List and Activities */}
      <Row>
        <Col>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <Card style={{
              background: 'var(--color-cardBg)',
              border: '1px solid var(--color-border)',
              borderRadius: '16px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}>
              <Card.Header style={{
                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                borderRadius: '16px 16px 0 0',
                padding: '20px 24px',
                border: 'none'
              }}>
                <h6 style={{ margin: 0, fontWeight: '700', fontSize: '18px', color: 'white' }}>
                  Détails des Cours et Activités
                </h6>
              </Card.Header>
              <Card.Body style={{ padding: '24px' }}>
                <Tabs defaultActiveKey="courses" id="student-details-tabs" className="mb-3">
                  <Tab eventKey="courses" title="Cours Inscrits">
                    <ListGroup variant="flush">
                      {courses?.length > 0 ? courses.map(course => (
                        <ListGroup.Item key={course.id} style={{
                          background: 'transparent',
                          border: 'none',
                          borderBottom: '1px solid var(--color-border)',
                          padding: '16px 0',
                          color: 'var(--color-text)'
                        }}>
                          <Link to={`/courses/${course.id}`} style={{
                            color: 'var(--color-primary)',
                            fontWeight: '600',
                            textDecoration: 'none'
                          }}>
                            {course.nom}
                          </Link>
                          <Badge style={{
                            background: '#858796',
                            marginLeft: '12px',
                            padding: '6px 12px',
                            borderRadius: '6px'
                          }}>
                            {course.teacher_name}
                          </Badge>
                        </ListGroup.Item>
                      )) : (
                        <ListGroup.Item style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--color-textSecondary)'
                        }}>
                          Aucun cours.
                        </ListGroup.Item>
                      )}
                    </ListGroup>
                  </Tab>
                  <Tab eventKey="activity" title="Activité Récente">
                    <ListGroup variant="flush">
                      <ListGroup.Item style={{
                        background: 'transparent',
                        border: 'none',
                        borderBottom: '1px solid var(--color-border)',
                        padding: '16px 0',
                        color: 'var(--color-text)'
                      }}>
                        Quiz "Introduction à l'IA" complété - Score: 85%
                      </ListGroup.Item>
                      <ListGroup.Item style={{
                        background: 'transparent',
                        border: 'none',
                        borderBottom: '1px solid var(--color-border)',
                        padding: '16px 0',
                        color: 'var(--color-text)'
                      }}>
                        Devoir "Analyse de cas" rendu.
                      </ListGroup.Item>
                      <ListGroup.Item style={{
                        background: 'transparent',
                        border: 'none',
                        padding: '16px 0',
                        color: 'var(--color-text)'
                      }}>
                        Présence enregistrée pour le cours "Algorithmique".
                      </ListGroup.Item>
                    </ListGroup>
                  </Tab>
                </Tabs>
              </Card.Body>
            </Card>
          </motion.div>
        </Col>
      </Row>
    </>
  )
}

export default StudentDashboard
