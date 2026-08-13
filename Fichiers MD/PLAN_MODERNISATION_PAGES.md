# 🎨 PLAN DE MODERNISATION - GUIDE PRATIQUE PAR PAGE

## 🎯 OBJECTIF
Transformer toutes les 26 pages restantes avec le design moderne inspiré d'Acadex, en conservant 100% des fonctionnalités.

---

## 📋 TEMPLATE DE MODERNISATION

### Structure Standard d'une Page Moderne

```jsx
import { Container, Row, Col } from "react-bootstrap"
import { motion } from "framer-motion"
import { FiIcon1, FiIcon2 } from "react-icons/fi"
import StatCard from "../components/StatCard"
import ChartCard from "../components/ChartCard"
import CalendarWidget from "../components/CalendarWidget"
import ScheduleWidget from "../components/ScheduleWidget"
import RecentActivity from "../components/RecentActivity"

const ModernPage = () => {
  // State & data fetching

  return (
    <Container fluid style={{ padding: '24px', background: 'var(--color-bodyBg)', minHeight: '100vh' }}>
      {/* Header animé */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ marginBottom: '32px' }}
      >
        <h2 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--color-textPrimary)' }}>
          Titre de la Page
        </h2>
        <p style={{ fontSize: '0.95rem', color: 'var(--color-textSecondary)' }}>
          Description
        </p>
      </motion.div>

      {/* StatCards */}
      <Row className="mb-4">
        <Col xl={3} lg={6} md={6} sm={12} className="mb-4">
          <StatCard title="Stat 1" value="123" icon={FiIcon1} color="primary" delay={0} />
        </Col>
        {/* ... autres StatCards */}
      </Row>

      {/* Graphiques */}
      <Row className="mb-4">
        <Col lg={6} className="mb-4">
          <ChartCard title="Graph 1" chartType="line" data={data1} delay={0.4} />
        </Col>
        <Col lg={6} className="mb-4">
          <ChartCard title="Graph 2" chartType="bar" data={data2} delay={0.5} />
        </Col>
      </Row>

      {/* Widgets */}
      <Row className="mb-4">
        <Col xl={4} lg={12} className="mb-4">
          <CalendarWidget events={events} delay={0.6} />
        </Col>
        <Col xl={4} lg={6} className="mb-4">
          <ScheduleWidget schedule={schedule} delay={0.7} />
        </Col>
        <Col xl={4} lg={6} className="mb-4">
          <RecentActivity activities={activities} delay={0.8} />
        </Col>
      </Row>
    </Container>
  )
}
```

---

## 🔥 PAGES PAR PRIORITÉ

### PHASE 1: DASHBOARDS SIMPLES (Priorité CRITIQUE)

#### ✅ Tâche Immédiate: Moderniser 5 dashboards simples

**1. ServiceITDashboard.jsx**
```jsx
// Remplacer le contenu par:
import { Container, Row, Col } from "react-bootstrap"
import { motion } from "framer-motion"
import { FiAlertCircle, FiCheckCircle, FiClock, FiTool } from "react-icons/fi"
import StatCard from "../StatCard"
import ChartCard from "../ChartCard"

const ServiceITDashboard = ({ user }) => {
  const ticketsData = {
    labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'],
    datasets: [{
      label: 'Tickets résolus',
      data: [12, 19, 15, 25, 22, 30],
      borderColor: 'rgba(28, 200, 138, 1)',
      backgroundColor: 'rgba(28, 200, 138, 0.1)',
      tension: 0.4,
      fill: true,
    }]
  }

  return (
    <Container fluid style={{ padding: '24px', background: 'var(--color-bodyBg)', minHeight: '100vh' }}>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--color-textPrimary)' }}>
          Service IT 🔧
        </h2>
        <p style={{ fontSize: '0.95rem', color: 'var(--color-textSecondary)' }}>
          Bienvenue {user?.name} | Support Technique
        </p>
      </motion.div>

      <Row className="mb-4">
        <Col xl={3} lg={6} className="mb-4">
          <StatCard title="Tickets Ouverts" value="12" icon={FiAlertCircle} color="warning" delay={0} />
        </Col>
        <Col xl={3} lg={6} className="mb-4">
          <StatCard title="En Cours" value="5" icon={FiClock} color="info" delay={0.1} />
        </Col>
        <Col xl={3} lg={6} className="mb-4">
          <StatCard title="Résolus" value="28" icon={FiCheckCircle} color="success" delay={0.2} />
        </Col>
        <Col xl={3} lg={6} className="mb-4">
          <StatCard title="Temps Moyen" value="2.5h" icon={FiTool} color="primary" delay={0.3} />
        </Col>
      </Row>

      <Row className="mb-4">
        <Col lg={12}>
          <ChartCard title="Résolution des Tickets" subtitle="6 derniers mois" chartType="line" data={ticketsData} delay={0.4} height={300} />
        </Col>
      </Row>
    </Container>
  )
}

export default ServiceITDashboard
```

