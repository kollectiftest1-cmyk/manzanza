"use client"
import { Navbar as BootstrapNavbar, Nav, Container, Badge, Dropdown } from "react-bootstrap"
import { LinkContainer } from "react-router-bootstrap"
import { useSelector, useDispatch } from "react-redux"
import { logout } from "../../store/slices/authSlice"
import { markAllAsRead } from "../../store/slices/notificationsSlice"

const Navbar = () => {
  const dispatch = useDispatch()
  const { isAuthenticated, user } = useSelector((state) => state.auth)
  const { unreadCount } = useSelector((state) => state.notifications)

  const handleLogout = () => {
    dispatch(logout())
  }

  const handleMarkAllRead = () => {
    dispatch(markAllAsRead())
  }

  return (
    <BootstrapNavbar expand="lg" className="navbar-custom" fixed="top">
      <Container>
        <LinkContainer to="/">
          <BootstrapNavbar.Brand className="navbar-brand-custom">
            <i className="fas fa-graduation-cap me-2"></i>
            DASH
          </BootstrapNavbar.Brand>
        </LinkContainer>

        <BootstrapNavbar.Toggle aria-controls="basic-navbar-nav" />
        <BootstrapNavbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            {isAuthenticated && (
              <>
                <LinkContainer to="/dashboard">
                  <Nav.Link className="nav-link-custom">
                    <i className="fas fa-tachometer-alt me-1"></i>
                    Tableau de bord
                  </Nav.Link>
                </LinkContainer>
                <LinkContainer to="/courses">
                  <Nav.Link className="nav-link-custom">
                    <i className="fas fa-book me-1"></i>
                    Cours
                  </Nav.Link>
                </LinkContainer>
                <LinkContainer to="/chat">
                  <Nav.Link className="nav-link-custom">
                    <i className="fas fa-comments me-1"></i>
                    Discussion
                  </Nav.Link>
                </LinkContainer>
                <LinkContainer to="/library">
                  <Nav.Link className="nav-link-custom">
                    <i className="fas fa-book-open me-1"></i>
                    Bibliothèque
                  </Nav.Link>
                </LinkContainer>
              </>
            )}
          </Nav>

          <Nav>
            {isAuthenticated ? (
              <>
                <Dropdown align="end">
                  <Dropdown.Toggle variant="link" className="nav-link-custom position-relative">
                    <i className="fas fa-bell"></i>
                    {unreadCount > 0 && (
                      <Badge
                        bg="danger"
                        className="position-absolute top-0 start-100 translate-middle notification-badge"
                      >
                        {unreadCount}
                      </Badge>
                    )}
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Header>Notifications</Dropdown.Header>
                    <Dropdown.Item onClick={handleMarkAllRead}>
                      <i className="fas fa-check me-2"></i>
                      Marquer tout comme lu
                    </Dropdown.Item>
                    <Dropdown.Divider />
                    <Dropdown.Item>
                      <small className="text-muted">Nouveau TP disponible</small>
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>

                <Dropdown align="end">
                  <Dropdown.Toggle variant="link" className="nav-link-custom">
                    <i className="fas fa-user-circle me-1"></i>
                    {user?.name || "Utilisateur"}
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <LinkContainer to="/profile">
                      <Dropdown.Item>
                        <i className="fas fa-user me-2"></i>
                        Profil
                      </Dropdown.Item>
                    </LinkContainer>
                    {user?.role === "admin" && (
                      <LinkContainer to="/administration">
                        <Dropdown.Item>
                          <i className="fas fa-cogs me-2"></i>
                          Administration
                        </Dropdown.Item>
                      </LinkContainer>
                    )}
                    <Dropdown.Divider />
                    <Dropdown.Item onClick={handleLogout}>
                      <i className="fas fa-sign-out-alt me-2"></i>
                      Déconnexion
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </>
            ) : (
              <LinkContainer to="/login">
                <Nav.Link className="btn btn-primary-custom">Connexion</Nav.Link>
              </LinkContainer>
            )}
          </Nav>
        </BootstrapNavbar.Collapse>
      </Container>
    </BootstrapNavbar>
  )
}

export default Navbar
