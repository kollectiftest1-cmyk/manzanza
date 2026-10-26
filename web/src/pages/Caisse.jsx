/**
 * Page Caisse — Workflow complet du caissier
 * ===========================================
 * 1. Saisir le numéro du BON
 * 2. Voir les détails (étudiant, montant, frais)
 * 3. Valider le paiement (bordereau bancaire)
 * 4. Historique des bons récents
 */
import { useState, useEffect, useRef } from "react"
import { Container, Row, Col, Card, Form, Button, InputGroup, Table, Badge, Spinner, Modal, Alert } from "react-bootstrap"
import { motion, AnimatePresence } from "framer-motion"
import { FiSearch, FiCheckCircle, FiXCircle, FiClock, FiDollarSign, FiUser, FiHash, FiPrinter, FiRefreshCw } from "react-icons/fi"
import { useSearchParams } from "react-router-dom"
import { toast } from "react-toastify"
import { paymentService } from "../services/paymentService"
import { Link } from "react-router-dom"
import { financeAPI } from "../services/api"
import { notifyError } from "../utils/notify"

const Caisse = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [code, setCode] = useState('')
  const [searching, setSearching] = useState(false)
  const [voucher, setVoucher] = useState(null)
  const [error, setError] = useState('')

  // Validation modal
  const [showValidate, setShowValidate] = useState(false)
  const [validating, setValidating] = useState(false)
  const [bankSlip, setBankSlip] = useState('')
  const [bankSlipDate, setBankSlipDate] = useState('')
  const [transactionRef, setTransactionRef] = useState('')

  // History
  const [vouchers, setVouchers] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [historyFilter, setHistoryFilter] = useState('all')

  // Receipt after validation
  const [receipt, setReceipt] = useState(null)
  // Session de caisse : obligatoire pour encaisser des espèces
  const [cashSession, setCashSession] = useState(undefined)
  useEffect(() => { financeAPI.currentCashSession().then(({ data }) => setCashSession(data)).catch(() => setCashSession(null)) }, [])

  const inputRef = useRef(null)

  // On mount, load history and auto-lookup if code in URL
  useEffect(() => {
    loadHistory()
    const urlCode = searchParams.get('code')
    if (urlCode) {
      setCode(urlCode)
      doLookup(urlCode)
    } else {
      inputRef.current?.focus()
    }
  }, [])

  const loadHistory = async () => {
    try {
      const res = await paymentService.getVouchers({ ordering: '-created_at' })
      setVouchers(res.data?.results || res.data || [])
    } catch {
      // silent
    } finally {
      setLoadingHistory(false)
    }
  }

  const doLookup = async (lookupCode) => {
    const c = (lookupCode || code).trim()
    if (!c) return
    setSearching(true)
    setError('')
    setVoucher(null)
    setReceipt(null)
    try {
      const res = await paymentService.lookupVoucher(c)
      setVoucher(res.data)
      setSearchParams({ code: c })
    } catch (err) {
      const msg = err.response?.data?.error || 'BON introuvable'
      notifyError(err, msg)
    } finally {
      setSearching(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    doLookup()
  }

  const handleValidate = async () => {
    const isBank = voucher?.payment_method === 'virement'
    if (isBank && (!bankSlip.trim() || !bankSlipDate)) {
      toast.warning('Veuillez remplir le bordereau et la date pour un virement bancaire')
      return
    }
    setValidating(true)
    try {
      const res = await paymentService.validatePayment(voucher.id, {
        bank_slip_number: bankSlip.trim() || undefined,
        bank_slip_date: bankSlipDate || undefined,
        transaction_reference: transactionRef.trim() || undefined,
      })
      toast.success('Paiement validé avec succès !')
      setVoucher(res.data.voucher)
      setReceipt(res.data.receipt)
      setShowValidate(false)
      setBankSlip('')
      setBankSlipDate('')
      setTransactionRef('')
      loadHistory()
    } catch (err) {
      notifyError(err, err.response?.data?.error || 'Erreur de validation')
    } finally {
      setValidating(false)
    }
  }

  const handleCancel = async () => {
    if (!window.confirm('Annuler ce bon de paiement ?')) return
    try {
      const res = await paymentService.cancelVoucher(voucher.id, 'Annulé par le caissier')
      toast.info('Bon annulé')
      setVoucher(res.data.voucher)
      loadHistory()
    } catch (err) {
      notifyError(err, err.response?.data?.error || 'Erreur')
    }
  }

  const handleReset = () => {
    setCode('')
    setVoucher(null)
    setError('')
    setReceipt(null)
    setSearchParams({})
    inputRef.current?.focus()
  }

  const printReceipt = () => {
    if (!receipt) return
    const w = window.open('', '_blank')
    const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]))
    w.document.write(`
      <html><head><title>Reçu ${esc(receipt.receipt_number)}</title>
      <style>body{font-family:Arial;padding:40px;max-width:600px;margin:auto}
      h1{text-align:center;border-bottom:2px solid #333;padding-bottom:10px}
      table{width:100%;border-collapse:collapse;margin:20px 0}
      td{padding:8px;border-bottom:1px solid #eee}
      td:first-child{font-weight:bold;width:40%}
      .footer{text-align:center;margin-top:30px;color:#666;font-size:12px}
      </style></head><body>
      <h1>REÇU DE PAIEMENT</h1>
      <p style="text-align:center;font-size:18px;color:#333">${esc(receipt.receipt_number)}</p>
      <table>
        <tr><td>Étudiant</td><td>${esc(voucher?.student_name || '-')}</td></tr>
        <tr><td>Matricule</td><td>${esc(voucher?.student_matricule || '-')}</td></tr>
        <tr><td>Frais</td><td>${esc(voucher?.fee_type_name || '-')}</td></tr>
        <tr><td>Montant</td><td><strong>${formatMoney(receipt.amount_paid, voucher?.currency)}</strong></td></tr>
        <tr><td>Méthode</td><td>${esc(receipt.payment_method || '-')}</td></tr>
        <tr><td>Date</td><td>${new Date(receipt.payment_date).toLocaleDateString('fr-FR')}</td></tr>
        <tr><td>N° Bordereau</td><td>${esc(receipt.bank_slip_number || '-')}</td></tr>
      </table>
      <p class="footer">Université MAZANZA — Document généré automatiquement<br/>Code vérification: ${esc(receipt.verification_code || '-')}</p>
      </body></html>
    `)
    w.document.close()
    w.print()
  }

  const formatMoney = (v, currency) => {
    if (!v) return currency === 'CDF' ? '0 FC' : '$0.00'
    if (currency === 'CDF') return Number(v).toLocaleString('fr-FR') + ' FC'
    return '$' + Number(v).toFixed(2)
  }

  const methodLabel = (m) => {
    const map = { especes: 'Espèces', virement: 'Virement bancaire', cheque: 'Chèque', mobile_money: 'Mobile Money' }
    return map[m] || m || '-'
  }

  const statusBadge = (s) => {
    const map = { pending: ['warning', 'En attente'], paid: ['success', 'Payé'], cancelled: ['danger', 'Annulé'], expired: ['secondary', 'Expiré'] }
    const [bg, label] = map[s] || ['secondary', s]
    return <Badge bg={bg}>{label}</Badge>
  }

  const filteredVouchers = historyFilter === 'all'
    ? vouchers
    : vouchers.filter(v => v.status === historyFilter)

  return (
    <Container fluid style={{ padding: '24px', background: 'var(--color-bodyBg)', minHeight: '100vh' }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-textPrimary)' }}>
          <FiDollarSign className="me-2" />Caisse — Validation de Paiements
        </h2>
        <p style={{ color: 'var(--color-textSecondary)', margin: 0 }}>
          Saisissez le numéro du BON de paiement pour valider
        </p>
      </motion.div>

      {cashSession !== undefined && (
        <div className={`mz-banner mb-3 ${cashSession ? 'mz-banner--success' : 'mz-banner--error'}`}>
          <span style={{ flex: 1 }}>
            {cashSession
              ? <>Session de caisse ouverte depuis le {new Date(cashSession.opened_at).toLocaleString('fr-FR')} — {cashSession.payments_count} encaissement(s).</>
              : <>Aucune session de caisse ouverte : les paiements en espèces seront refusés.</>}
          </span>
          <Link to="/finances" className="btn btn-sm btn-outline-primary">{cashSession ? 'Clôturer / voir ma caisse' : 'Ouvrir ma caisse'}</Link>
        </div>
      )}

      {/* Search Bar */}
      <Row className="mb-4">
        <Col lg={8}>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card style={{ borderRadius: '12px', border: '2px solid var(--color-primary)', boxShadow: '0 4px 20px rgba(78,115,223,0.15)' }}>
              <Card.Body className="p-4">
                <Form onSubmit={handleSearch}>
                  <InputGroup size="lg">
                    <InputGroup.Text style={{ background: 'var(--color-primary)', color: '#fff', border: 'none' }}>
                      <FiSearch size={20} />
                    </InputGroup.Text>
                    <Form.Control
                      ref={inputRef}
                      placeholder="Numéro du BON (ex: BON-20250615-12345)"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      style={{ fontSize: '1.1rem', border: '1px solid var(--color-border)' }}
                      autoFocus
                    />
                    <Button type="submit" variant="primary" disabled={searching || !code.trim()} style={{ minWidth: 140 }}>
                      {searching ? <Spinner size="sm" /> : 'Rechercher'}
                    </Button>
                    {voucher && (
                      <Button variant="outline-secondary" onClick={handleReset} title="Nouveau">
                        <FiRefreshCw />
                      </Button>
                    )}
                  </InputGroup>
                </Form>
              </Card.Body>
            </Card>
          </motion.div>
        </Col>
      </Row>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            <Row className="mb-4">
              <Col lg={8}>
                <Alert variant="danger" onClose={() => setError('')} dismissible>
                  <FiXCircle className="me-2" />{error}
                </Alert>
              </Col>
            </Row>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Voucher Details */}
      <AnimatePresence>
        {voucher && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            <Row className="mb-4">
              <Col lg={8}>
                <Card style={{ borderRadius: '12px', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
                  <Card.Header style={{
                    background: voucher.status === 'paid' ? 'linear-gradient(135deg, #1cc88a, #17a673)' :
                                voucher.status === 'pending' ? 'linear-gradient(135deg, #f6c23e, #dda20a)' :
                                'linear-gradient(135deg, #e74a3b, #c0392b)',
                    color: '#fff', padding: '16px 24px'
                  }}>
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h5 className="m-0 text-white"><FiHash className="me-2" />{voucher.voucher_number}</h5>
                        <small className="text-white-50">Créé le {new Date(voucher.created_at).toLocaleDateString('fr-FR')}</small>
                      </div>
                      <div>{statusBadge(voucher.status)}</div>
                    </div>
                  </Card.Header>
                  <Card.Body className="p-4">
                    <Row>
                      <Col md={6}>
                        <h6 className="text-muted mb-3"><FiUser className="me-2" />Informations Étudiant</h6>
                        <table className="w-100 mb-3">
                          <tbody>
                            <tr><td className="text-muted py-1" style={{ width: '40%' }}>Nom</td><td className="fw-bold py-1">{voucher.student_name || '-'}</td></tr>
                            <tr><td className="text-muted py-1">Matricule</td><td className="fw-bold py-1">{voucher.student_matricule || '-'}</td></tr>
                            <tr><td className="text-muted py-1">Email</td><td className="py-1">{voucher.student_email || '-'}</td></tr>
                          </tbody>
                        </table>
                      </Col>
                      <Col md={6}>
                        <h6 className="text-muted mb-3"><FiDollarSign className="me-2" />Détails du Paiement</h6>
                        <table className="w-100 mb-3">
                          <tbody>
                            <tr><td className="text-muted py-1" style={{ width: '40%' }}>Type de frais</td><td className="fw-bold py-1">{voucher.fee_type_name || '-'}</td></tr>
                            <tr><td className="text-muted py-1">Montant</td><td className="py-1" style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-primary)' }}>{formatMoney(voucher.amount, voucher.currency)}</td></tr>
                            <tr><td className="text-muted py-1">Moyen de paiement</td><td className="fw-bold py-1">{methodLabel(voucher.payment_method)}</td></tr>
                            <tr><td className="text-muted py-1">Bénéficiaire</td><td className="py-1">{voucher.beneficiary_name}</td></tr>
                            <tr><td className="text-muted py-1">Expiration</td><td className="py-1">{voucher.expiry_date ? new Date(voucher.expiry_date).toLocaleDateString('fr-FR') : '-'}</td></tr>
                          </tbody>
                        </table>
                      </Col>
                    </Row>

                    {voucher.status === 'paid' && (
                      <Alert variant="success" className="mt-2 mb-0">
                        <FiCheckCircle className="me-2" />
                        Payé le {voucher.paid_date ? new Date(voucher.paid_date).toLocaleDateString('fr-FR') : '-'} — {methodLabel(voucher.payment_method)}
                        {voucher.bank_slip_number && <> — Bordereau: {voucher.bank_slip_number}</>}
                        {voucher.validated_by_name && <> — Par: {voucher.validated_by_name}</>}
                      </Alert>
                    )}
                  </Card.Body>

                  {/* Action Buttons */}
                  {voucher.status === 'pending' && (
                    <Card.Footer className="d-flex gap-2 p-3" style={{ background: 'var(--color-cardBg)' }}>
                      <Button variant="success" size="lg" className="flex-grow-1" onClick={() => setShowValidate(true)}>
                        <FiCheckCircle className="me-2" />Valider le Paiement
                      </Button>
                      <Button variant="outline-danger" onClick={handleCancel}>
                        <FiXCircle className="me-2" />Annuler
                      </Button>
                    </Card.Footer>
                  )}

                  {receipt && (
                    <Card.Footer className="d-flex gap-2 p-3" style={{ background: '#d4edda' }}>
                      <Button variant="success" onClick={printReceipt}>
                        <FiPrinter className="me-2" />Imprimer le Reçu
                      </Button>
                      <span className="align-self-center text-success">
                        <FiCheckCircle className="me-2" />Reçu N° {receipt.receipt_number}
                      </span>
                    </Card.Footer>
                  )}
                </Card>
              </Col>
            </Row>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Validation Modal */}
      <Modal show={showValidate} onHide={() => setShowValidate(false)} centered>
        <Modal.Header closeButton style={{ background: 'var(--color-cardBg)' }}>
          <Modal.Title>Valider le Paiement</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {voucher && (
            <Alert variant="info" className="mb-3">
              <strong>{voucher.voucher_number}</strong> — {voucher.student_name}<br />
              Montant: <strong>{formatMoney(voucher.amount, voucher.currency)}</strong><br />
              Moyen: <strong>{methodLabel(voucher.payment_method)}</strong>
            </Alert>
          )}
          {voucher?.payment_method === 'virement' && (
            <>
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold">N° Bordereau bancaire *</Form.Label>
                <Form.Control value={bankSlip} onChange={(e) => setBankSlip(e.target.value)} placeholder="Ex: BRD-2025-001" />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold">Date du bordereau *</Form.Label>
                <Form.Control type="date" value={bankSlipDate} onChange={(e) => setBankSlipDate(e.target.value)} />
              </Form.Group>
            </>
          )}
          <Form.Group className="mb-3">
            <Form.Label>Référence transaction (optionnel)</Form.Label>
            <Form.Control value={transactionRef} onChange={(e) => setTransactionRef(e.target.value)} placeholder="Ex: TXN-12345" />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowValidate(false)}>Annuler</Button>
          <Button variant="success" onClick={handleValidate} disabled={validating}>
            {validating ? <Spinner size="sm" className="me-2" /> : <FiCheckCircle className="me-2" />}
            Confirmer le Paiement
          </Button>
        </Modal.Footer>
      </Modal>

      {/* History */}
      <Row>
        <Col lg={12}>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card style={{ borderRadius: '12px', border: '1px solid var(--color-border)' }}>
              <Card.Header className="d-flex justify-content-between align-items-center flex-wrap gap-2" style={{ background: 'var(--color-cardBg)' }}>
                <h5 className="m-0" style={{ fontWeight: 600 }}>Historique des Bons</h5>
                <div className="d-flex gap-2">
                  {['all', 'pending', 'paid', 'cancelled'].map(f => (
                    <Button key={f} size="sm" variant={historyFilter === f ? 'primary' : 'outline-secondary'} onClick={() => setHistoryFilter(f)}>
                      {{ all: 'Tous', pending: 'En attente', paid: 'Payés', cancelled: 'Annulés' }[f]}
                    </Button>
                  ))}
                  <Button size="sm" variant="outline-primary" onClick={loadHistory}><FiRefreshCw /></Button>
                </div>
              </Card.Header>
              <Card.Body className="p-0">
                {loadingHistory ? (
                  <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
                ) : filteredVouchers.length > 0 ? (
                  <Table responsive hover className="mb-0">
                    <thead>
                      <tr>
                        <th>N° BON</th>
                        <th>Étudiant</th>
                        <th>Frais</th>
                        <th>Montant</th>
                        <th>Statut</th>
                        <th>Date</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredVouchers.map(v => (
                        <tr key={v.id}>
                          <td><code>{v.voucher_number}</code></td>
                          <td>{v.student_name || '-'}</td>
                          <td>{v.fee_type_name || '-'}</td>
                          <td><strong>{formatMoney(v.amount, v.currency)}</strong></td>
                          <td>{statusBadge(v.status)}</td>
                          <td>{v.created_at ? new Date(v.created_at).toLocaleDateString('fr-FR') : '-'}</td>
                          <td>
                            {v.status === 'pending' && (
                              <Button size="sm" variant="outline-success" onClick={() => { setCode(v.voucher_number); doLookup(v.voucher_number) }}>
                                <FiSearch size={14} /> Ouvrir
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                ) : (
                  <div className="text-center py-5 text-muted">
                    <FiClock size={48} className="mb-3" style={{ opacity: 0.3 }} />
                    <p>Aucun bon de paiement</p>
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

export default Caisse
