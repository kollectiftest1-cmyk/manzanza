/**
 * Paiements.jsx — Page de paiement pour l'étudiant
 * - Résumé (total dû, payé, restant)
 * - Liste des frais avec statut, progression et actions
 * - Paiement via Mobile Money (MTN / Vodacom / Airtel / Orange)
 * - Génération d'un BON de paiement imprimable
 */
import { useState, useEffect, useCallback, useRef } from 'react'
import { Container, Row, Col, Card, Button, Badge, Form, Modal, ProgressBar, Spinner } from 'react-bootstrap'
import { useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import {
  FiDollarSign, FiCheckCircle, FiClock, FiAlertCircle,
  FiPrinter, FiSend, FiSmartphone, FiRefreshCw
} from 'react-icons/fi'
import { toast } from 'react-toastify'
import paymentService from '../services/paymentService'

// Mobile money providers (DRC)
const MM_PROVIDERS = [
  { id: 'mtn',     label: 'MTN Mobile Money', color: '#FFCC00', text: '#1a1a1a' },
  { id: 'vodacom', label: 'Vodacom M-Pesa',   color: '#E60000', text: '#fff'    },
  { id: 'airtel',  label: 'Airtel Money',      color: '#FF0000', text: '#fff'    },
  { id: 'orange',  label: 'Orange Money',      color: '#FF7900', text: '#fff'    },
]

const BON_METHODS = [
  { id: 'especes',     label: 'Espèces' },
  { id: 'virement',    label: 'Virement bancaire' },
  { id: 'cheque',      label: 'Chèque' },
  { id: 'mobile_money', label: 'Mobile Money' },
]

const STATUS_CFG = {
  impaye:  { bg: '#dc354522', border: '#dc3545', text: '#dc3545', label: 'Impayé',  icon: FiAlertCircle },
  partiel: { bg: '#ffc10722', border: '#ffc107', text: '#856404', label: 'Partiel', icon: FiClock },
  paye:    { bg: '#19875422', border: '#198754', text: '#198754', label: 'Payé',    icon: FiCheckCircle },
  annule:  { bg: '#6c757d22', border: '#6c757d', text: '#6c757d', label: 'Annulé', icon: FiAlertCircle },
}

/** Format amount with the fee's currency (USD → $100.00, CDF → 100 FC) */
const fmtCur = (amount, currency) => {
  const v = Number(amount || 0)
  if (currency === 'CDF') return v.toLocaleString('fr-FR') + ' FC'
  return '$' + v.toFixed(2)
}

const Paiements = () => {
  const { user } = useSelector(s => s.auth)

  const [myFees, setMyFees] = useState([])
  const [loading, setLoading] = useState(false)

  // Mobile Money modal
  const [showMMModal, setShowMMModal] = useState(false)
  const [selectedSF, setSelectedSF] = useState(null)
  const [mmProvider, setMmProvider]  = useState('')
  const [mmPhone, setMmPhone]        = useState('')
  const [mmAmount, setMmAmount]      = useState('')
  const [mmPaying, setMmPaying]      = useState(false)
  const [mmResult, setMmResult]      = useState(null)

  // BON de paiement modal
  const [showBonModal, setShowBonModal]   = useState(false)
  const [bonData, setBonData]             = useState(null)
  const [bonLoading, setBonLoading]       = useState(false)
  const [bonSF, setBonSF]                 = useState(null)
  const [bonAmount, setBonAmount]         = useState('')
  const [bonMethod, setBonMethod]         = useState('especes')
  const bonRef = useRef(null)

  const loadMyFees = useCallback(async () => {
    setLoading(true)
    try {
      const res = await paymentService.getMyFees()
      setMyFees(res.data?.results || res.data || [])
    } catch {
      toast.error('Erreur chargement de vos frais.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadMyFees() }, [loadMyFees])

  // Summary totals
  const totals = myFees.reduce((acc, sf) => {
    acc.due += parseFloat(sf.total_amount || 0)
    acc.paid += parseFloat(sf.amount_paid || 0)
    acc.remaining += parseFloat(sf.amount_remaining || 0)
    return acc
  }, { due: 0, paid: 0, remaining: 0 })
  const pct = totals.due > 0 ? Math.round((totals.paid / totals.due) * 100) : 0
  // Dominant currency from fees (fallback USD)
  const mainCurrency = myFees.length > 0 ? (myFees[0].fee_campaign_currency || 'USD') : 'USD'

  // ── Mobile Money ──────────────────────────────────────────────────────────
  const openMM = (sf) => {
    setSelectedSF(sf)
    setMmProvider('')
    setMmPhone('')
    setMmAmount(sf.amount_remaining)
    setMmResult(null)
    setShowMMModal(true)
  }

  const handleMMPay = async (e) => {
    e.preventDefault()
    if (!mmProvider) { toast.error('Choisissez un réseau Mobile Money.'); return }
    if (!mmPhone.trim()) { toast.error('Entrez votre numéro de téléphone.'); return }
    if (parseFloat(mmAmount) <= 0) { toast.error('Montant invalide.'); return }
    setMmPaying(true)
    setMmResult(null)
    try {
      const res = await paymentService.mobileMoneyPay({
        student_fee_id: selectedSF.id,
        amount: mmAmount,
        provider: mmProvider,
        phone_number: mmPhone.trim(),
      })
      setMmResult(res.data)
      toast.success('Paiement Mobile Money confirmé !')
      loadMyFees()
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.detail || 'Erreur paiement.')
    } finally {
      setMmPaying(false)
    }
  }

  // ── BON de paiement ───────────────────────────────────────────────────────
  const handleGenerateBon = (sf) => {
    setBonSF(sf)
    setBonAmount(sf.amount_remaining)
    setBonMethod('especes')
    setBonData(null)
    setShowBonModal(true)
  }

  const submitBon = async () => {
    const amt = parseFloat(bonAmount)
    if (!amt || amt <= 0) { toast.error('Montant invalide.'); return }
    if (amt > parseFloat(bonSF.amount_remaining)) { toast.error('Le montant dépasse le reste à payer.'); return }
    setBonLoading(true)
    try {
      const res = await paymentService.createVoucher({
        student_fee_id: bonSF.id,
        amount: amt,
        description: bonSF.fee_name || bonSF.fee_campaign_name || 'Frais étudiants',
        beneficiary_account: 'SYNTAX-GU-001',
        beneficiary_name: 'SYNTAX GU',
        expiry_days: 30,
        payment_method: bonMethod,
      })
      setBonData({ ...res.data, payment_method_label: BON_METHODS.find(m => m.id === bonMethod)?.label || bonMethod })
    } catch {
      toast.error('Erreur génération du BON.')
    } finally {
      setBonLoading(false)
    }
  }

  const handlePrintBon = () => {
    if (!bonRef.current) return
    const printContent = bonRef.current.innerHTML
    const w = window.open('', '', 'width=600,height=800')
    w.document.write(`<!DOCTYPE html><html><head>
      <title>BON DE PAIEMENT — Université Mazanza</title>
      <style>
        body{font-family:'Segoe UI',Arial,sans-serif;padding:20px;color:#1a1a1a;font-size:13px}
        .header{text-align:center;border-bottom:2px solid #0d6efd;padding-bottom:12px;margin-bottom:16px}
        .header h1{font-size:22px;font-weight:900;color:#0d6efd;margin:0}
        .header .sub{font-size:11px;color:#666;margin:2px 0}
        .header .title{font-size:13px;font-weight:700;background:#f0f4ff;padding:4px 12px;border-radius:6px;display:inline-block;margin-top:6px}
        .bon-num{background:#f0f4ff;border:2px dashed #0d6efd;border-radius:10px;padding:12px;text-align:center;margin:16px 0}
        .bon-num .code{font-size:20px;font-weight:900;font-family:monospace;color:#0d6efd;letter-spacing:3px}
        table{width:100%;border-collapse:collapse;margin:12px 0}
        td{padding:6px 10px;border:1px solid #dee2e6;font-size:13px}
        td:first-child{font-weight:600;background:#f8f9fa;width:45%;color:#444}
        .amount{background:#d1fae5;border:2px solid #059669;border-radius:10px;padding:12px;text-align:center;margin:12px 0}
        .amount .lbl{font-size:11px;color:#065f46;font-weight:600;margin-bottom:4px}
        .amount .val{font-size:26px;font-weight:900;color:#059669}
        .warn{font-size:11px;color:#dc3545;font-weight:600;text-align:center;margin:8px 0}
        .footer{font-size:10px;color:#888;text-align:center;margin-top:12px;border-top:1px dashed #ccc;padding-top:8px;line-height:1.6}
        @media print{button{display:none}}
      </style></head><body>${printContent}</body></html>`)
    w.document.close(); w.focus()
    setTimeout(() => w.print(), 500)
  }

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '60px' }}>
      <Spinner style={{ color: 'var(--color-primary)' }} />
    </div>
  )

  return (
    <Container fluid style={{ padding: '16px 20px', background: 'var(--color-bodyBg)', minHeight: '100vh' }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #4facfe, #00f2fe)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(79,172,254,0.3)' }}>
              <FiDollarSign size={20} color="white" />
            </div>
            <div>
              <div style={{ fontWeight: '700', fontSize: '16px', color: 'var(--color-text)' }}>Mes Paiements</div>
              <small style={{ color: 'var(--color-textSecondary)' }}>{user?.first_name} {user?.last_name} · {user?.matricule || user?.email}</small>
            </div>
          </div>
          <Button size="sm" variant="outline-secondary" onClick={loadMyFees} style={{ borderRadius: '8px' }}>
            <FiRefreshCw size={13} />
          </Button>
        </div>
      </motion.div>

      {/* Summary card */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 0.1 } }} style={{ marginBottom: '20px' }}>
        <Card style={{ border: 'none', borderRadius: '14px', background: 'linear-gradient(135deg, #1e3a5f, #0d6efd)', boxShadow: '0 6px 20px rgba(13,110,253,0.25)', overflow: 'hidden' }}>
          <Card.Body style={{ padding: '20px 24px' }}>
            <Row className="g-3 align-items-center">
              {[
                { label: 'Total dû',       val: fmtCur(totals.due, mainCurrency),       color: '#fff' },
                { label: 'Payé',           val: fmtCur(totals.paid, mainCurrency),      color: '#6ee7b7' },
                { label: 'Reste à payer',  val: fmtCur(totals.remaining, mainCurrency), color: totals.remaining > 0 ? '#fca5a5' : '#6ee7b7' },
              ].map(s => (
                <Col md={4} key={s.label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', fontWeight: '600', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>{s.label}</div>
                  <div style={{ fontSize: '26px', fontWeight: '900', color: s.color }}>{s.val}</div>
                </Col>
              ))}
            </Row>
            <div style={{ marginTop: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>Progression globale</span>
                <span style={{ fontWeight: '800', color: '#fff', fontSize: '14px' }}>{pct}%</span>
              </div>
              <ProgressBar now={pct} style={{ height: '8px', borderRadius: '4px', background: 'rgba(255,255,255,0.2)' }}
                variant={pct >= 100 ? 'success' : pct >= 50 ? 'warning' : 'danger'} />
            </div>
          </Card.Body>
        </Card>
      </motion.div>

      {/* Fees list */}
      {myFees.length === 0 ? (
        <Card style={{ border: 'none', borderRadius: '12px', background: 'var(--color-cardBg)', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <Card.Body style={{ textAlign: 'center', padding: '60px', color: 'var(--color-textSecondary)' }}>
            <FiCheckCircle size={40} style={{ opacity: 0.3, marginBottom: '12px' }} /><br />
            <div style={{ fontWeight: '600' }}>Aucun frais à payer pour le moment</div>
          </Card.Body>
        </Card>
      ) : (
        <Row className="g-3">
          {myFees.map((sf, idx) => {
            const cfg = STATUS_CFG[sf.status] || STATUS_CFG.impaye
            const StatusIcon = cfg.icon
            const pctFee = sf.payment_percentage ?? 0
            const canPay = sf.status !== 'paye' && sf.status !== 'annule' && parseFloat(sf.amount_remaining) > 0
            return (
              <Col xs={12} md={6} xl={4} key={sf.id}>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
                  <Card style={{ border: `1.5px solid ${cfg.border}33`, borderRadius: '14px', background: 'var(--color-cardBg)', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', overflow: 'hidden', height: '100%' }}>
                    <div style={{ height: '4px', background: `linear-gradient(90deg, ${cfg.border}, ${cfg.border}66)` }} />
                    <Card.Body style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                        <div style={{ flex: 1, paddingRight: '8px' }}>
                          <div style={{ fontWeight: '700', fontSize: '14px', color: 'var(--color-text)', lineHeight: 1.3 }}>
                            {sf.fee_name || sf.fee_campaign_name || 'Frais étudiants'}
                          </div>
                          {sf.fee_type_name && <div style={{ fontSize: '11px', color: 'var(--color-textSecondary)', marginTop: '2px' }}>{sf.fee_type_name}</div>}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px', borderRadius: '8px', background: cfg.bg, color: cfg.text, fontSize: '11px', fontWeight: '700', whiteSpace: 'nowrap' }}>
                          <StatusIcon size={11} /> {cfg.label}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                        {[
                          { label: 'Total dû', val: fmtCur(sf.total_amount, sf.fee_campaign_currency), color: 'var(--color-text)' },
                          { label: 'Payé', val: fmtCur(sf.amount_paid, sf.fee_campaign_currency), color: '#198754' },
                          { label: 'Reste', val: fmtCur(sf.amount_remaining, sf.fee_campaign_currency), color: parseFloat(sf.amount_remaining) > 0 ? '#dc3545' : '#198754' },
                        ].map(s => (
                          <div key={s.label} style={{ flex: 1, background: 'var(--color-bodyBg)', borderRadius: '8px', padding: '8px', textAlign: 'center' }}>
                            <div style={{ fontSize: '11px', color: 'var(--color-textSecondary)', marginBottom: '2px' }}>{s.label}</div>
                            <div style={{ fontWeight: '800', fontSize: '14px', color: s.color }}>{s.val}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{ marginBottom: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontSize: '11px', color: 'var(--color-textSecondary)' }}>Progression</span>
                          <span style={{ fontSize: '11px', fontWeight: '700', color: cfg.text }}>{pctFee.toFixed(0)}%</span>
                        </div>
                        <ProgressBar now={pctFee} style={{ height: '6px', borderRadius: '3px' }}
                          variant={pctFee >= 100 ? 'success' : pctFee > 0 ? 'warning' : 'danger'} />
                      </div>
                      {sf.due_date && (
                        <div style={{ fontSize: '11px', color: 'var(--color-textSecondary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <FiClock size={11} /> Échéance : <strong style={{ color: 'var(--color-text)' }}>{sf.due_date}</strong>
                        </div>
                      )}
                      {canPay && (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <Button size="sm" onClick={() => openMM(sf)}
                            style={{ flex: 1, borderRadius: '8px', background: 'linear-gradient(135deg, #FFCC00, #FF9500)', border: 'none', color: '#1a1a1a', fontWeight: '700', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', padding: '8px' }}>
                            <FiSmartphone size={13} /> Mobile Money
                          </Button>
                          <Button size="sm" variant="outline-secondary" onClick={() => handleGenerateBon(sf)}
                            style={{ flex: 1, borderRadius: '8px', fontWeight: '700', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', padding: '8px' }}>
                            <FiPrinter size={13} /> BON de paiement
                          </Button>
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                </motion.div>
              </Col>
            )
          })}
        </Row>
      )}

      {/* ══ MODAL: Mobile Money ══ */}
      <Modal show={showMMModal} onHide={() => setShowMMModal(false)} centered>
        <Modal.Header closeButton style={{ background: 'var(--color-cardBg)', borderBottom: '1px solid var(--color-border)' }}>
          <Modal.Title style={{ fontWeight: '700', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FiSmartphone style={{ color: '#FFCC00' }} /> Paiement Mobile Money
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ background: 'var(--color-cardBg)', padding: '20px' }}>
          {mmResult ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <div style={{ fontSize: '50px', marginBottom: '12px' }}>✅</div>
              <div style={{ fontWeight: '800', fontSize: '18px', color: '#198754', marginBottom: '8px' }}>Paiement confirmé !</div>
              <div style={{ background: '#d1fae5', borderRadius: '10px', padding: '12px 16px', marginBottom: '16px' }}>
                <div style={{ fontFamily: 'monospace', fontSize: '15px', fontWeight: '700', color: '#065f46' }}>{mmResult.payment?.reference}</div>
                <div style={{ fontSize: '12px', color: '#047857', marginTop: '4px' }}>Transaction ID : {mmResult.transaction_id}</div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#059669', marginTop: '6px' }}>{fmtCur(mmResult.payment?.amount, selectedSF?.fee_campaign_currency)} payés</div>
              </div>
              <Button onClick={() => setShowMMModal(false)}
                style={{ borderRadius: '8px', background: 'linear-gradient(135deg, #43e97b, #38f9d7)', border: 'none', fontWeight: '700', color: '#155724' }}>
                Fermer
              </Button>
            </div>
          ) : (
            <>
              {selectedSF && (
                <div style={{ background: 'var(--color-bodyBg)', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontSize: '13px' }}>
                  <div style={{ fontWeight: '600', color: 'var(--color-text)' }}>{selectedSF.fee_name || selectedSF.fee_campaign_name}</div>
                  <div style={{ color: 'var(--color-textSecondary)', fontSize: '12px' }}>Reste : <strong style={{ color: '#dc3545', fontSize: '14px' }}>{fmtCur(selectedSF.amount_remaining, selectedSF.fee_campaign_currency)}</strong></div>
                </div>
              )}
              <Form onSubmit={handleMMPay}>
                <Form.Group style={{ marginBottom: '14px' }}>
                  <Form.Label style={{ fontWeight: '600', fontSize: '12px', color: 'var(--color-text)', display: 'block', marginBottom: '8px' }}>Choisissez votre réseau *</Form.Label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {MM_PROVIDERS.map(p => (
                      <button key={p.id} type="button" onClick={() => setMmProvider(p.id)}
                        style={{ padding: '10px', borderRadius: '10px', border: `2px solid ${mmProvider === p.id ? p.color : 'var(--color-border)'}`, background: mmProvider === p.id ? `${p.color}22` : 'var(--color-bodyBg)', cursor: 'pointer', fontWeight: '700', fontSize: '12px', color: 'var(--color-text)', transition: 'all 0.15s', boxShadow: mmProvider === p.id ? `0 2px 10px ${p.color}44` : 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '28px', height: '16px', borderRadius: '4px', background: p.color, display: 'inline-block', flexShrink: 0 }} />
                        {p.label}
                      </button>
                    ))}
                  </div>
                </Form.Group>
                <Form.Group style={{ marginBottom: '14px' }}>
                  <Form.Label style={{ fontWeight: '600', fontSize: '12px', color: 'var(--color-text)', display: 'block', marginBottom: '4px' }}>Numéro de téléphone *</Form.Label>
                  <Form.Control type="tel" placeholder="ex: 0970 000 000" value={mmPhone} onChange={e => setMmPhone(e.target.value)}
                    style={{ borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bodyBg)', color: 'var(--color-text)', padding: '9px 12px', fontSize: '14px', fontFamily: 'monospace' }} />
                </Form.Group>
                <Form.Group style={{ marginBottom: '20px' }}>
                  <Form.Label style={{ fontWeight: '600', fontSize: '12px', color: 'var(--color-text)', display: 'block', marginBottom: '4px' }}>Montant ({selectedSF?.fee_campaign_currency || 'USD'}) *</Form.Label>
                  <Form.Control type="number" step="0.01" value={mmAmount} onChange={e => setMmAmount(e.target.value)}
                    style={{ borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bodyBg)', color: 'var(--color-text)', padding: '9px 12px', fontSize: '14px', fontWeight: '700' }} />
                </Form.Group>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <Button variant="outline-secondary" onClick={() => setShowMMModal(false)} style={{ flex: 1, borderRadius: '8px' }}>Annuler</Button>
                  <Button type="submit" disabled={mmPaying}
                    style={{ flex: 2, borderRadius: '8px', background: 'linear-gradient(135deg, #FFCC00, #FF9500)', border: 'none', color: '#1a1a1a', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px' }}>
                    {mmPaying ? <Spinner size="sm" /> : <FiSend size={14} />}
                    {mmPaying ? 'Traitement...' : `Payer ${fmtCur(mmAmount, selectedSF?.fee_campaign_currency)}`}
                  </Button>
                </div>
              </Form>
            </>
          )}
        </Modal.Body>
      </Modal>

      {/* ══ MODAL: BON de paiement ══ */}
      <Modal show={showBonModal} onHide={() => setShowBonModal(false)} centered size="md">
        <Modal.Header closeButton style={{ background: 'var(--color-cardBg)', borderBottom: '1px solid var(--color-border)' }}>
          <Modal.Title style={{ fontWeight: '700', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FiPrinter style={{ color: '#0d6efd' }} /> BON de Paiement
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ background: 'var(--color-cardBg)', padding: '20px' }}>
          {bonLoading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <Spinner />
              <div style={{ marginTop: '12px', color: 'var(--color-textSecondary)', fontSize: '13px' }}>Génération du BON...</div>
            </div>
          ) : !bonData && bonSF ? (
            /* ── Step 1: Form ── */
            <>
              <div style={{ background: 'var(--color-bodyBg)', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontSize: '13px' }}>
                <div style={{ fontWeight: '600', color: 'var(--color-text)' }}>{bonSF.fee_name || bonSF.fee_campaign_name || 'Frais étudiants'}</div>
                <div style={{ color: 'var(--color-textSecondary)', fontSize: '12px' }}>Reste à payer : <strong style={{ color: '#dc3545', fontSize: '14px' }}>{fmtCur(bonSF.amount_remaining, bonSF.fee_campaign_currency)}</strong></div>
              </div>
              <Form.Group style={{ marginBottom: '14px' }}>
                <Form.Label style={{ fontWeight: '600', fontSize: '12px', color: 'var(--color-text)' }}>Montant du BON ({bonSF?.fee_campaign_currency || 'USD'}) *</Form.Label>
                <Form.Control type="number" step="0.01" min="1" max={bonSF.amount_remaining} value={bonAmount} onChange={e => setBonAmount(e.target.value)}
                  style={{ borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bodyBg)', color: 'var(--color-text)', padding: '9px 12px', fontSize: '14px', fontWeight: '700' }} />
              </Form.Group>
              <Form.Group style={{ marginBottom: '20px' }}>
                <Form.Label style={{ fontWeight: '600', fontSize: '12px', color: 'var(--color-text)', display: 'block', marginBottom: '8px' }}>Moyen de paiement *</Form.Label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {BON_METHODS.map(m => (
                    <button key={m.id} type="button" onClick={() => setBonMethod(m.id)}
                      style={{ padding: '10px', borderRadius: '10px', border: `2px solid ${bonMethod === m.id ? '#0d6efd' : 'var(--color-border)'}`, background: bonMethod === m.id ? '#0d6efd11' : 'var(--color-bodyBg)', cursor: 'pointer', fontWeight: '600', fontSize: '12px', color: 'var(--color-text)', transition: 'all 0.15s' }}>
                      {m.label}
                    </button>
                  ))}
                </div>
              </Form.Group>
              <div style={{ display: 'flex', gap: '10px' }}>
                <Button variant="outline-secondary" onClick={() => setShowBonModal(false)} style={{ flex: 1, borderRadius: '8px' }}>Annuler</Button>
                <Button onClick={submitBon}
                  style={{ flex: 2, borderRadius: '8px', background: 'linear-gradient(135deg, #0d6efd, #0050d8)', border: 'none', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <FiPrinter size={14} /> Générer le BON
                </Button>
              </div>
            </>
          ) : bonData ? (
            <>
              <div ref={bonRef}>
                <div className="header" style={{ textAlign: 'center', borderBottom: '2px solid #0d6efd', paddingBottom: '12px', marginBottom: '16px' }}>
                  <div style={{ fontSize: '22px', fontWeight: '900', color: '#0d6efd', letterSpacing: '1px' }}>SYNTAX GU</div>
                  <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>Grandes Universités · Système de Gestion Académique et Décisionnelle</div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#1a1a1a', marginTop: '6px', background: '#f0f4ff', padding: '4px 12px', borderRadius: '6px', display: 'inline-block' }}>BON DE PAIEMENT</div>
                </div>
                <div className="bon-num" style={{ background: '#f0f4ff', border: '2px dashed #0d6efd', borderRadius: '10px', padding: '12px', textAlign: 'center', marginBottom: '16px' }}>
                  <div style={{ fontSize: '11px', color: '#0d6efd', fontWeight: '600', marginBottom: '4px' }}>N° BON</div>
                  <div className="code" style={{ fontSize: '20px', fontWeight: '900', fontFamily: 'monospace', color: '#0d6efd', letterSpacing: '3px' }}>{bonData.voucher_number}</div>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '12px', fontSize: '13px' }}>
                  <tbody>
                    {[
                      ['Étudiant', `${user?.last_name} ${user?.first_name}`],
                      ['Matricule', user?.matricule || user?.email || '—'],
                      ['Intitulé', bonData.description || '—'],
                      ['Bénéficiaire', bonData.beneficiary_name || 'Université Mazanza'],
                      ['Compte', bonData.beneficiary_account || 'U-MA-003434R-BD-8RE876'],
                      ['Moyen de paiement', bonData.payment_method_label || '—'],
                      ['Créé le', bonData.created_at ? new Date(bonData.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'],
                      ["Valide jusqu'au", bonData.expiry_date ? new Date(bonData.expiry_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'],
                    ].map(([k, v]) => (
                      <tr key={k}>
                        <td style={{ padding: '6px 10px', border: '1px solid #dee2e6', fontWeight: '600', background: '#f8f9fa', width: '45%', fontSize: '12px', color: '#444' }}>{k}</td>
                        <td style={{ padding: '6px 10px', border: '1px solid #dee2e6', fontSize: '13px' }}>{v}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="amount" style={{ background: '#d1fae5', border: '2px solid #059669', borderRadius: '10px', padding: '12px', textAlign: 'center', margin: '12px 0' }}>
                  <div style={{ fontSize: '11px', color: '#065f46', marginBottom: '4px', fontWeight: '600' }}>MONTANT À PAYER</div>
                  <div style={{ fontSize: '26px', fontWeight: '900', color: '#059669' }}>{fmtCur(bonData.amount, bonSF?.fee_campaign_currency)}</div>
                </div>
                <div className="warn" style={{ fontSize: '11px', color: '#dc3545', fontWeight: '600', textAlign: 'center', marginBottom: '8px' }}>
                  ⚠️ Ce bon expire le {bonData.expiry_date ? new Date(bonData.expiry_date).toLocaleDateString('fr-FR') : '—'}
                </div>
                <div className="footer" style={{ fontSize: '10px', color: '#888', textAlign: 'center', marginTop: '12px', borderTop: '1px dashed #ccc', paddingTop: '8px', lineHeight: 1.6 }}>
                  Présentez ce BON à la caisse ou à votre banque pour effectuer le paiement.<br />
                  SYNTAX GU · Système de Gestion Académique et Décisionnelle
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                <Button variant="outline-secondary" onClick={() => setShowBonModal(false)} style={{ flex: 1, borderRadius: '8px' }}>Fermer</Button>
                <Button onClick={handlePrintBon}
                  style={{ flex: 2, borderRadius: '8px', background: 'linear-gradient(135deg, #0d6efd, #0050d8)', border: 'none', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <FiPrinter size={14} /> Imprimer / Sauvegarder PDF
                </Button>
              </div>
            </>
          ) : null}
        </Modal.Body>
      </Modal>
    </Container>
  )
}

export default Paiements