**2. ApparitoratDashboard.jsx**
```jsx
import { Container, Row, Col } from "react-bootstrap"
import { motion } from "framer-motion"
import { FiHome, FiCheckCircle, FiClock, FiPercent } from "react-icons/fi"
import StatCard from "../StatCard"
import ChartCard from "../ChartCard"

const ApparitoratDashboard = ({ user }) => {
  const reservationsData = {
    labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'],
    datasets: [{
      label: 'Réservations',
      data: [15, 22, 18, 25, 20, 12],
      backgroundColor: 'rgba(78, 115, 223, 0.8)',
    }]
  }

  return (
    <Container fluid style={{ padding: '24px', background: 'var(--color-bodyBg)', minHeight: '100vh' }}>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--color-textPrimary)' }}>
          Apparitorat 🏫
        </h2>
        <p style={{ fontSize: '0.95rem', color: 'var(--color-textSecondary)' }}>
          Bienvenue {user?.name} | Gestion des Salles
        </p>
      </motion.div>

      <Row className="mb-4">
        <Col xl={3} lg={6} className="mb-4">
          <StatCard title="Salles Totales" value="45" icon={FiHome} color="primary" delay={0} />
        </Col>
        <Col xl={3} lg={6} className="mb-4">
          <StatCard title="Réservations Confirmées" value="32" icon={FiCheckCircle} color="success" delay={0.1} />
        </Col>
        <Col xl={3} lg={6} className="mb-4">
          <StatCard title="En Attente" value="8" icon={FiClock} color="warning" delay={0.2} />
        </Col>
        <Col xl={3} lg={6} className="mb-4">
          <StatCard title="Taux d'Occupation" value="71%" icon={FiPercent} color="info" delay={0.3} />
        </Col>
      </Row>

      <Row className="mb-4">
        <Col lg={12}>
          <ChartCard title="Réservations par Jour" subtitle="Cette semaine" chartType="bar" data={reservationsData} delay={0.4} height={300} />
        </Col>
      </Row>
    </Container>
  )
}

export default ApparitoratDashboard
```

