/**
 * 🚀 DASHBOARDS SIMPLES MODERNISÉS
 * Dashboards pour: ServiceIT, Apparitorat, Caisse, Bibliothécaire, Jury
 */

import { Container, Row, Col } from "react-bootstrap"
import { motion } from "framer-motion"
import StatCard from "../StatCard"
import CalendarWidget from "../CalendarWidget"
import ScheduleWidget from "../ScheduleWidget"
import RecentActivity from "../RecentActivity"
import { FiServer, FiTool, FiUsers, FiBook, FiFileText, FiDollarSign, FiCheckCircle } from "react-icons/fi"

// SERVICE IT DASHBOARD
export const ModernServiceITDashboard = ({ user }) => (
  <Container fluid style={{ padding: '24px', background: 'var(--color-bodyBg)', minHeight: '100vh' }}>
    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '32px' }}>
      <h2 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--color-textPrimary)', marginBottom: '8px' }}>Service IT 💻</h2>
      <p style={{ fontSize: '0.95rem', color: 'var(--color-textSecondary)', margin: 0 }}>Bienvenue {user?.name}</p>
    </motion.div>
    <Row className="mb-4">
      <Col xl={3} lg={6} className="mb-4"><StatCard title="Serveurs Actifs" value="12" icon={FiServer} color="success" delay={0} /></Col>
      <Col xl={3} lg={6} className="mb-4"><StatCard title="Tickets Ouverts" value="8" icon={FiTool} color="warning" delay={0.1} /></Col>
      <Col xl={3} lg={6} className="mb-4"><StatCard title="Utilisateurs" value="1,250" icon={FiUsers} color="primary" delay={0.2} /></Col>
      <Col xl={3} lg={6} className="mb-4"><StatCard title="Uptime" value="99.9%" icon={FiCheckCircle} color="info" delay={0.3} /></Col>
    </Row>
    <Row><Col xl={4} lg={12} className="mb-4"><CalendarWidget events={[{date: new Date()}]} delay={0.4} /></Col><Col xl={8} lg={12} className="mb-4"><RecentActivity activities={[{id:1,type:'check',title:'Serveur redémarré',description:'Maintenance programmée',time:'Il y a 1h'},{id:2,type:'user',title:'Nouveau ticket',description:'Problème connexion WiFi',time:'Il y a 2h'}]} delay={0.5} /></Col></Row>
  </Container>
)

// APPARITORAT DASHBOARD
export const ModernApparitoratDashboard = ({ user }) => (
  <Container fluid style={{ padding: '24px', background: 'var(--color-bodyBg)', minHeight: '100vh' }}>
    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '32px' }}>
      <h2 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--color-textPrimary)', marginBottom: '8px' }}>Apparitorat 🔔</h2>
      <p style={{ fontSize: '0.95rem', color: 'var(--color-textSecondary)', margin: 0 }}>Bienvenue {user?.name}</p>
    </motion.div>
    <Row className="mb-4">
      <Col xl={3} lg={6} className="mb-4"><StatCard title="Salles Disponibles" value="24" icon={FiCheckCircle} color="success" delay={0} /></Col>
      <Col xl={3} lg={6} className="mb-4"><StatCard title="Salles Occupées" value="18" icon={FiUsers} color="primary" delay={0.1} /></Col>
      <Col xl={3} lg={6} className="mb-4"><StatCard title="Cours Aujourd'hui" value="45" icon={FiBook} color="info" delay={0.2} /></Col>
      <Col xl={3} lg={6} className="mb-4"><StatCard title="Incidents" value="2" icon={FiTool} color="warning" delay={0.3} /></Col>
    </Row>
    <Row><Col xl={4} lg={12} className="mb-4"><CalendarWidget events={[{date: new Date()}]} delay={0.4} /></Col><Col xl={8} lg={12} className="mb-4"><ScheduleWidget schedule={[{title:'Nettoyage Amphi A',description:'Maintenance',time:'7:00 AM',badge:'Entretien',color:'var(--color-success)'}]} delay={0.5} /></Col></Row>
  </Container>
)

