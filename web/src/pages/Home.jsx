import { Container, Row, Col, Button } from "react-bootstrap"
import { LinkContainer } from "react-router-bootstrap"
import { useSelector } from "react-redux"
import { Link } from "react-router-dom"
import { motion } from "framer-motion"
import { FiBookOpen, FiUsers, FiAward, FiTrendingUp, FiShield, FiZap, FiGlobe, FiArrowRight } from "react-icons/fi"

const Home = () => {
  const { isAuthenticated } = useSelector((state) => state.auth)

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 }
  }

  const features = [
    { icon: FiBookOpen, title: "Cours en Ligne", desc: "Accédez à tous vos cours 24/7", color: "var(--color-primary)" },
    { icon: FiUsers, title: "Communauté", desc: "Étudiants et enseignants connectés", color: "var(--color-success)" },
    { icon: FiAward, title: "Diplômes Reconnus", desc: "Certifications officielles", color: "var(--color-warning)" },
    { icon: FiTrendingUp, title: "Suivi Académique", desc: "Suivez votre progression", color: "var(--color-info)" },
    { icon: FiShield, title: "Données Sécurisées", desc: "Vos informations protégées", color: "var(--color-danger)" },
    { icon: FiZap, title: "Plateforme Rapide", desc: "Accès instantané partout", color: "var(--color-secondary)" }
  ]

  const services = [
    {
      icon: "🎓",
      title: "Administration",
      desc: "Gestion complète de l'université : inscriptions, programmes académiques, suivi des étudiants et du personnel.",
      gradient: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))"
    },
    {
      icon: "👨‍🏫",
      title: "Corps Enseignant",
      desc: "Partagez vos cours, évaluez vos étudiants, suivez leur progression académique en temps réel.",
      gradient: "linear-gradient(135deg, var(--color-success), var(--color-info))"
    },
    {
      icon: "👩‍🎓",
      title: "Étudiants",
      desc: "Accédez à vos cours, consultez vos notes, soumettez vos travaux et communiquez avec vos professeurs.",
      gradient: "linear-gradient(135deg, var(--color-warning), var(--color-danger))"
    }
  ]

  return (
    <div style={{ background: 'var(--color-bodyBg)', minHeight: '100vh' }}>
      {/* Hero Section */}
      <section style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        position: 'relative',
        paddingTop: '100px',
        paddingBottom: '80px',
        background: 'var(--color-bodyBg)'
      }}>
        {/* Background decoration */}
        <div style={{
          position: 'absolute',
          top: '0',
          right: '-10%',
          width: '50%',
          height: '50%',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
          opacity: '0.08',
          filter: 'blur(100px)',
          zIndex: 0
        }} />
        <div style={{
          position: 'absolute',
          bottom: '0',
          left: '-10%',
          width: '40%',
          height: '40%',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--color-success), var(--color-info))',
          opacity: '0.08',
          filter: 'blur(100px)',
          zIndex: 0
        }} />

        <Container style={{ position: 'relative', zIndex: 1 }}>
          <Row className="align-items-center">
            <Col lg={6}>
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
              >
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  style={{
                    display: 'inline-block',
                    padding: '8px 20px',
                    borderRadius: '50px',
                    background: 'linear-gradient(135deg, rgba(0, 31, 84, 0.1), rgba(244, 169, 0, 0.1))',
                    border: '1px solid var(--color-primary)',
                    marginBottom: '24px'
                  }}
                >
                  <small style={{ color: 'var(--color-primary)', fontWeight: '600' }}>
                    🎓 Université MAZANZA - Science, Conscience, Technologie
                  </small>
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  style={{
                    fontSize: '3.5rem',
                    fontWeight: '800',
                    lineHeight: '1.2',
                    color: 'var(--color-textPrimary)',
                    marginBottom: '24px'
                  }}
                >
                  Université{' '}
                  <span style={{
                    background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}>
                    MAZANZA
                  </span>
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  style={{
                    fontSize: '1.25rem',
                    color: 'var(--color-textSecondary)',
                    marginBottom: '32px',
                    lineHeight: '1.8'
                  }}
                >
                  Plateforme de gestion académique de l'Université MAZANZA. Accédez à vos cours, suivez vos résultats, et restez connecté avec votre communauté universitaire.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="d-flex gap-3 flex-wrap"
                >
                  {!isAuthenticated ? (
                    <>
                      <LinkContainer to="/login">
                        <Button
                          size="lg"
                          style={{
                            background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
                            border: 'none',
                            padding: '14px 32px',
                            borderRadius: '12px',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}
                        >
                          Se Connecter <FiArrowRight />
                        </Button>
                      </LinkContainer>
                      <Link to="/inscription">
                        <Button
                          size="lg"
                          style={{
                            background: 'linear-gradient(135deg, var(--color-success), var(--color-info))',
                            border: 'none',
                            padding: '14px 32px',
                            borderRadius: '12px',
                            fontWeight: '600'
                          }}
                        >
                          S'inscrire
                        </Button>
                      </Link>
                      <Button
                        size="lg"
                        variant="outline-primary"
                        style={{
                          padding: '14px 32px',
                          borderRadius: '12px',
                          fontWeight: '600',
                          borderWidth: '2px'
                        }}
                      >
                        Demander une démo
                      </Button>
                    </>
                  ) : (
                    <LinkContainer to="/dashboard">
                      <Button
                        size="lg"
                        style={{
                          background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
                          border: 'none',
                          padding: '14px 32px',
                          borderRadius: '12px',
                          fontWeight: '600',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                      >
                        Accéder au tableau de bord <FiArrowRight />
                      </Button>
                    </LinkContainer>
                  )}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  style={{ marginTop: '32px' }}
                >
                  <Row className="g-4">
                    <Col xs={4}>
                      <h3 style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--color-primary)', marginBottom: '4px' }}>5000+</h3>
                      <small style={{ color: 'var(--color-textSecondary)' }}>Étudiants actifs</small>
                    </Col>
                    <Col xs={4}>
                      <h3 style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--color-success)', marginBottom: '4px' }}>200+</h3>
                      <small style={{ color: 'var(--color-textSecondary)' }}>Enseignants</small>
                    </Col>
                    <Col xs={4}>
                      <h3 style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--color-warning)', marginBottom: '4px' }}>98%</h3>
                      <small style={{ color: 'var(--color-textSecondary)' }}>Satisfaction</small>
                    </Col>
                  </Row>
                </motion.div>
              </motion.div>
            </Col>

            <Col lg={6} className="d-none d-lg-block">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                style={{ position: 'relative' }}
              >
                <motion.div
                  animate={{ y: [0, -20, 0] }}
                  transition={{ duration: 4, repeat: Infinity, repeatType: "reverse" }}
                  style={{
                    padding: '40px',
                    borderRadius: '24px',
                    background: 'var(--color-cardBg)',
                    border: '1px solid var(--color-border)',
                    boxShadow: '0 30px 60px rgba(0,0,0,0.15)'
                  }}
                >
                  <img
                    src="/logo.jpeg"
                    alt="Université MAZANZA"
                    style={{
                      width: '180px',
                      height: '180px',
                      objectFit: 'contain',
                      marginBottom: '20px',
                      margin: '0 auto 20px',
                      display: 'block',
                      filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))'
                    }}
                  />
                  <h4 style={{ textAlign: 'center', color: 'var(--color-textPrimary)', fontWeight: '700' }}>Université MAZANZA</h4>
                  <p style={{ textAlign: 'center', color: 'var(--color-textSecondary)', marginBottom: 0 }}>Science - Conscience - Technologie</p>
                </motion.div>
              </motion.div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Features Section */}
      <section style={{ padding: '80px 0', background: 'var(--color-cardBg)' }}>
        <Container>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.div variants={itemVariants} className="text-center mb-5">
              <h2 style={{
                fontSize: '2.5rem',
                fontWeight: '700',
                color: 'var(--color-textPrimary)',
                marginBottom: '16px'
              }}>
                Pourquoi l'Université MAZANZA ?
              </h2>
              <p style={{ fontSize: '1.1rem', color: 'var(--color-textSecondary)', maxWidth: '700px', margin: '0 auto' }}>
                Une formation d'excellence avec des outils numériques modernes pour votre réussite académique
              </p>
            </motion.div>

            <Row className="g-4">
              {features.map((feature, index) => (
                <Col key={index} md={6} lg={4}>
                  <motion.div
                    variants={itemVariants}
                    whileHover={{ scale: 1.05, y: -5 }}
                    style={{
                      padding: '32px',
                      borderRadius: '16px',
                      background: 'var(--color-bodyBg)',
                      border: '1px solid var(--color-border)',
                      height: '100%',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <feature.icon style={{
                      fontSize: '3rem',
                      color: feature.color,
                      marginBottom: '16px'
                    }} />
                    <h5 style={{
                      fontWeight: '600',
                      color: 'var(--color-textPrimary)',
                      marginBottom: '8px'
                    }}>
                      {feature.title}
                    </h5>
                    <p style={{ color: 'var(--color-textSecondary)', marginBottom: 0 }}>
                      {feature.desc}
                    </p>
                  </motion.div>
                </Col>
              ))}
            </Row>
          </motion.div>
        </Container>
      </section>

      {/* Services Section */}
      <section style={{ padding: '80px 0' }}>
        <Container>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.div variants={itemVariants} className="text-center mb-5">
              <h2 style={{
                fontSize: '2.5rem',
                fontWeight: '700',
                color: 'var(--color-textPrimary)',
                marginBottom: '16px'
              }}>
                Une plateforme pour toute la communauté universitaire
              </h2>
              <p style={{ fontSize: '1.1rem', color: 'var(--color-textSecondary)' }}>
                Des outils adaptés à chaque membre de l'Université MAZANZA
              </p>
            </motion.div>

            <Row className="g-4">
              {services.map((service, index) => (
                <Col key={index} lg={4}>
                  <motion.div
                    variants={itemVariants}
                    whileHover={{ scale: 1.03 }}
                    style={{
                      padding: '40px',
                      borderRadius: '20px',
                      background: 'var(--color-cardBg)',
                      border: '1px solid var(--color-border)',
                      height: '100%',
                      textAlign: 'center',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    <div style={{
                      position: 'absolute',
                      top: '-50px',
                      right: '-50px',
                      width: '150px',
                      height: '150px',
                      borderRadius: '50%',
                      background: service.gradient,
                      opacity: 0.1,
                      filter: 'blur(40px)'
                    }} />

                    <div style={{
                      fontSize: '4rem',
                      marginBottom: '20px',
                      position: 'relative'
                    }}>
                      {service.icon}
                    </div>

                    <h4 style={{
                      fontWeight: '700',
                      color: 'var(--color-textPrimary)',
                      marginBottom: '16px',
                      position: 'relative'
                    }}>
                      {service.title}
                    </h4>

                    <p style={{
                      color: 'var(--color-textSecondary)',
                      lineHeight: '1.7',
                      marginBottom: '24px',
                      position: 'relative'
                    }}>
                      {service.desc}
                    </p>

                    <Button
                      variant="outline-primary"
                      style={{
                        borderRadius: '10px',
                        fontWeight: '600',
                        position: 'relative',
                        borderWidth: '2px'
                      }}
                    >
                      En savoir plus <FiArrowRight style={{ marginLeft: '8px' }} />
                    </Button>
                  </motion.div>
                </Col>
              ))}
            </Row>
          </motion.div>
        </Container>
      </section>

      {/* CTA Section */}
      <section style={{
        padding: '80px 0',
        background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
          opacity: 0.3
        }} />

        <Container style={{ position: 'relative', zIndex: 1 }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
            style={{ color: 'white' }}
          >
            <FiGlobe style={{ fontSize: '4rem', marginBottom: '24px' }} />
            <h2 style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '16px' }}>
              Accessible partout, tout le temps
            </h2>
            <p style={{ fontSize: '1.2rem', marginBottom: '32px', maxWidth: '700px', margin: '0 auto 32px' }}>
              Ordinateur, tablette ou smartphone - Une expérience optimale sur tous vos appareils, en ligne ou hors ligne
            </p>

            {!isAuthenticated && (
              <div className="d-flex gap-3 justify-content-center">
                <LinkContainer to="/login">
                  <Button
                    size="lg"
                    style={{
                      background: 'white',
                      color: 'var(--color-primary)',
                      border: 'none',
                      padding: '14px 32px',
                      borderRadius: '12px',
                      fontWeight: '600'
                    }}
                  >
                    Commencer maintenant
                  </Button>
                </LinkContainer>
              </div>
            )}
          </motion.div>
        </Container>
      </section>
    </div>
  )
}

export default Home