**3. CaisseComptabiliteDashboard.jsx**
```jsx
import { Container, Row, Col } from "react-bootstrap"
import { motion } from "framer-motion"
import { FiDollarSign, FiTrendingUp, FiTrendingDown, FiClock } from "react-icons/fi"
import StatCard from "../StatCard"
import ChartCard from "../ChartCard"

const CaisseComptabiliteDashboard = ({ user }) => {
  const financeData = {
    labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'],
    datasets: [
      {
        label: 'Recettes',
        data: [45000, 52000, 48000, 58000, 62000, 65000],
        borderColor: 'rgba(28, 200, 138, 1)',
        backgroundColor: 'rgba(28, 200, 138, 0.1)',
        tension: 0.4,
        fill: true,
      },
      {
        label: 'Dépenses',
        data: [35000, 38000, 42000, 45000, 48000, 50000],
        borderColor: 'rgba(231, 74, 59, 1)',
        backgroundColor: 'rgba(231, 74, 59, 0.1)',
        tension: 0.4,
        fill: true,
      }
    ]
  }

  return (
    <Container fluid style={{ padding: '24px', background: 'var(--color-bodyBg)', minHeight: '100vh' }}>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--color-textPrimary)' }}>
          Caisse & Comptabilité 💰
        </h2>
        <p style={{ fontSize: '0.95rem', color: 'var(--color-textSecondary)' }}>
          Bienvenue {user?.name} | Gestion Financière
        </p>
      </motion.div>

      <Row className="mb-4">
        <Col xl={3} lg={6} className="mb-4">
          <StatCard title="Recettes du Mois" value="65,000 $" icon={FiTrendingUp} color="success" delay={0} />
        </Col>
        <Col xl={3} lg={6} className="mb-4">
          <StatCard title="Dépenses du Mois" value="50,000 $" icon={FiTrendingDown} color="danger" delay={0.1} />
        </Col>
        <Col xl={3} lg={6} className="mb-4">
          <StatCard title="Solde" value="15,000 $" icon={FiDollarSign} color="primary" delay={0.2} />
        </Col>
        <Col xl={3} lg={6} className="mb-4">
          <StatCard title="Paiements en Attente" value="12" icon={FiClock} color="warning" delay={0.3} />
        </Col>
      </Row>

      <Row className="mb-4">
        <Col lg={12}>
          <ChartCard title="Évolution Financière" subtitle="6 derniers mois" chartType="line" data={financeData} delay={0.4} height={300} />
        </Col>
      </Row>
    </Container>
  )
}

export default CaisseComptabiliteDashboard
```

**4. BibliothecaireDashboard.jsx**
```jsx
import { Container, Row, Col } from "react-bootstrap"
import { motion } from "framer-motion"
import { FiBook, FiBookOpen, FiClock, FiPlusCircle } from "react-icons/fi"
import StatCard from "../StatCard"
import ChartCard from "../ChartCard"

const BibliothecaireDashboard = ({ user }) => {
  const categoriesData = {
    labels: ['Informatique', 'Économie', 'Comptabilité', 'Droit', 'Finance', 'Mathématiques'],
    datasets: [{
      label: 'Livres par catégorie',
      data: [120, 85, 95, 70, 60, 55],
      backgroundColor: [
        'rgba(78, 115, 223, 0.8)',
        'rgba(28, 200, 138, 0.8)',
        'rgba(246, 194, 62, 0.8)',
        'rgba(231, 74, 59, 0.8)',
        'rgba(111, 66, 193, 0.8)',
        'rgba(54, 185, 204, 0.8)',
      ],
    }]
  }

  return (
    <Container fluid style={{ padding: '24px', background: 'var(--color-bodyBg)', minHeight: '100vh' }}>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--color-textPrimary)' }}>
          Bibliothèque 📚
        </h2>
        <p style={{ fontSize: '0.95rem', color: 'var(--color-textSecondary)' }}>
          Bienvenue {user?.name} | Gestion de la Bibliothèque
        </p>
      </motion.div>

      <Row className="mb-4">
        <Col xl={3} lg={6} className="mb-4">
          <StatCard title="Livres au Catalogue" value="485" icon={FiBook} color="primary" delay={0} />
        </Col>
        <Col xl={3} lg={6} className="mb-4">
          <StatCard title="Emprunts Actifs" value="156" icon={FiBookOpen} color="info" delay={0.1} />
        </Col>
        <Col xl={3} lg={6} className="mb-4">
          <StatCard title="Retours Attendus" value="23" icon={FiClock} color="warning" delay={0.2} />
        </Col>
        <Col xl={3} lg={6} className="mb-4">
          <StatCard title="Nouveautés du Mois" value="12" icon={FiPlusCircle} color="success" delay={0.3} />
        </Col>
      </Row>

      <Row className="mb-4">
        <Col lg={12}>
          <ChartCard title="Répartition par Catégorie" subtitle="Catalogue complet" chartType="doughnut" data={categoriesData} delay={0.4} height={300} />
        </Col>
      </Row>
    </Container>
  )
}

export default BibliothecaireDashboard
```

