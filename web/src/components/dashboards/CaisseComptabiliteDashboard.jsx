import { useState, useEffect } from "react"
import { Container, Row, Col, Card, Table, Badge, Spinner, Form, Button, InputGroup } from "react-bootstrap"
import { motion } from "framer-motion"
import { FiDollarSign, FiCheckCircle, FiClock, FiSearch, FiArrowRight } from "react-icons/fi"
import { useNavigate } from "react-router-dom"
import { toast } from "react-toastify"
import StatCard from "../StatCard"
import { paymentService } from "../../services/paymentService"

const CaisseComptabiliteDashboard = ({ user }) => {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [quickCode, setQuickCode] = useState('')

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const res = await paymentService.getCaisseStats()
      setStats(res.data)
    } catch {
      toast.error('Erreur chargement des statistiques')
    } finally {
      setLoading(false)
    }
  }

  const handleQuickLookup = (e) => {
    e.preventDefault()
    if (quickCode.trim()) {
      navigate(`/caisse?code=${encodeURIComponent(quickCode.trim())}`)
    }
  }

  const formatMoney = (v, currency) => {
    if (!v) return currency === 'CDF' ? '0 FC' : '$0.00'
    if (currency === 'CDF') return Number(v).toLocaleString('fr-FR') + ' FC'
    return '$' + Number(v).toFixed(2)
  }

  const statusBadge = (s) => {
    const map = { pending: ['warning', 'En attente'], paid: ['success', 'Payé'], cancelled: ['danger', 'Annulé'], expired: ['secondary', 'Expiré'] }
    const [bg, label] = map[s] || ['secondary', s]
    return <Badge bg={bg}>{label}</Badge>
  }

  if (loading) {
    return (
      <Container fluid className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <Spinner animation="border" variant="primary" />
      </Container>
    )
  }

  return (
    <Container fluid style={{ padding: '24px', background: 'var(--color-bodyBg)', minHeight: '100vh' }}>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--color-textPrimary)', marginBottom: '8px' }}>
          Caisse 💰
        </h2>
        <p style={{ fontSize: '0.95rem', color: 'var(--color-textSecondary)', margin: 0 }}>
          Bienvenue {user?.first_name || user?.name} — Gestion des paiements
        </p>
      </motion.div>

      {/* Quick voucher lookup */}
      <Row className="mb-4">
        <Col lg={6}>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card style={{ border: '2px dashed var(--color-primary)', borderRadius: '12px' }}>
              <Card.Body className="p-4">
                <h5 className="mb-3" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
                  <FiSearch className="me-2" />Recherche rapide de BON
                </h5>
                <Form onSubmit={handleQuickLookup}>
                  <InputGroup>
                    <Form.Control
                      placeholder="Entrez le numéro du BON (ex: BON-20250615-12345)"
                      value={quickCode}
                      onChange={(e) => setQuickCode(e.target.value)}
                      style={{ borderRadius: '8px 0 0 8px' }}
                    />
                    <Button type="submit" variant="primary" style={{ borderRadius: '0 8px 8px 0' }}>
                      <FiArrowRight /> Rechercher
                    </Button>
                  </InputGroup>
                </Form>
                <div className="mt-2">
                  <small className="text-muted">ou accédez à la page complète : </small>
                  <Button variant="link" size="sm" className="p-0" onClick={() => navigate('/caisse')}>
                    Ouvrir la Caisse
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </motion.div>
        </Col>
      </Row>

      {/* Stat cards */}
      <Row className="mb-4">
        <Col xl={3} lg={6} md={6} sm={12} className="mb-4">
          <StatCard title="Validés Aujourd'hui" value={stats?.today_count || 0} icon={FiCheckCircle} color="success" subtitle={formatMoney(stats?.today_total)} delay={0.1} onClick={() => navigate('/caisse')} />
        </Col>
        <Col xl={3} lg={6} md={6} sm={12} className="mb-4">
          <StatCard title="Bons en Attente" value={stats?.pending_count || 0} icon={FiClock} color="warning" subtitle={formatMoney(stats?.pending_total)} delay={0.2} onClick={() => navigate('/caisse')} />
        </Col>
        <Col xl={3} lg={6} md={6} sm={12} className="mb-4">
          <StatCard title="Total Encaissé" value={formatMoney(stats?.total_collected)} icon={FiDollarSign} color="primary" subtitle={`${stats?.total_validated_count || 0} paiements`} delay={0.3} />
        </Col>
      </Row>

      {/* Recent vouchers */}
      <Row>
        <Col lg={12}>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card style={{ borderRadius: '12px', border: '1px solid var(--color-border)' }}>
              <Card.Header className="d-flex justify-content-between align-items-center" style={{ background: 'var(--color-cardBg)', borderBottom: '1px solid var(--color-border)' }}>
                <h5 className="m-0" style={{ fontWeight: 600 }}>Derniers Bons de Paiement</h5>
                <Button variant="outline-primary" size="sm" onClick={() => navigate('/caisse')}>Voir tout</Button>
              </Card.Header>
              <Card.Body className="p-0">
                {stats?.recent_vouchers?.length > 0 ? (
                  <Table responsive hover className="mb-0">
                    <thead>
                      <tr>
                        <th>N° BON</th>
                        <th>Étudiant</th>
                        <th>Frais</th>
                        <th>Montant</th>
                        <th>Statut</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.recent_vouchers.map((v) => (
                        <tr key={v.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/caisse?code=${v.voucher_number}`)}>
                          <td><code>{v.voucher_number}</code></td>
                          <td>{v.student_name || '-'}</td>
                          <td>{v.fee_type_name || '-'}</td>
                          <td><strong>{formatMoney(v.amount, v.currency)}</strong></td>
                          <td>{statusBadge(v.status)}</td>
                          <td>{v.created_at ? new Date(v.created_at).toLocaleDateString('fr-FR') : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                ) : (
                  <div className="text-center py-5 text-muted">
                    <FiDollarSign size={48} className="mb-3" style={{ opacity: 0.3 }} />
                    <p>Aucun bon de paiement récent</p>
                  </div>
                )}
              </Card.Body>
            </Card>
          </motion.div>
        </Col>
      </Row>
    </Container>
  )
}

export default CaisseComptabiliteDashboard
