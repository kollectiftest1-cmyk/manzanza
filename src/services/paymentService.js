/**
 * Service API pour la gestion des paiements (bons, reçus, vérification)
 */
import api from './api'

export const paymentService = {
  // Bons de paiement (Vouchers)
  getVouchers: (params) => api.get('/payments/vouchers/', { params }),

  getVoucher: (id) => api.get(`/payments/vouchers/${id}/`),

  createVoucher: (data) => api.post('/payments/vouchers/create-voucher/', data),

  validatePayment: (id, data) => api.post(`/payments/vouchers/${id}/validate-payment/`, data),

  cancelVoucher: (id, reason) => api.post(`/payments/vouchers/${id}/cancel/`, { reason }),

  // Reçus (Receipts)
  getReceipts: (params) => api.get('/payments/receipts/', { params }),

  getReceipt: (id) => api.get(`/payments/receipts/${id}/`),

  downloadReceiptPDF: (id) => api.get(`/payments/receipts/${id}/download-pdf/`, {
    responseType: 'blob'
  }),

  // Vérification publique (sans auth)
  verifyReceipt: (verificationCode) => {
    // Appel public sans token
    const publicApi = api.create()
    delete publicApi.defaults.headers.common['Authorization']
    return publicApi.get(`/payments/verify-receipt/${verificationCode}/`)
  },

  // Audit Logs
  getAuditLogs: (params) => api.get('/payments/audit-logs/', { params }),

  // Frais étudiants (StudentFee)
  getStudentFees: (params) => api.get('/payments/student-fees/', { params }),

  createStudentFee: (data) => api.post('/payments/student-fees/', data),

  updateStudentFee: (id, data) => api.put(`/payments/student-fees/${id}/`, data),
}

export default paymentService
