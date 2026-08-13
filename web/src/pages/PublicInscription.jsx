"use client"

import { Container, Row, Col, Card } from "react-bootstrap"
import { Link } from "react-router-dom"
import { motion } from "framer-motion"
import { FiClipboard, FiLogIn } from "react-icons/fi"
import MultiStepForm from "../components/Inscription/MultiStepForm"

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

const PublicInscription = () => {
  return (
    <div style={{
      background: 'var(--color-bodyBg)',
      minHeight: 'calc(100vh - 70px)',
      paddingBottom: '40px',
      color: 'var(--color-textPrimary)'
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
        color: 'white',
        padding: '40px 24px',
        textAlign: 'center',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <img
            src="/logo.jpeg"
            alt="Université MAZANZA"
            style={{
              width: '80px',
              height: '80px',
              objectFit: 'contain',
              margin: '0 auto 16px',
              display: 'block',
              filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))'
            }}
          />
          <h3 style={{ margin: 0, fontSize: '28px', fontWeight: '700' }}>
            Université MAZANZA
          </h3>
          <p style={{ margin: '8px 0 12px', opacity: 0.95, fontSize: '16px', fontWeight: '500' }}>
            Formulaire de Pré-inscription
          </p>
          <p style={{ margin: '0', opacity: 0.9, fontSize: '14px' }}>
            Complétez les étapes ci-dessous pour soumettre votre demande
          </p>
        </motion.div>
      </div>

      {/* Main Content - Full Width, Natural Scroll */}
      <Container style={{ marginTop: '40px', maxWidth: '1000px' }}>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants}>
            <Card style={{
              background: 'var(--color-cardBg)',
              border: '1px solid var(--color-border)',
              borderRadius: '16px',
              boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
              padding: '32px',
              marginBottom: '24px'
            }}>
              <MultiStepForm />
            </Card>

            {/* Footer Link */}
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <Link
                to="/login"
                style={{
                  color: 'var(--color-primary)',
                  textDecoration: 'none',
                  fontSize: '15px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontWeight: '500',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.textDecoration = 'underline';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.textDecoration = 'none';
                }}
              >
                <FiLogIn size={16} />
                Déjà un compte ? Se connecter
              </Link>
            </div>
          </motion.div>
        </motion.div>
      </Container>
    </div>
  )
}

export default PublicInscription
