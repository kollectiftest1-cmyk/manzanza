"use client"

import { useState } from "react"
import { Container, Row, Col, Form, Button, Alert } from "react-bootstrap"
import { useDispatch, useSelector } from "react-redux"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { FiMail, FiLock, FiLogIn, FiBookOpen, FiUsers, FiAward } from "react-icons/fi"
import { login } from "../store/slices/authSlice"

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [showPassword, setShowPassword] = useState(false)

  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { loading, error } = useSelector((state) => state.auth)

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      await dispatch(login({
        email: formData.email,
        password: formData.password
      })).unwrap()

      navigate("/dashboard")
    } catch (error) {
      console.error("Erreur de connexion:", error)
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--color-bodyBg)',
      display: 'flex',
      alignItems: 'center',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background decoration */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        right: '-5%',
        width: '40%',
        height: '40%',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
        opacity: '0.1',
        filter: 'blur(80px)'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-10%',
        left: '-5%',
        width: '35%',
        height: '35%',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, var(--color-success), var(--color-info))',
        opacity: '0.1',
        filter: 'blur(80px)'
      }} />

      <Container fluid>
        <Row className="justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
          {/* Left side - Branding */}
          <Col lg={6} className="d-none d-lg-flex flex-column justify-content-center align-items-center p-5">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center"
            >
              <motion.div
                animate={{
                  scale: [1, 1.05, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
                style={{
                  fontSize: '6rem',
                  marginBottom: '2rem',
                  background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontWeight: 'bold'
                }}
              >
                🎓
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                style={{
                  fontSize: '3rem',
                  fontWeight: '800',
                  color: 'var(--color-textPrimary)',
                  marginBottom: '1rem'
                }}
              >
                Syntax GU
              </motion.h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                style={{
                  fontSize: '1.25rem',
                  color: 'var(--color-textSecondary)',
                  marginBottom: '3rem',
                  maxWidth: '500px'
                }}
              >
                Plateforme de Gestion Universitaire Moderne
              </motion.p>

              <Row className="g-4 mt-4">
                <Col md={4}>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    style={{
                      padding: '1.5rem',
                      borderRadius: '16px',
                      background: 'var(--color-cardBg)',
                      border: '1px solid var(--color-border)',
                      textAlign: 'center'
                    }}
                  >
                    <FiBookOpen style={{ fontSize: '2.5rem', color: 'var(--color-primary)', marginBottom: '0.5rem' }} />
                    <h6 style={{ color: 'var(--color-textPrimary)', fontWeight: '600' }}>Cours en ligne</h6>
                    <small style={{ color: 'var(--color-textSecondary)' }}>Accès 24/7</small>
                  </motion.div>
                </Col>
                <Col md={4}>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    style={{
                      padding: '1.5rem',
                      borderRadius: '16px',
                      background: 'var(--color-cardBg)',
                      border: '1px solid var(--color-border)',
                      textAlign: 'center'
                    }}
                  >
                    <FiUsers style={{ fontSize: '2.5rem', color: 'var(--color-success)', marginBottom: '0.5rem' }} />
                    <h6 style={{ color: 'var(--color-textPrimary)', fontWeight: '600' }}>Collaboration</h6>
                    <small style={{ color: 'var(--color-textSecondary)' }}>Équipe & Chat</small>
                  </motion.div>
                </Col>
                <Col md={4}>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    style={{
                      padding: '1.5rem',
                      borderRadius: '16px',
                      background: 'var(--color-cardBg)',
                      border: '1px solid var(--color-border)',
                      textAlign: 'center'
                    }}
                  >
                    <FiAward style={{ fontSize: '2.5rem', color: 'var(--color-warning)', marginBottom: '0.5rem' }} />
                    <h6 style={{ color: 'var(--color-textPrimary)', fontWeight: '600' }}>Certification</h6>
                    <small style={{ color: 'var(--color-textSecondary)' }}>Diplômes</small>
                  </motion.div>
                </Col>
              </Row>
            </motion.div>
          </Col>

          {/* Right side - Login Form */}
          <Col lg={6} md={8} sm={10} className="p-4">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              style={{
                maxWidth: '480px',
                margin: '0 auto',
                padding: '3rem 2.5rem',
                borderRadius: '24px',
                background: 'var(--color-cardBg)',
                border: '1px solid var(--color-border)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.1)'
              }}
            >
              <motion.div variants={itemVariants} className="text-center mb-4">
                <h2 style={{
                  fontSize: '2rem',
                  fontWeight: '700',
                  color: 'var(--color-textPrimary)',
                  marginBottom: '0.5rem'
                }}>
                  Bienvenue ! 👋
                </h2>
                <p style={{ color: 'var(--color-textSecondary)', fontSize: '0.95rem' }}>
                  Connectez-vous à votre espace universitaire
                </p>
              </motion.div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <Alert
                    variant="danger"
                    className="mb-4"
                    style={{
                      borderRadius: '12px',
                      border: '1px solid var(--color-danger)',
                      background: 'rgba(220, 53, 69, 0.1)'
                    }}
                  >
                    <small>{error}</small>
                  </Alert>
                </motion.div>
              )}

              <Form onSubmit={handleSubmit}>
                <motion.div variants={itemVariants}>
                  <Form.Group className="mb-3">
                    <Form.Label style={{
                      fontWeight: '600',
                      color: 'var(--color-textPrimary)',
                      marginBottom: '0.5rem',
                      fontSize: '0.9rem'
                    }}>
                      Email universitaire
                    </Form.Label>
                    <div style={{ position: 'relative' }}>
                      <FiMail style={{
                        position: 'absolute',
                        left: '16px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--color-textSecondary)',
                        fontSize: '1.1rem',
                        zIndex: 1
                      }} />
                      <Form.Control
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="votre.email@syntaxgu.ac.cd"
                        required
                        style={{
                          paddingLeft: '48px',
                          height: '48px',
                          borderRadius: '12px',
                          border: '1px solid var(--color-border)',
                          background: 'var(--color-bodyBg)',
                          color: 'var(--color-textPrimary)',
                          fontSize: '0.95rem'
                        }}
                      />
                    </div>
                  </Form.Group>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <Form.Group className="mb-4">
                    <Form.Label style={{
                      fontWeight: '600',
                      color: 'var(--color-textPrimary)',
                      marginBottom: '0.5rem',
                      fontSize: '0.9rem'
                    }}>
                      Mot de passe
                    </Form.Label>
                    <div style={{ position: 'relative' }}>
                      <FiLock style={{
                        position: 'absolute',
                        left: '16px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--color-textSecondary)',
                        fontSize: '1.1rem',
                        zIndex: 1
                      }} />
                      <Form.Control
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="••••••••"
                        required
                        style={{
                          paddingLeft: '48px',
                          paddingRight: '48px',
                          height: '48px',
                          borderRadius: '12px',
                          border: '1px solid var(--color-border)',
                          background: 'var(--color-bodyBg)',
                          color: 'var(--color-textPrimary)',
                          fontSize: '0.95rem'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{
                          position: 'absolute',
                          right: '16px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--color-textSecondary)',
                          cursor: 'pointer',
                          padding: '4px',
                          fontSize: '0.9rem'
                        }}
                      >
                        {showPassword ? '🙈' : '👁️'}
                      </button>
                    </div>
                  </Form.Group>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <Button
                    type="submit"
                    disabled={loading}
                    style={{
                      width: '100%',
                      height: '52px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
                      border: 'none',
                      fontWeight: '600',
                      fontSize: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      marginBottom: '1rem',
                      transition: 'transform 0.2s, box-shadow 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)'
                      e.currentTarget.style.boxShadow = '0 8px 20px rgba(59, 130, 246, 0.4)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm" />
                        Connexion en cours...
                      </>
                    ) : (
                      <>
                        <FiLogIn />
                        Se connecter
                      </>
                    )}
                  </Button>
                </motion.div>

                <motion.div variants={itemVariants} className="text-center">
                  <small style={{ color: 'var(--color-textSecondary)' }}>
                    Mot de passe oublié ?{" "}
                    <a
                      href="#"
                      style={{
                        color: 'var(--color-primary)',
                        textDecoration: 'none',
                        fontWeight: '600'
                      }}
                    >
                      Réinitialiser
                    </a>
                  </small>
                </motion.div>
              </Form>

              <motion.div
                variants={itemVariants}
                style={{
                  marginTop: '2rem',
                  paddingTop: '1.5rem',
                  borderTop: '1px solid var(--color-border)',
                  textAlign: 'center'
                }}
              >
                <small style={{ color: 'var(--color-textSecondary)' }}>
                  Pas encore inscrit ?{" "}
                  <a
                    href="/inscription"
                    style={{
                      color: 'var(--color-success)',
                      textDecoration: 'none',
                      fontWeight: '600'
                    }}
                  >
                    Créer un compte
                  </a>
                </small>
              </motion.div>
            </motion.div>
          </Col>
        </Row>
      </Container>
    </div>
  )
}

export default Login