**5. JuryDashboard.jsx**
```jsx
import { Container, Row, Col } from "react-bootstrap"
import { motion } from "framer-motion"
import { FiFileText, FiCalendar, FiClock, FiCheckCircle } from "react-icons/fi"
import StatCard from "../StatCard"
import ChartCard from "../ChartCard"

const JuryDashboard = ({ user }) => {
  const statusData = {
    labels: ['En Préparation', 'Soumis', 'En Évaluation', 'Soutenus', 'Validés'],
    datasets: [{
      label: 'Mémoires',
      data: [15, 25, 18, 32, 28],
      backgroundColor: [
        'rgba(246, 194, 62, 0.8)',
        'rgba(78, 115, 223, 0.8)',
        'rgba(231, 74, 59, 0.8)',
        'rgba(28, 200, 138, 0.8)',
        'rgba(111, 66, 193, 0.8)',
      ],
    }]
  }

  return (
    <Container fluid style={{ padding: '24px', background: 'var(--color-bodyBg)', minHeight: '100vh' }}>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--color-textPrimary)' }}>
          Jury de Mémoire 🎓
        </h2>
        <p style={{ fontSize: '0.95rem', color: 'var(--color-textSecondary)' }}>
          Bienvenue {user?.name} | Évaluation des Mémoires
        </p>
      </motion.div>

      <Row className="mb-4">
        <Col xl={3} lg={6} className="mb-4">
          <StatCard title="Mémoires Soumis" value="118" icon={FiFileText} color="primary" delay={0} />
        </Col>
        <Col xl={3} lg={6} className="mb-4">
          <StatCard title="Soutenances Programmées" value="32" icon={FiCalendar} color="info" delay={0.1} />
        </Col>
        <Col xl={3} lg={6} className="mb-4">
          <StatCard title="En Évaluation" value="18" icon={FiClock} color="warning" delay={0.2} />
        </Col>
        <Col xl={3} lg={6} className="mb-4">
          <StatCard title="Validés" value="28" icon={FiCheckCircle} color="success" delay={0.3} />
        </Col>
      </Row>

      <Row className="mb-4">
        <Col lg={12}>
          <ChartCard title="Statut des Mémoires" subtitle="Année académique en cours" chartType="doughnut" data={statusData} delay={0.4} height={300} />
        </Col>
      </Row>
    </Container>
  )
}

export default JuryDashboard
```

---

### PHASE 2: PAGES CRITIQUES

#### 📄 Login.jsx (Priorité: TRÈS HAUTE)

**Objectif:** Première impression exceptionnelle

**Éléments à moderniser:**
```jsx
import { motion } from "framer-motion"

// Ajouter animations
<motion.div
  initial={{ opacity: 0, scale: 0.9 }}
  animate={{ opacity: 1, scale: 1 }}
  transition={{ duration: 0.5 }}
>
  <Card style={{
    background: 'var(--color-cardBg)',
    border: 'none',
    borderRadius: '16px',
    boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
  }}>
    {/* Contenu */}
  </Card>
</motion.div>

// Background gradient
<div style={{
  background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)',
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
}}>
```

**Améliorations:**
- Gradient background animé
- Card floating avec shadow profonde
- Animations input focus
- Loading button avec spinner
- Logo animé
- Illustrations SVG

---

#### 📄 Home.jsx (Priorité: HAUTE)

**Sections à moderniser:**
1. **Hero Section** - Animations Framer Motion
2. **Services Cards** - Hover effects + animations
3. **Features Section** - Parallax effects

**Code exemple:**
```jsx
<motion.div
  initial={{ opacity: 0, y: 50 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true }}
  transition={{ duration: 0.6 }}
>
  <Card style={{
    background: 'var(--color-cardBg)',
    borderRadius: '20px',
    border: 'none',
    boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
    transition: 'all 0.3s ease',
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.transform = 'translateY(-8px)'
    e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.12)'
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.transform = 'translateY(0)'
    e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)'
  }}
  >
    {/* Service card content */}
  </Card>
</motion.div>
```

---

