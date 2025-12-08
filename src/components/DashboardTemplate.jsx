/**
 * 📋 DASHBOARD TEMPLATE - Template réutilisable
 * ============================================
 * Template pour créer rapidement des dashboards modernes
 */

import { Container, Row, Col } from "react-bootstrap"
import { motion } from "framer-motion"
import StatCard from "./StatCard"
import ChartCard from "./ChartCard"
import CalendarWidget from "./CalendarWidget"
import ScheduleWidget from "./ScheduleWidget"
import RecentActivity from "./RecentActivity"

/**
 * Utilisez ce template pour créer de nouveaux dashboards
 *
 * @param {string} title - Titre du dashboard
 * @param {string} subtitle - Sous-titre
 * @param {Array} stats - Tableau de statistiques [{title, value, icon, color, trend, trendValue}]
 * @param {Object} chartData1 - Données pour le premier graphique
 * @param {Object} chartData2 - Données pour le deuxième graphique
 * @param {Array} schedule - Planning de la journée
 * @param {Array} activities - Activités récentes
 * @param {ReactNode} children - Contenu supplémentaire
 */
const DashboardTemplate = ({
  title,
  subtitle,
  stats = [],
  chartData1,
  chartData2,
  schedule = [],
  activities = [],
  children
}) => {
  return (
    <Container fluid style={{ padding: '24px', background: 'var(--color-bodyBg)', minHeight: '100vh' }}>
      {/* Header */}
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
          {title}
        </h2>
        <p style={{
          fontSize: '0.95rem',
          color: 'var(--color-textSecondary)',
          margin: 0,
        }}>
          {subtitle}
        </p>
      </motion.div>

      {/* Statistics Cards */}
      {stats.length > 0 && (
        <Row className="mb-4">
          {stats.map((stat, index) => (
            <Col key={index} xl={3} lg={6} md={6} sm={12} className="mb-4">
              <StatCard {...stat} delay={index * 0.1} />
            </Col>
          ))}
        </Row>
      )}

      {/* Charts */}
      {(chartData1 || chartData2) && (
        <Row className="mb-4">
          {chartData1 && (
            <Col xl={chartData2 ? 8 : 12} lg={chartData2 ? 7 : 12} className="mb-4">
              <ChartCard {...chartData1} delay={0.4} height={300} />
            </Col>
          )}
          {chartData2 && (
            <Col xl={4} lg={5} className="mb-4">
              <ChartCard {...chartData2} delay={0.5} height={300} />
            </Col>
          )}
        </Row>
      )}

      {/* Calendar, Schedule, Activities */}
      {(schedule.length > 0 || activities.length > 0) && (
        <Row className="mb-4">
          <Col xl={4} lg={12} className="mb-4">
            <CalendarWidget
              events={[
                { date: new Date() },
                { date: new Date(Date.now() + 86400000 * 3) },
                { date: new Date(Date.now() + 86400000 * 7) },
              ]}
              delay={0.6}
            />
          </Col>
          {schedule.length > 0 && (
            <Col xl={4} lg={6} className="mb-4">
              <ScheduleWidget
                schedule={schedule}
                date={new Date()}
                delay={0.7}
              />
            </Col>
          )}
          {activities.length > 0 && (
            <Col xl={4} lg={6} className="mb-4">
              <RecentActivity
                activities={activities}
                delay={0.8}
              />
            </Col>
          )}
        </Row>
      )}

      {/* Custom Content */}
      {children}
    </Container>
  )
}

export default DashboardTemplate
