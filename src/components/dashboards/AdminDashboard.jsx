import { Container, Row, Col } from "react-bootstrap"
import { LinkContainer } from "react-router-bootstrap"
import { motion } from "framer-motion"
import StatCard from "../StatCard"
import ChartCard from "../ChartCard"
import CalendarWidget from "../CalendarWidget"
import ScheduleWidget from "../ScheduleWidget"
import RecentActivity from "../RecentActivity"
import { FiUsers, FiDollarSign, FiTrendingUp, FiAward, FiBriefcase, FiCheckCircle } from "react-icons/fi"

const AdminDashboard = ({ user, courses, notifications }) => {
  const totalStudents = 1250
  const totalTeachers = 85
  const totalRevenue = 125000
  const pendingPayments = 45

  const isDirectorGeneral = user?.role === "directeur_general"
  const isPDG = user?.role === "pdg"

  // Données pour graphique revenus
  const revenueData = {
    labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'],
    datasets: [{
      label: 'Revenus ($)',
      data: [95000, 102000, 108000, 115000, 120000, 125000],
      borderColor: 'rgb(28, 200, 138)',
      backgroundColor: 'rgba(28, 200, 138, 0.1)',
      tension: 0.4,
      fill: true,
      pointBackgroundColor: 'rgb(28, 200, 138)',
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointRadius: 5,
    }, {
      label: 'Dépenses ($)',
      data: [75000, 78000, 82000, 85000, 88000, 90000],
      borderColor: 'rgb(231, 74, 59)',
      backgroundColor: 'rgba(231, 74, 59, 0.1)',
      tension: 0.4,
      fill: true,
      pointBackgroundColor: 'rgb(231, 74, 59)',
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointRadius: 5,
    }]
  }

  // Données pour graphique étudiants
  const studentsData = {
    labels: ['L1', 'L2', 'L3', 'M1', 'M2'],
    datasets: [{
      label: 'Étudiants',
      data: [320, 280, 250, 220, 180],
      backgroundColor: [
        'rgba(78, 115, 223, 0.8)',
        'rgba(28, 200, 138, 0.8)',
        'rgba(246, 194, 62, 0.8)',
        'rgba(231, 74, 59, 0.8)',
        'rgba(111, 66, 193, 0.8)',
      ],
      borderWidth: 0,
    }]
  }

  // Planning direction
  const adminSchedule = [
    {
      title: "Réunion Conseil d'Administration",
      description: "Budget 2024 et projets stratégiques",
      time: "9:00 AM - 11:00 AM",
      location: "Salle de Conseil",
      participants: "Direction et membres CA",
      badge: "Réunion",
      color: "var(--color-primary)",
    },
    {
      title: "Rencontre Chefs de Département",
      description: "Bilan académique du semestre",
      time: "2:00 PM - 4:00 PM",
      location: "Amphithéâtre Principal",
      participants: "Tous les chefs",
      badge: "Académique",
      badgeColor: "rgba(28, 200, 138, 0.1)",
      badgeTextColor: "var(--color-success)",
      color: "var(--color-success)",
    },
    {
      title: "Audit Financier",
      description: "Vérification trimestrielle",
      time: "4:30 PM - 6:00 PM",
      location: "Bureau Direction",
      participants: "Auditeur externe",
      badge: "Finance",
      badgeColor: "rgba(246, 194, 62, 0.1)",
      badgeTextColor: "var(--color-warning)",
      color: "var(--color-warning)",
    }
  ]

  // Activités récentes
  const recentActivities = [
    {
      id: 1,
      type: "check",
      title: "Budget approuvé",
      description: "Le budget pour le nouveau département IT a été validé - Montant: $150,000",
      time: "Il y a 1h",
      badge: "Finance",
      badgeColor: "var(--color-primaryLight)",
      badgeTextColor: "var(--color-primary)",
    },
    {
      id: 2,
      type: "user",
      title: "Nouveau partenariat",
      description: "Accord signé avec l'Université de Paris pour échanges étudiants",
      time: "Il y a 3h",
    },
    {
      id: 3,
      type: "award",
      title: "Accréditation renouvelée",
      description: "L'université a obtenu le renouvellement de son accréditation nationale",
      time: "Il y a 1 jour",
    },
    {
      id: 4,
      type: "trending",
      title: "Taux de réussite en hausse",
      description: "Le taux de réussite global est passé à 87% (+4% vs année dernière)",
      time: "Il y a 2 jours",
    }
  ]

  return (
    <Container fluid style={{ padding: '24px', background: 'var(--color-bodyBg)', minHeight: '100vh' }}>
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ marginBottom: '32px' }}
      >
        <h2 style={{
          fontSize: '1.75rem',
          fontWeight: '700',
          color: 'var(--color-textPrimary)',
          marginBottom: '8px',
        }}>
          {isPDG ? "PDG - Conseil d'Administration 👔" : "Direction Générale 🏢"}
        </h2>
        <p style={{
          fontSize: '0.95rem',
          color: 'var(--color-textSecondary)',
          margin: 0,
        }}>
          Bienvenue {user?.name} | Supervision {isPDG ? "Stratégique" : "Opérationnelle"}
        </p>
      </motion.div>

      {/* Executive Stats */}
      <Row className="mb-4">
        <Col xl={3} lg={6} md={6} sm={12} className="mb-4">
          <StatCard
            title="Étudiants Totaux"
            value={totalStudents.toLocaleString()}
            icon={FiUsers}
            color="primary"
            trend="up"
            trendValue="+8% ce semestre"
            delay={0}
          />
        </Col>
        <Col xl={3} lg={6} md={6} sm={12} className="mb-4">
          <StatCard
            title="Personnel Enseignant"
            value={totalTeachers.toString()}
            icon={FiBriefcase}
            color="info"
            trend="up"
            trendValue="+5 ce mois"
            delay={0.1}
          />
        </Col>
        <Col xl={3} lg={6} md={6} sm={12} className="mb-4">
          <StatCard
            title="Revenus Mensuels"
            value={`$${(totalRevenue / 1000).toFixed(0)}K`}
            icon={FiDollarSign}
            color="success"
            trend="up"
            trendValue="+12% vs mois dernier"
            delay={0.2}
          />
        </Col>
        <Col xl={3} lg={6} md={6} sm={12} className="mb-4">
          <StatCard
            title="Taux de Réussite"
            value="87%"
            icon={FiAward}
            color="warning"
            trend="up"
            trendValue="+4% vs année dernière"
            delay={0.3}
          />
        </Col>
      </Row>

      {/* Graphiques principaux */}
      <Row className="mb-4">
        <Col xl={8} lg={7} className="mb-4">
          <ChartCard
            title="Revenus vs Dépenses"
            subtitle="6 derniers mois"
            chartType="line"
            data={revenueData}
            delay={0.4}
            height={320}
          />
        </Col>
        <Col xl={4} lg={5} className="mb-4">
          <ChartCard
            title="Étudiants par Niveau"
            subtitle="Répartition actuelle"
            chartType="doughnut"
            data={studentsData}
            delay={0.5}
            height={320}
          />
        </Col>
      </Row>

      {/* KPIs Détaillés */}
      <Row className="mb-4">
        <Col lg={12}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.4 }}
            style={{
              background: 'var(--color-cardBg)',
              border: '1px solid var(--color-cardBorder)',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: 'var(--color-cardShadow)',
            }}
          >
            <h5 style={{
              margin: 0,
              fontSize: '1.1rem',
              fontWeight: '700',
              color: 'var(--color-textPrimary)',
              marginBottom: '20px',
            }}>
              Indicateurs Clés de Performance
            </h5>
            <Row>
              <Col md={3} className="mb-3">
                <div style={{
                  padding: '16px',
                  background: 'var(--color-bodyBg)',
                  borderRadius: '10px',
                  textAlign: 'center',
                }}>
                  <h3 style={{
                    fontSize: '2rem',
                    fontWeight: '700',
                    color: 'var(--color-success)',
                    margin: '0 0 8px 0',
                  }}>94%</h3>
                  <p style={{
                    fontSize: '0.85rem',
                    color: 'var(--color-textSecondary)',
                    margin: 0,
                  }}>Taux de rétention</p>
                </div>
              </Col>
              <Col md={3} className="mb-3">
                <div style={{
                  padding: '16px',
                  background: 'var(--color-bodyBg)',
                  borderRadius: '10px',
                  textAlign: 'center',
                }}>
                  <h3 style={{
                    fontSize: '2rem',
                    fontWeight: '700',
                    color: 'var(--color-primary)',
                    margin: '0 0 8px 0',
                  }}>4.1/5</h3>
                  <p style={{
                    fontSize: '0.85rem',
                    color: 'var(--color-textSecondary)',
                    margin: 0,
                  }}>Satisfaction étudiants</p>
                </div>
              </Col>
              <Col md={3} className="mb-3">
                <div style={{
                  padding: '16px',
                  background: 'var(--color-bodyBg)',
                  borderRadius: '10px',
                  textAlign: 'center',
                }}>
                  <h3 style={{
                    fontSize: '2rem',
                    fontWeight: '700',
                    color: 'var(--color-info)',
                    margin: '0 0 8px 0',
                  }}>91%</h3>
                  <p style={{
                    fontSize: '0.85rem',
                    color: 'var(--color-textSecondary)',
                    margin: 0,
                  }}>Employabilité diplômés</p>
                </div>
              </Col>
              <Col md={3} className="mb-3">
                <div style={{
                  padding: '16px',
                  background: 'var(--color-bodyBg)',
                  borderRadius: '10px',
                  textAlign: 'center',
                }}>
                  <h3 style={{
                    fontSize: '2rem',
                    fontWeight: '700',
                    color: 'var(--color-warning)',
                    margin: '0 0 8px 0',
                  }}>156%</h3>
                  <p style={{
                    fontSize: '0.85rem',
                    color: 'var(--color-textSecondary)',
                    margin: 0,
                  }}>ROI Formation</p>
                </div>
              </Col>
            </Row>
          </motion.div>
        </Col>
      </Row>

      {/* Calendrier, Planning et Activités */}
      <Row className="mb-4">
        <Col xl={4} lg={12} className="mb-4">
          <CalendarWidget
            events={[
              { date: new Date() },
              { date: new Date(Date.now() + 86400000 * 3) },
              { date: new Date(Date.now() + 86400000 * 7) },
            ]}
            delay={0.7}
          />
        </Col>
        <Col xl={4} lg={6} className="mb-4">
          <ScheduleWidget
            schedule={adminSchedule}
            date={new Date()}
            delay={0.8}
          />
        </Col>
        <Col xl={4} lg={6} className="mb-4">
          <RecentActivity
            activities={recentActivities}
            delay={0.9}
          />
        </Col>
      </Row>

      {/* Décisions Pendantes - Si PDG */}
      {isPDG && (
        <Row className="mb-4">
          <Col lg={12}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0, duration: 0.4 }}
              style={{
                background: 'var(--color-cardBg)',
                border: '1px solid var(--color-cardBorder)',
                borderRadius: '12px',
                padding: '20px',
                boxShadow: 'var(--color-cardShadow)',
              }}
            >
              <h5 style={{
                margin: 0,
                fontSize: '1.1rem',
                fontWeight: '700',
                color: 'var(--color-textPrimary)',
                marginBottom: '20px',
              }}>
                Décisions Pendantes
              </h5>
              <Row>
                <Col md={6} className="mb-3">
                  <div style={{
                    padding: '16px',
                    background: 'var(--color-bodyBg)',
                    borderRadius: '10px',
                    borderLeft: '4px solid var(--color-warning)',
                  }}>
                    <h6 style={{
                      fontSize: '1rem',
                      fontWeight: '700',
                      color: 'var(--color-textPrimary)',
                      marginBottom: '8px',
                    }}>
                      Nouvelle Section IT
                    </h6>
                    <p style={{
                      fontSize: '0.85rem',
                      color: 'var(--color-textSecondary)',
                      marginBottom: '12px',
                    }}>
                      Validation budget et recrutement - Budget: $150,000
                    </p>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        style={{
                          flex: 1,
                          background: 'var(--color-success)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '8px',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          fontWeight: '600',
                        }}
                      >
                        Approuver
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        style={{
                          flex: 1,
                          background: 'transparent',
                          color: 'var(--color-textSecondary)',
                          border: '1px solid var(--color-border)',
                          borderRadius: '6px',
                          padding: '8px',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          fontWeight: '600',
                        }}
                      >
                        Réviser
                      </motion.button>
                    </div>
                  </div>
                </Col>
                <Col md={6} className="mb-3">
                  <div style={{
                    padding: '16px',
                    background: 'var(--color-bodyBg)',
                    borderRadius: '10px',
                    borderLeft: '4px solid var(--color-info)',
                  }}>
                    <h6 style={{
                      fontSize: '1rem',
                      fontWeight: '700',
                      color: 'var(--color-textPrimary)',
                      marginBottom: '8px',
                    }}>
                      Augmentation Frais
                    </h6>
                    <p style={{
                      fontSize: '0.85rem',
                      color: 'var(--color-textSecondary)',
                      marginBottom: '12px',
                    }}>
                      Proposition +15% pour 2024 - Impact: +$1.5M de revenus
                    </p>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        style={{
                          flex: 1,
                          background: 'var(--color-success)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '8px',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          fontWeight: '600',
                        }}
                      >
                        Approuver
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        style={{
                          flex: 1,
                          background: 'transparent',
                          color: 'var(--color-textSecondary)',
                          border: '1px solid var(--color-border)',
                          borderRadius: '6px',
                          padding: '8px',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          fontWeight: '600',
                        }}
                      >
                        Réviser
                      </motion.button>
                    </div>
                  </div>
                </Col>
              </Row>
            </motion.div>
          </Col>
        </Row>
      )}
    </Container>
  )
}

export default AdminDashboard