#### 📄 Administration.jsx (Priorité: HAUTE)

**Transformation en Dashboard Moderne:**

```jsx
import StatCard from "../components/StatCard"
import { FiUsers, FiUserPlus, FiUserCheck, FiUserX } from "react-icons/fi"

// Header avec StatCards
<Row className="mb-4">
  <Col xl={3} lg={6} className="mb-4">
    <StatCard
      title="Total Utilisateurs"
      value={users.count.toString()}
      icon={FiUsers}
      color="primary"
      delay={0}
    />
  </Col>
  <Col xl={3} lg={6} className="mb-4">
    <StatCard
      title="Actifs ce mois"
      value="234"
      icon={FiUserCheck}
      color="success"
      trend="up"
      trendValue="+12%"
      delay={0.1}
    />
  </Col>
  <Col xl={3} lg={6} className="mb-4">
    <StatCard
      title="Nouveaux"
      value="45"
      icon={FiUserPlus}
      color="info"
      delay={0.2}
    />
  </Col>
  <Col xl={3} lg={6} className="mb-4">
    <StatCard
      title="Inactifs"
      value="12"
      icon={FiUserX}
      color="warning"
      delay={0.3}
    />
  </Col>
</Row>

// Table moderne avec animations
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ delay: 0.4 }}
  style={{
    background: 'var(--color-cardBg)',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
  }}
>
  <Table responsive hover style={{ marginBottom: 0 }}>
    {/* Table content */}
  </Table>
</motion.div>
```

---

#### 📄 Courses.jsx (Priorité: HAUTE)

**Modernisation:**
```jsx
// Filtres modernes
<motion.div
  initial={{ opacity: 0, y: -20 }}
  animate={{ opacity: 1, y: 0 }}
  style={{
    background: 'var(--color-cardBg)',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '24px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
  }}
>
  <Row>
    <Col md={3}>
      <Form.Group>
        <Form.Label style={{
          fontSize: '0.875rem',
          fontWeight: '600',
          color: 'var(--color-textSecondary)'
        }}>
          Section
        </Form.Label>
        <Form.Select style={{
          borderRadius: '8px',
          border: '1px solid var(--color-border)',
          padding: '10px 12px',
        }}>
          {/* Options */}
        </Form.Select>
      </Form.Group>
    </Col>
    {/* Autres filtres */}
  </Row>
</motion.div>

// Cards cours modernes
<motion.div
  initial={{ opacity: 0, scale: 0.95 }}
  whileInView={{ opacity: 1, scale: 1 }}
  viewport={{ once: true }}
  transition={{ duration: 0.3 }}
  style={{
    background: 'var(--color-cardBg)',
    borderRadius: '12px',
    padding: '20px',
    border: '1px solid var(--color-border)',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
  }}
  whileHover={{
    y: -4,
    boxShadow: '0 8px 20px rgba(0,0,0,0.08)',
  }}
>
  {/* Course content */}
</motion.div>
```

---

### PHASE 3: PAGES ACADÉMIQUES

#### 📄 Quiz.jsx

**Interface Examen Moderne:**
```jsx
// Timer visuel
<div style={{
  background: timeLeft < 300 ? 'rgba(231, 74, 59, 0.1)' : 'rgba(78, 115, 223, 0.1)',
  borderRadius: '12px',
  padding: '12px 20px',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
}}>
  <FiClock style={{ fontSize: '20px', color: timeLeft < 300 ? 'var(--color-danger)' : 'var(--color-primary)' }} />
  <span style={{
    fontSize: '1.125rem',
    fontWeight: '700',
    color: timeLeft < 300 ? 'var(--color-danger)' : 'var(--color-primary)',
  }}>
    {formatTime(timeLeft)}
  </span>
</div>

// Progress bar animée
<div style={{ position: 'relative', height: '8px', background: 'var(--color-border)', borderRadius: '4px', overflow: 'hidden' }}>
  <motion.div
    initial={{ width: 0 }}
    animate={{ width: `${progress}%` }}
    transition={{ duration: 0.5 }}
    style={{
      height: '100%',
      background: 'linear-gradient(90deg, var(--color-primary), var(--color-secondary))',
      borderRadius: '4px',
    }}
  />
</div>

// Options quiz avec animations
<motion.div
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
  style={{
    padding: '16px',
    background: selected ? 'var(--color-primary-light)' : 'var(--color-cardBg)',
    border: `2px solid ${selected ? 'var(--color-primary)' : 'var(--color-border)'}`,
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  }}
>
  {/* Option content */}
</motion.div>
```

