/**
 * 💰 VALIDATION PAIEMENT
 * Composant pour valider un paiement avec bordereau bancaire (SGA/Admin)
 */

import { useState } from 'react'
import { Modal, Form, Button, Alert, Spinner } from 'react-bootstrap'
import { FiCheck, FiX } from 'react-icons/fi'
import paymentService from '../../services/paymentService'

const ValidationPaiement = ({ voucher, show, onHide, onSuccess }) => {
  const [formData, setFormData] = useState({
    bank_slip_number: '',
    bank_slip_date: '',
    payment_method: 'virement',
    transaction_reference: '',
    send_email: true
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.bank_slip_number || !formData.bank_slip_date) {
      setError('Le numéro et la date du bordereau sont requis')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await paymentService.validatePayment(voucher.id, formData)

      setLoading(false)

      if (onSuccess) {
        onSuccess(response.data)
      }

      onHide()
    } catch (err) {
      console.error('Error validating payment:', err)
      setError(err.response?.data?.error || 'Erreur lors de la validation du paiement')
      setLoading(false)
    }
  }

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>✅ Valider le Paiement</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger" dismissible onClose={() => setError(null)}>{error}</Alert>}

        <div className="mb-3 p-3" style={{ background: 'var(--color-bodyBg)', borderRadius: '8px' }}>
          <h6>Bon de Paiement #{voucher?.voucher_number}</h6>
          <p className="mb-1"><strong>Étudiant:</strong> {voucher?.student_name}</p>
          <p className="mb-1"><strong>Type de frais:</strong> {voucher?.fee_type_name}</p>
          <p className="mb-0"><strong>Montant:</strong> {voucher?.amount} FCFA</p>
        </div>

        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Numéro de Bordereau Bancaire *</Form.Label>
            <Form.Control
              type="text"
              name="bank_slip_number"
              value={formData.bank_slip_number}
              onChange={handleChange}
              placeholder="Ex: BORDEREAU-2024-001"
              required
            />
            <Form.Text className="text-muted">
              Numéro du bordereau fourni par la banque
            </Form.Text>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Date du Bordereau *</Form.Label>
            <Form.Control
              type="date"
              name="bank_slip_date"
              value={formData.bank_slip_date}
              onChange={handleChange}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Méthode de Paiement</Form.Label>
            <Form.Select
              name="payment_method"
              value={formData.payment_method}
              onChange={handleChange}
            >
              <option value="virement">Virement Bancaire</option>
              <option value="especes">Espèces</option>
              <option value="cheque">Chèque</option>
              <option value="mobile_money">Mobile Money</option>
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Référence de Transaction (optionnel)</Form.Label>
            <Form.Control
              type="text"
              name="transaction_reference"
              value={formData.transaction_reference}
              onChange={handleChange}
              placeholder="Ex: TRX-123456789"
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Check
              type="checkbox"
              name="send_email"
              label="Envoyer automatiquement le reçu par email à l'étudiant"
              checked={formData.send_email}
              onChange={handleChange}
            />
          </Form.Group>

          <Alert variant="info">
            <strong>ℹ️ Information</strong>
            <p className="mb-0 mt-2">
              Une fois validé, un reçu PDF avec QR Code sera généré automatiquement.
              L'étudiant pourra télécharger son reçu et le vérifier via le QR Code.
            </p>
          </Alert>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={loading}>
          <FiX className="me-2" />
          Annuler
        </Button>
        <Button variant="success" onClick={handleSubmit} disabled={loading}>
          {loading ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              Validation en cours...
            </>
          ) : (
            <>
              <FiCheck className="me-2" />
              Valider le Paiement
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

export default ValidationPaiement
