/**
 * Service API pour la gestion des paiements — frais, campagnes, mobile money, bons
 */
import api from './api'

export const paymentService = {
  // ─── Fee Categories (FeeType) ────────────────────────────────────────────
  getFeeTypes: (params) => api.get('/payments/fee-types/', { params }),
  createFeeType: (data) => api.post('/payments/fee-types/', data),
  updateFeeType: (id, data) => api.patch(`/payments/fee-types/${id}/`, data),
  deleteFeeType: (id) => api.delete(`/payments/fee-types/${id}/`),

  // ─── Fee Campaigns ───────────────────────────────────────────────────────
  getFees: (params) => api.get('/payments/fees/', { params }),
  getFee: (id) => api.get(`/payments/fees/${id}/`),
  createFee: (data) => api.post('/payments/fees/', data),
  updateFee: (id, data) => api.patch(`/payments/fees/${id}/`, data),
  deleteFee: (id) => api.delete(`/payments/fees/${id}/`),
  assignFee: (id) => api.post(`/payments/fees/${id}/assign/`),
  getFeeStudents: (id) => api.get(`/payments/fees/${id}/students/`),
  getFeeDashboard: () => api.get('/payments/fees/dashboard/'),

  // ─── Student Fees ────────────────────────────────────────────────────────
  getStudentFees: (params) => api.get('/payments/student-fees/', { params }),
  getMyFees: () => api.get('/payments/student-fees/my_fees/'),
  createStudentFee: (data) => api.post('/payments/student-fees/', data),
  updateStudentFee: (id, data) => api.patch(`/payments/student-fees/${id}/`, data),

  // ─── Payments ────────────────────────────────────────────────────────────
  getPayments: (params) => api.get('/payments/', { params }),
  createPayment: (data) => api.post('/payments/', data),
  confirmPayment: (id) => api.post(`/payments/${id}/confirm/`),
  // Le motif est obligatoire (traçabilité) : demandé à la caisse si absent.
  rejectPayment: (id, reason) => api.post(`/payments/${id}/reject/`, { reason: reason ?? window.prompt("Motif du rejet du paiement :") ?? "" }),

  // Mobile Money : la demande reste « en attente » jusqu’à vérification (jamais confirmée automatiquement)
  mobileMoneyPay: (data) => api.post('/payments/mobile-money/', data),

  // ─── Vouchers (Bons de paiement) ─────────────────────────────────────────
  getVouchers: (params) => api.get('/payments/vouchers/', { params }),
  getVoucher: (id) => api.get(`/payments/vouchers/${id}/`),
  createVoucher: (data) => api.post('/payments/vouchers/create-voucher/', data),
  validatePayment: (id, data) => api.post(`/payments/vouchers/${id}/validate-payment/`, data),
  cancelVoucher: (id, reason) => api.post(`/payments/vouchers/${id}/cancel/`, { reason }),
  lookupVoucher: (code) => api.get('/payments/vouchers/lookup/', { params: { code } }),
  getCaisseStats: () => api.get('/payments/vouchers/caisse-stats/'),

  // ─── Receipts ────────────────────────────────────────────────────────────
  getReceipts: (params) => api.get('/payments/receipts/', { params }),
  getReceipt: (id) => api.get(`/payments/receipts/${id}/`),
  downloadReceiptPDF: (id) => api.get(`/payments/receipts/${id}/download-pdf/`, { responseType: 'blob' }),
}

export default paymentService