#### 📄 TPTD.jsx

**Cards travaux modernes:**
```jsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: index * 0.1 }}
  style={{
    background: 'var(--color-cardBg)',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
  }}
>
  {/* Header avec badge statut */}
  <div style={{
    background: statusColor,
    padding: '16px 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  }}>
    <Badge style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}>
      {assignment.assignment_type}
    </Badge>
    <span style={{ color: 'white', fontWeight: '600' }}>
      {getStatusText(assignment.status)}
    </span>
  </div>

  {/* Body */}
  <div style={{ padding: '20px' }}>
    <h6 style={{ color: 'var(--color-textPrimary)', marginBottom: '8px' }}>
      {assignment.title}
    </h6>
    <p style={{ color: 'var(--color-textSecondary)', fontSize: '0.875rem' }}>
      {assignment.description}
    </p>

    {/* Progress si soumis */}
    {assignment.submitted && (
      <div style={{ marginTop: '16px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '0.875rem',
          marginBottom: '4px',
        }}>
          <span style={{ color: 'var(--color-textSecondary)' }}>Note</span>
          <span style={{ color: 'var(--color-primary)', fontWeight: '600' }}>
            {assignment.grade}/20
          </span>
        </div>
        <div style={{
          height: '6px',
          background: 'var(--color-border)',
          borderRadius: '3px',
          overflow: 'hidden',
        }}>
          <div style={{
            width: `${(assignment.grade / 20) * 100}%`,
            height: '100%',
            background: 'var(--color-success)',
            borderRadius: '3px',
          }} />
        </div>
      </div>
    )}
  </div>

  {/* Footer actions */}
  <div style={{
    padding: '16px 20px',
    borderTop: '1px solid var(--color-border)',
    background: 'var(--color-bodyBg)',
  }}>
    <Button
      style={{
        width: '100%',
        borderRadius: '8px',
        padding: '10px',
      }}
    >
      {assignment.submitted ? 'Voir détails' : 'Soumettre'}
    </Button>
  </div>
</motion.div>
```

---

### PHASE 4: PAGES BIBLIOTHÈQUE

#### 📄 Library.jsx

**Grid catalogue moderne:**
```jsx
<Row xs={1} sm={2} md={3} lg={4} xl={5} className="g-4">
  {books.map((book, index) => (
    <Col key={book.id}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: index * 0.05 }}
        whileHover={{ y: -8 }}
        style={{
          background: 'var(--color-cardBg)',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
        }}
      >
        {/* Cover image */}
        <div style={{
          position: 'relative',
          paddingTop: '140%',
          background: `url(${book.cover_image}) center/cover`,
          backgroundColor: 'var(--color-border)',
        }}>
          {book.available_quantity === 0 && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              background: 'rgba(0,0,0,0.7)',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '20px',
              fontSize: '0.75rem',
              fontWeight: '600',
            }}>
              Indisponible
            </div>
          )}
        </div>

        {/* Info */}
        <div style={{ padding: '12px' }}>
          <h6 style={{
            fontSize: '0.875rem',
            fontWeight: '600',
            color: 'var(--color-textPrimary)',
            marginBottom: '4px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {book.title}
          </h6>
          <p style={{
            fontSize: '0.75rem',
            color: 'var(--color-textSecondary)',
            marginBottom: '8px',
          }}>
            {book.author}
          </p>
          <Badge bg={getCategoryColor(book.category)} style={{ fontSize: '0.7rem' }}>
            {book.category}
          </Badge>
        </div>
      </motion.div>
    </Col>
  ))}
</Row>
```

---

