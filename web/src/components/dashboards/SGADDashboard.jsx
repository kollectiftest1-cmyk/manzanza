import { useState, useEffect } from "react"
import { Container, Row, Col, Card, Button, Table, Badge, Spinner, ProgressBar } from "react-bootstrap"
import { useSelector } from "react-redux"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import {
  FiDollarSign, FiTrendingDown, FiTrendingUp, FiCreditCard,
  FiUsers, FiTarget, FiCheckCircle, FiClock, FiBook, FiPlus,
  FiBarChart2, FiRefreshCw, FiAlertCircle
} from "react-icons/fi"
import api from "../../services/api"

const SGADDashboard = () => {
  const { user } = useSelector((state) => state.auth)
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadStats = async () => {
    setLoading(true)
    try {
      const res = await api.get('/stats/sga/')
      setStats(res.data)
    } catch (err) {
      console.error('Erreur chargement stats:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadStats() }, [])

  const fmt = (n) => n != null ? Number(n).toLocaleString('fr-FR') : '—'

  if (loading) {
    return (
      <Container fluid style={{ padding: '24px', background: 'var(--color-bodyBg)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spinner animation="border" style={{ color: 'var(--color-primary)' }} />
      </Container>
    )
  }

  const d = stats || {}
  const collectionRate = d.total_expected > 0 ? Math.round((d.total_paid / d.total_expected) * 100) : 0

  return (
    <Container fluid style={{ padding: '24px', background: 'var(--color-bodyBg)', minHeight: '100vh' }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '16px',
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 16px rgba(102,126,234,0.3)'
            }}>
              <FiBarChart2 size={28} color="white" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.75rem', fontWeight: '700', color: 'var(--color-text)' }}>
                SGAD — Administration & Finances
              </h2>
              <p style={{ margin: 0, color: 'var(--color-textSecondary)' }}>Bienvenue, {user?.first_name || user?.name}</p>
            </div>
          </div>
          <Button size="sm" variant="outline-secondary" onClick={loadStats} style={{ borderRadius: '10px' }}>
            <FiRefreshCw size={14} className="me-1" /> Actualiser
          </Button>
        </div>
      </motion.div>

      {/* Academic Stats */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Row className="g-3 mb-4">
          {[
            { label: 'Étudiants actifs', value: fmt(d.total_students), icon: FiUsers, color: '#4facfe', link: '/gestion-etudiants' },
            { label: 'Enseignants', value: fmt(d.total_teachers), icon: FiBook, color: '#a78bfa', link: '/gestion-enseignants' },
            { label: 'Auditoires', value: fmt(d.total_auditoires), icon: FiTarget, color: '#43e97b', link: '/auditoires' },
            { label: 'Cours actifs', value: fmt(d.total_courses), icon: FiCheckCircle, color: '#f093fb', link: '/courses' },
          ].map((s, i) => (
            <Col md={3} sm={6} key={i}>
              <Card onClick={() => navigate(s.link)} style={{
                border: 'none', borderRadius: '14px', cursor: 'pointer',
                background: 'var(--color-cardBg)', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                transition: 'transform 0.2s'
              }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <Card.Body style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: `${s.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <s.icon size={24} color={s.color} />
                  </div>
                  <div>
                    <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--color-text)', lineHeight: 1.1 }}>{s.value}</div>
                    <div style={{ fontSize: '12px', color: 'var(--color-textSecondary)' }}>{s.label}</div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </motion.div>

      {/* Financial Stats */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <h5 style={{ fontWeight: '700', color: 'var(--color-text)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FiDollarSign style={{ color: '#43e97b' }} /> Finances & Paiements
        </h5>
        <Row className="g-3 mb-4">
          {[
            { label: 'Montant attendu (USD)', value: `$${fmt(d.total_expected || 0)}`, icon: FiCreditCard, color: '#4facfe' },
            { label: 'Montant collecté (USD)', value: `$${fmt(d.total_paid || 0)}`, icon: FiTrendingUp, color: '#43e97b' },
            { label: 'Reste à percevoir (USD)', value: `$${fmt(d.total_pending || 0)}`, icon: FiClock, color: '#ffc107' },
            d.by_currency?.CDF
              ? { label: 'Reste à percevoir (CDF)', value: `${fmt(Math.round(d.by_currency.CDF.expected - d.by_currency.CDF.paid))} FC`, icon: FiTarget, color: '#f093fb' }
              : { label: 'Campagnes actives', value: fmt(d.active_campaigns || 0), icon: FiTarget, color: '#f093fb' },
          ].map((s, i) => (
            <Col md={3} sm={6} key={i}>
              <Card style={{ border: 'none', borderRadius: '14px', background: 'var(--color-cardBg)', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <Card.Body style={{ padding: '18px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: `${s.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <s.icon size={20} color={s.color} />
                  </div>
                  <div>
                    <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--color-text)', lineHeight: 1.2 }}>{s.value}</div>
                    <div style={{ fontSize: '11px', color: 'var(--color-textSecondary)' }}>{s.label}</div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </motion.div>

      {/* Collection Rate + Quick Actions */}
      <Row className="g-3 mb-4">
        <Col md={8}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card style={{ border: 'none', borderRadius: '14px', background: 'var(--color-cardBg)', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <Card.Body style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ fontWeight: '700', color: 'var(--color-text)' }}>Taux de collecte global</span>
                  <span style={{ fontWeight: '800', color: collectionRate >= 50 ? '#43e97b' : '#ffc107' }}>{collectionRate}%</span>
                </div>
                <ProgressBar now={collectionRate} variant={collectionRate >= 50 ? 'success' : 'warning'} style={{ height: '12px', borderRadius: '6px', marginBottom: '16px' }} />
                <Row className="g-2">
                  {[
                    { label: 'Étudiants payés', value: d.paid_students || 0, color: '#43e97b' },
                    { label: 'Étudiants impayés', value: d.unpaid_students || 0, color: '#dc3545' },
                    { label: 'Inscriptions en attente', value: d.pending_inscriptions || 0, color: '#ffc107' },
                  ].map(s => (
                    <Col xs={4} key={s.label} style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '22px', fontWeight: '800', color: s.color }}>{s.value}</div>
                      <div style={{ fontSize: '11px', color: 'var(--color-textSecondary)' }}>{s.label}</div>
                    </Col>
                  ))}
                </Row>

                {/* HR info */}
                {d.total_employees != null && (
                  <div style={{ marginTop: '16px', padding: '12px', borderRadius: '10px', background: 'var(--color-bodyBg)' }}>
                    <div style={{ fontSize: '13px', color: 'var(--color-textSecondary)', marginBottom: '4px' }}>
                      Ressources Humaines
                    </div>
                    <span style={{ fontWeight: '600', color: 'var(--color-text)', marginRight: '16px' }}>
                      {d.total_employees} employé(s)
                    </span>
                    <span style={{ fontWeight: '600', color: 'var(--color-text)' }}>
                      Masse salariale payée : <strong style={{ color: '#667eea' }}>${fmt(d.total_payroll_paid || 0)}</strong>
                    </span>
                  </div>
                )}
              </Card.Body>
            </Card>
          </motion.div>
        </Col>

        <Col md={4}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card style={{ border: 'none', borderRadius: '14px', background: 'var(--color-cardBg)', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', height: '100%' }}>
              <Card.Body style={{ padding: '20px' }}>
                <h6 style={{ fontWeight: '700', color: 'var(--color-text)', marginBottom: '14px' }}>Actions rapides</h6>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <Button size="sm" onClick={() => navigate('/gestion-frais')}
                    style={{ borderRadius: '10px', background: 'linear-gradient(135deg, #43e97b, #38f9d7)', border: 'none', color: '#155724', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FiPlus size={14} /> Créer un frais
                  </Button>
                  <Button size="sm" variant="outline-primary" onClick={() => navigate('/gestion-etudiants')} style={{ borderRadius: '10px', fontWeight: '600' }}>
                    <FiUsers size={14} className="me-1" /> Gestion étudiants
                  </Button>
                  <Button size="sm" variant="outline-info" onClick={() => navigate('/rh')} style={{ borderRadius: '10px', fontWeight: '600' }}>
                    <FiUsers size={14} className="me-1" /> Ressources Humaines
                  </Button>
                  <Button size="sm" variant="outline-secondary" onClick={() => navigate('/comptabilite')} style={{ borderRadius: '10px', fontWeight: '600' }}>
                    <FiDollarSign size={14} className="me-1" /> Comptabilité
                  </Button>
                </div>

                {/* Alerts */}
                {d.pending_inscriptions > 0 && (
                  <div style={{ marginTop: '14px', padding: '10px', borderRadius: '8px', background: '#ffc10722', border: '1px solid #ffc10744', fontSize: '12px' }}>
                    <FiAlertCircle size={13} style={{ color: '#ffc107', marginRight: '6px' }} />
                    <strong>{d.pending_inscriptions}</strong> inscription(s) en attente
                  </div>
                )}
                {(d.unpaid_students || 0) > 0 && (
                  <div style={{ marginTop: '8px', padding: '10px', borderRadius: '8px', background: '#dc354522', border: '1px solid #dc354544', fontSize: '12px' }}>
                    <FiAlertCircle size={13} style={{ color: '#dc3545', marginRight: '6px' }} />
                    <strong>{d.unpaid_students}</strong> étudiant(s) avec frais impayés
                  </div>
                )}
              </Card.Body>
            </Card>
          </motion.div>
        </Col>
      </Row>

      {/* Recent Payments (from API) */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <Card style={{ border: 'none', borderRadius: '14px', background: 'var(--color-cardBg)', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <Card.Header style={{ background: 'transparent', borderBottom: '1px solid var(--color-border)', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h6 style={{ margin: 0, fontWeight: '700', color: 'var(--color-text)' }}>Paiements récents confirmés</h6>
            <Button size="sm" variant="outline-primary" onClick={() => navigate('/gestion-frais')} style={{ borderRadius: '8px', fontSize: '12px' }}>
              Voir tout
            </Button>
          </Card.Header>
          <Card.Body style={{ padding: 0 }}>
            {(d.recent_payments || []).length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-textSecondary)', fontSize: '13px' }}>
                Aucun paiement confirmé pour le moment.
              </div>
            ) : (
              <Table hover style={{ marginBottom: 0, fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: 'var(--color-bodyBg)' }}>
                    <th style={thStyle}>Étudiant</th>
                    <th style={thStyle}>Campagne</th>
                    <th style={thStyle}>Montant</th>
                    <th style={thStyle}>Méthode</th>
                    <th style={thStyle}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {d.recent_payments.map((p, i) => (
                    <tr key={p.id || i}>
                      <td style={tdStyle}>
                        {p.student_fee__student__last_name} {p.student_fee__student__first_name}
                      </td>
                      <td style={tdStyle}>{p.student_fee__fee_campaign__name || '—'}</td>
                      <td style={tdStyle}><strong>${Number(p.amount).toLocaleString('fr-FR')}</strong></td>
                      <td style={tdStyle}>
                        <Badge bg="light" text="dark" style={{ fontSize: '11px' }}>{p.payment_method}</Badge>
                      </td>
                      <td style={tdStyle}>{p.payment_date ? new Date(p.payment_date).toLocaleDateString('fr-FR') : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card.Body>
        </Card>
      </motion.div>
    </Container>
  )
}

const thStyle = { padding: '12px 16px', fontWeight: '600', fontSize: '12px', color: 'var(--color-textSecondary)', borderBottom: '2px solid var(--color-border)' }
const tdStyle = { padding: '12px 16px', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text)' }

export default SGADDashboard