// CAISSE COMPTABILITÉ DASHBOARD
export const ModernCaisseDashboard = ({ user }) => (
  <Container fluid style={{ padding: '24px', background: 'var(--color-bodyBg)', minHeight: '100vh' }}>
    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '32px' }}>
      <h2 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--color-textPrimary)', marginBottom: '8px' }}>Caisse & Comptabilité 💵</h2>
      <p style={{ fontSize: '0.95rem', color: 'var(--color-textSecondary)', margin: 0 }}>Bienvenue {user?.name}</p>
    </motion.div>
    <Row className="mb-4">
      <Col xl={3} lg={6} className="mb-4"><StatCard title="Recettes Jour" value="125K FC" icon={FiDollarSign} color="success" delay={0} /></Col>
      <Col xl={3} lg={6} className="mb-4"><StatCard title="Paiements Traités" value="45" icon={FiCheckCircle} color="primary" delay={0.1} /></Col>
      <Col xl={3} lg={6} className="mb-4"><StatCard title="En Attente" value="12" icon={FiFileText} color="warning" delay={0.2} /></Col>
      <Col xl={3} lg={6} className="mb-4"><StatCard title="Solde Caisse" value="2.5M FC" icon={FiDollarSign} color="info" delay={0.3} /></Col>
    </Row>
    <Row><Col xl={4} lg={12} className="mb-4"><CalendarWidget events={[{date: new Date()}]} delay={0.4} /></Col><Col xl={8} lg={12} className="mb-4"><RecentActivity activities={[{id:1,type:'check',title:'Paiement reçu',description:'Frais inscription - 150K FC',time:'Il y a 5min'},{id:2,type:'file',title:'Reçu généré',description:'Transaction #1234',time:'Il y a 15min'}]} delay={0.5} /></Col></Row>
  </Container>
)

// BIBLIOTHÉCAIRE DASHBOARD
export const ModernBibliothecaireDashboard = ({ user }) => (
  <Container fluid style={{ padding: '24px', background: 'var(--color-bodyBg)', minHeight: '100vh' }}>
    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '32px' }}>
      <h2 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--color-textPrimary)', marginBottom: '8px' }}>Bibliothèque 📚</h2>
      <p style={{ fontSize: '0.95rem', color: 'var(--color-textSecondary)', margin: 0 }}>Bienvenue {user?.name}</p>
    </motion.div>
    <Row className="mb-4">
      <Col xl={3} lg={6} className="mb-4"><StatCard title="Livres Total" value="5,420" icon={FiBook} color="primary" delay={0} /></Col>
      <Col xl={3} lg={6} className="mb-4"><StatCard title="Emprunts Actifs" value="234" icon={FiCheckCircle} color="success" delay={0.1} /></Col>
      <Col xl={3} lg={6} className="mb-4"><StatCard title="Retards" value="8" icon={FiFileText} color="warning" delay={0.2} /></Col>
      <Col xl={3} lg={6} className="mb-4"><StatCard title="Nouveaux Livres" value="45" icon={FiBook} color="info" delay={0.3} /></Col>
    </Row>
    <Row><Col xl={4} lg={12} className="mb-4"><CalendarWidget events={[{date: new Date()}]} delay={0.4} /></Col><Col xl={8} lg={12} className="mb-4"><RecentActivity activities={[{id:1,type:'check',title:'Livre emprunté',description:'Mathématiques Avancées',time:'Il y a 10min'},{id:2,type:'user',title:'Livre retourné',description:'Physique Quantique',time:'Il y a 30min'}]} delay={0.5} /></Col></Row>
  </Container>
)

// JURY DASHBOARD
export const ModernJuryDashboard = ({ user }) => (
  <Container fluid style={{ padding: '24px', background: 'var(--color-bodyBg)', minHeight: '100vh' }}>
    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '32px' }}>
      <h2 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--color-textPrimary)', marginBottom: '8px' }}>Jury & Délibérations 🎓</h2>
      <p style={{ fontSize: '0.95rem', color: 'var(--color-textSecondary)', margin: 0 }}>Bienvenue {user?.name}</p>
    </motion.div>
    <Row className="mb-4">
      <Col xl={3} lg={6} className="mb-4"><StatCard title="Étudiants à Évaluer" value="156" icon={FiUsers} color="primary" delay={0} /></Col>
      <Col xl={3} lg={6} className="mb-4"><StatCard title="Délibérations" value="12" icon={FiFileText} color="warning" delay={0.1} /></Col>
      <Col xl={3} lg={6} className="mb-4"><StatCard title="Résultats Publiés" value="89" icon={FiCheckCircle} color="success" delay={0.2} /></Col>
      <Col xl={3} lg={6} className="mb-4"><StatCard title="Réussites" value="87%" icon={FiCheckCircle} color="info" delay={0.3} /></Col>
    </Row>
    <Row><Col xl={4} lg={12} className="mb-4"><CalendarWidget events={[{date: new Date()}]} delay={0.4} /></Col><Col xl={8} lg={12} className="mb-4"><ScheduleWidget schedule={[{title:'Délibération Licence 3',description:'Jury de fin de semestre',time:'2:00 PM - 5:00 PM',badge:'Délibération',color:'var(--color-primary)'}]} delay={0.5} /></Col></Row>
  </Container>
)
