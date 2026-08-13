"use client"

import { useState } from "react"
import { Row, Col, Card, Badge, ListGroup, Tab, Tabs } from "react-bootstrap"
import { Link } from "react-router-dom"
import { Bar, Line } from 'react-chartjs-2'
import { motion } from "framer-motion"
import { FiUsers, FiTrendingUp, FiBookOpen } from "react-icons/fi"

const StatCard = ({ title, value, icon: Icon, gradient }) => {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <Col md={6} lg={4} className="mb-4">
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

const TeacherDashboard = ({ user }) => {
  // Access stats from the nested object
  const stats = user.teacher_stats || {}
  const courses = user.courses || []

  // Debug: Log courses to check data
  console.log('TeacherDashboard - courses:', courses)
  console.log('TeacherDashboard - stats:', stats)

  // --- Chart Data ---
  const studentPerformanceData = {
    labels: courses.map(c => c.nom || c.name || 'Sans nom'),
    datasets: [{
      label: 'Progression Moyenne par Cours (%)',
      data: courses.map(c => c.progress_percentage || 0),
      backgroundColor: 'rgba(28, 200, 138, 0.8)',
    }],
  }

  const attendanceData = {
    labels: courses.map(c => c.nom || c.name || 'Sans nom'),
    datasets: [{
      label: 'Taux de Présence par Cours (%)',
      data: courses.map(c => c.attendance_rate || 0),
      fill: false,
      borderColor: 'rgba(78, 115, 223, 1)',
      tension: 0.1,
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
            title="Cours Enseignés"
            value={stats.courses_taught_count || 0}
            icon={FiBookOpen}
            gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
          />
          <StatCard
            title="Étudiants Gérés"
            value={stats.total_students_managed || 0}
            icon={FiUsers}
            gradient="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
          />
          <StatCard
            title="Performance Moyenne"
            value={`${stats.average_student_performance || 0}%`}
            icon={FiTrendingUp}
            gradient="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
          />
        </Row>
      </motion.div>

      {/* Charts */}
      <Row>
        <Col xl={6} lg={6}>
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
                  Performance par Cours
                </h6>
              </Card.Header>
              <Card.Body style={{ padding: '24px' }}>
                <div style={{ height: '320px' }}>
                  <Bar data={studentPerformanceData} options={{ maintainAspectRatio: false }} />
                </div>
              </Card.Body>
            </Card>
          </motion.div>
        </Col>
        <Col xl={6} lg={6}>
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
                  Suivi des Présences
                </h6>
              </Card.Header>
              <Card.Body style={{ padding: '24px' }}>
                <div style={{ height: '320px' }}>
                  <Line data={attendanceData} options={{ maintainAspectRatio: false }} />
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
                  Mes Cours et Activités
                </h6>
              </Card.Header>
              <Card.Body style={{ padding: '24px' }}>
                <Tabs defaultActiveKey="courses" id="teacher-details-tabs" className="mb-3">
                  <Tab eventKey="courses" title="Liste des Cours">
                    <ListGroup variant="flush">
                      {courses && courses.length > 0 ? courses.map(course => (
                        <ListGroup.Item key={course.id} style={{
                          background: 'transparent',
                          border: 'none',
                          borderBottom: '1px solid var(--color-border)',
                          padding: '16px 0',
                          color: 'var(--color-text)'
                        }}>
                          <div style={{ marginBottom: '8px' }}>
                            <Link to={`/courses/${course.id}`} style={{
                              color: 'var(--color-primary)',
                              fontWeight: '600',
                              textDecoration: 'none',
                              fontSize: '16px'
                            }}>
                              {course.nom || course.name || 'Sans nom'}
                            </Link>
                            <Badge style={{
                              background: '#36b9cc',
                              marginLeft: '12px',
                              padding: '6px 12px',
                              borderRadius: '6px'
                            }}>
                              {course.auditoire_detail?.nom || 'N/A'}
                            </Badge>
                          </div>
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            <Badge style={{
                              background: '#4e73df',
                              padding: '6px 12px',
                              borderRadius: '6px'
                            }}>
                              👥 {course.students_count || 0} étudiants
                            </Badge>
                            <Badge style={{
                              background: '#1cc88a',
                              padding: '6px 12px',
                              borderRadius: '6px'
                            }}>
                              📈 {course.progress_percentage || 0}% progression
                            </Badge>
                            <Badge style={{
                              background: '#f6c23e',
                              padding: '6px 12px',
                              borderRadius: '6px'
                            }}>
                              ✓ {course.attendance_rate || 0}% présence
                            </Badge>
                            <Badge style={{
                              background: '#858796',
                              padding: '6px 12px',
                              borderRadius: '6px'
                            }}>
                              {course.role === 'titulaire' ? '👨‍🏫 Titulaire' : '🤝 Assistant'}
                            </Badge>
                          </div>
                        </ListGroup.Item>
                      )) : (
                        <ListGroup.Item style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--color-textSecondary)',
                          padding: '20px',
                          textAlign: 'center'
                        }}>
                          Aucun cours assigné.
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
                        Devoir "Projet Final" ajouté au cours "Génie Logiciel".
                      </ListGroup.Item>
                      <ListGroup.Item style={{
                        background: 'transparent',
                        border: 'none',
                        borderBottom: '1px solid var(--color-border)',
                        padding: '16px 0',
                        color: 'var(--color-text)'
                      }}>
                        Correction de 15 soumissions pour le TP 2.
                      </ListGroup.Item>
                      <ListGroup.Item style={{
                        background: 'transparent',
                        border: 'none',
                        padding: '16px 0',
                        color: 'var(--color-text)'
                      }}>
                        Quiz "Chapitre 5" créé pour l'auditoire L3.
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

export default TeacherDashboard
