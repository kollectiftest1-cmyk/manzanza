"use client"
import { useState, useEffect } from "react"
import { Navbar as BootstrapNavbar, Nav, Container, Badge, Dropdown, Button } from "react-bootstrap"
import { LinkContainer } from "react-router-bootstrap"
import { Link } from "react-router-dom"
import { useSelector, useDispatch } from "react-redux"
import { motion, AnimatePresence } from "framer-motion"
import {  FiHome, FiInfo, FiPhone, FiLogIn, FiUserPlus, FiBell, FiUser, FiSettings, FiLogOut } from "react-icons/fi"
import { logout } from "../../store/slices/authSlice"
import { markAllAsRead } from "../../store/slices/notificationsSlice"
import { FaGraduationCap } from "react-icons/fa";

const Navbar = () => {
  const dispatch = useDispatch()
  const { isAuthenticated, user } = useSelector((state) => state.auth)
  const { unreadCount } = useSelector((state) => state.notifications)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleLogout = () => {
    dispatch(logout())
  }

  const handleMarkAllRead = () => {
    dispatch(markAllAsRead())
  }

  return (
    <motion.div
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        transition: 'all 0.3s ease'
      }}
    >
      <BootstrapNavbar
        expand="lg"
        style={{
          background: scrolled || isAuthenticated
            ? 'rgba(255, 255, 255, 0.95)'
            : 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(20px)',
          boxShadow: scrolled || isAuthenticated
            ? '0 4px 20px rgba(0,0,0,0.1)'
            : '0 2px 10px rgba(0,0,0,0.05)',
          padding: '12px 0',
          borderBottom: '1px solid rgba(0,0,0,0.05)',
          transition: 'all 0.3s ease'
        }}
      >
        <Container>
          <LinkContainer to="/">
            <BootstrapNavbar.Brand style={{ cursor: 'pointer' }}>
              <motion.div
                whileHover={{ scale: 1.05 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  fontWeight: '800',
                  fontSize: '24px',
                  background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                <FaGraduationCap size={32} style={{ color: 'var(--color-primary)' }} />
                Syntax GU
              </motion.div>
            </BootstrapNavbar.Brand>
          </LinkContainer>

          <BootstrapNavbar.Toggle aria-controls="basic-navbar-nav" />
          <BootstrapNavbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto" style={{ gap: '8px' }}>
              {!isAuthenticated && (
                <>
                  <LinkContainer to="/">
                    <Nav.Link style={{
                      color: 'var(--color-text)',
                      fontWeight: '500',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      transition: 'all 0.2s ease'
                    }}>
                      <FiHome size={18} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                      Accueil
                    </Nav.Link>
                  </LinkContainer>
                  <Nav.Link style={{
                    color: 'var(--color-text)',
                    fontWeight: '500',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    transition: 'all 0.2s ease'
                  }}>
                    <FiInfo size={18} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                    À propos
                  </Nav.Link>
                  <Nav.Link style={{
                    color: 'var(--color-text)',
                    fontWeight: '500',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    transition: 'all 0.2s ease'
                  }}>
                    <FiPhone size={18} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                    Contact
                  </Nav.Link>
                </>
              )}
            </Nav>

            <Nav style={{ gap: '12px', alignItems: 'center' }}>
              {isAuthenticated ? (
                <>
                  <Dropdown align="end">
                    <Dropdown.Toggle
                      variant="link"
                      style={{
                        color: 'var(--color-text)',
                        textDecoration: 'none',
                        position: 'relative',
                        padding: '8px 12px'
                      }}
                    >
                      <FiBell size={20} />
                      {unreadCount > 0 && (
                        <Badge
                          bg="danger"
                          style={{
                            position: 'absolute',
                            top: '4px',
                            right: '4px',
                            fontSize: '10px',
                            padding: '3px 6px',
                            borderRadius: '10px'
                          }}
                        >
                          {unreadCount}
                        </Badge>
                      )}
                    </Dropdown.Toggle>
                    <Dropdown.Menu style={{
                      borderRadius: '12px',
                      border: '1px solid var(--color-border)',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                      minWidth: '280px'
                    }}>
                      <Dropdown.Header style={{ fontWeight: '600', fontSize: '14px' }}>
                        Notifications
                      </Dropdown.Header>
                      <Dropdown.Item onClick={handleMarkAllRead} style={{ fontSize: '14px' }}>
                        <i className="fas fa-check me-2"></i>
                        Marquer tout comme lu
                      </Dropdown.Item>
                      <Dropdown.Divider />
                      <Dropdown.Item style={{ fontSize: '13px' }}>
                        <small className="text-muted">Aucune nouvelle notification</small>
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>

                  <Dropdown align="end">
                    <Dropdown.Toggle
                      variant="link"
                      style={{
                        color: 'var(--color-text)',
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 12px',
                        borderRadius: '10px',
                        background: 'var(--color-bodyBg)',
                        fontWeight: '600'
                      }}
                    >
                      <FiUser size={18} />
                      {user?.name || "Utilisateur"}
                    </Dropdown.Toggle>
                    <Dropdown.Menu style={{
                      borderRadius: '12px',
                      border: '1px solid var(--color-border)',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                      minWidth: '220px'
                    }}>
                      <LinkContainer to="/profile">
                        <Dropdown.Item style={{ fontSize: '14px', padding: '10px 16px' }}>
                          <FiUser size={16} style={{ marginRight: '8px' }} />
                          Mon Profil
                        </Dropdown.Item>
                      </LinkContainer>
                      {(user?.role === "admin" || user?.role === "iadmin" || user?.role === "sga") && (
                        <LinkContainer to="/administration">
                          <Dropdown.Item style={{ fontSize: '14px', padding: '10px 16px' }}>
                            <FiSettings size={16} style={{ marginRight: '8px' }} />
                            Administration
                          </Dropdown.Item>
                        </LinkContainer>
                      )}
                      <Dropdown.Divider />
                      <Dropdown.Item onClick={handleLogout} style={{ fontSize: '14px', padding: '10px 16px', color: 'var(--color-danger)' }}>
                        <FiLogOut size={16} style={{ marginRight: '8px' }} />
                        Déconnexion
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                </>
              ) : (
                <>
                  <Link to="/login">
                    <Button
                      variant="outline-primary"
                      style={{
                        borderRadius: '10px',
                        padding: '8px 20px',
                        fontWeight: '600',
                        borderWidth: '2px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <FiLogIn size={18} />
                      Connexion
                    </Button>
                  </Link>
                  <Link to="/inscription">
                    <Button
                      style={{
                        background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
                        border: 'none',
                        borderRadius: '10px',
                        padding: '8px 20px',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'all 0.2s ease',
                        color: 'white'
                      }}
                    >
                      <FiUserPlus size={18} />
                      S'inscrire
                    </Button>
                  </Link>
                </>
              )}
            </Nav>
          </BootstrapNavbar.Collapse>
        </Container>
      </BootstrapNavbar>
    </motion.div>
  )
}

export default Navbar