## 📊 CHECKLIST COMPLÈTE PAR PAGE

### ✅ Avant de commencer
- [ ] Lire la page actuelle pour comprendre la structure
- [ ] Identifier les StatCards potentielles
- [ ] Identifier les graphiques possibles
- [ ] Lister les widgets nécessaires (Calendar, Schedule, Activity)

### ✅ Structure
- [ ] Container fluid avec padding: 24px
- [ ] Background: var(--color-bodyBg)
- [ ] Header animé avec motion.div

### ✅ StatCards
- [ ] 4 StatCards minimum si applicable
- [ ] Icônes de react-icons/fi
- [ ] Delays échelonnés (0, 0.1, 0.2, 0.3)
- [ ] Couleurs variées (primary, success, warning, info)

### ✅ Graphiques
- [ ] ChartCard pour visualisations
- [ ] Types variés (line, bar, doughnut)
- [ ] Données réalistes ou mock

### ✅ Widgets
- [ ] CalendarWidget si événements
- [ ] ScheduleWidget si planning
- [ ] RecentActivity si activités

### ✅ Composants
- [ ] Tous les Cards avec borderRadius: 12px
- [ ] BoxShadow cohérent
- [ ] Animations Framer Motion
- [ ] Hover effects
- [ ] Transitions smooth

### ✅ Couleurs
- [ ] Utiliser var(--color-*) partout
- [ ] Pas de couleurs hardcodées
- [ ] Vérifier dark/light mode

### ✅ Responsive
- [ ] Col avec breakpoints (xl, lg, md, sm)
- [ ] Mobile-first approach
- [ ] Tester sur différentes tailles

### ✅ Final
- [ ] get_errors pour vérifier
- [ ] Tester dark/light mode
- [ ] Vérifier animations
- [ ] Test utilisateur

---

## 🎯 ORDRE DE MODERNISATION RECOMMANDÉ

### Semaine 1: Dashboards + Pages Critiques
1. ✅ ServiceITDashboard
2. ✅ ApparitoratDashboard
3. ✅ CaisseComptabiliteDashboard
4. ✅ BibliothecaireDashboard
5. ✅ JuryDashboard
6. Login.jsx
7. Home.jsx
8. Administration.jsx

### Semaine 2: Pages Académiques
9. Courses.jsx
10. CourseDetail.jsx
11. Quiz.jsx
12. TPTD.jsx
13. Auditoires.jsx
14. AuditoireDetail.jsx
15. SectionDetail.jsx
16. FiliereDetail.jsx

### Semaine 3: Pages Utilisateurs & Gestion
17. Profile.jsx
18. UserDetail.jsx
19. StudentListPage.jsx
20. TeacherListPage.jsx
21. GestionInscriptions.jsx
22. InscriptionDetail.jsx
23. PublicInscription.jsx

### Semaine 4: Pages Services
24. Library.jsx
25. BookDetail.jsx
26. Paiements.jsx
27. Comptabilite.jsx
28. Chat.jsx
29. Notifications.jsx
30. Apparitorat.jsx
31. ServiceIT.jsx
32. RH.jsx

---

## 💡 ASTUCES & BEST PRACTICES

### Performance
- Utiliser React.memo() pour composants coûteux
- useCallback pour fonctions passées en props
- useMemo pour calculs complexes
- Lazy loading images: `<img loading="lazy" />`

### Animations
- Durée standard: 0.3s - 0.5s
- Easing: ease ou cubic-bezier
- Ne pas animer trop d'éléments en même temps
- viewport={{ once: true }} pour animations scroll

### Accessibilité
- Alt text sur toutes les images
- Labels sur tous les inputs
- Contraste suffisant (WCAG AA)
- Navigation clavier fonctionnelle
- ARIA labels où nécessaire

### Code Quality
- Composants < 300 lignes
- Extraction des sous-composants
- Noms de variables explicites
- Commentaires pour logique complexe
- Pas de console.log en production

---

**Dernière mise à jour:** 2024
**Document:** Guide de modernisation pratique
**Statut:** Prêt pour implémentation 🚀
