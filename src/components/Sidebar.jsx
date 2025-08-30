"use client"
import { Nav, Button, Col } from "react-bootstrap"
import { LinkContainer } from "react-router-bootstrap"
import { useSelector, useDispatch } from "react-redux"
import { logout } from "../store/slices/authSlice"

const Sidebar = () => {
  const { user } = useSelector((state) => state.auth)
  const dispatch = useDispatch()

  const handleLogout = () => {
    dispatch(logout())
  }

  // Menu items based on user role
  const getMenuItems = () => {
    const baseItems = [
      { path: "/dashboard", icon: "fas fa-tachometer-alt", label: "Tableau de bord" },
      { path: "/profile", icon: "fas fa-user", label: "Profil" },
      { path: "/notifications", icon: "fas fa-bell", label: "Notifications" },
    ]

    switch (user?.role) {
      case "etudiant":
        return [
          ...baseItems,
          { path: "/courses", icon: "fas fa-book", label: "Mes Cours" },
          { path: "/auditoires", icon: "fas fa-users", label: "Auditoires" },
          { path: "/quiz", icon: "fas fa-question-circle", label: "Quiz" },
          { path: "/tptd", icon: "fas fa-tasks", label: "TP/TD" },
          { path: "/library", icon: "fas fa-book-open", label: "Bibliothèque" },
          { path: "/paiements", icon: "fas fa-credit-card", label: "Paiements" },
        ]

      case "enseignant":
      case "assistant":
        return [
          ...baseItems,
          { path: "/courses", icon: "fas fa-chalkboard-teacher", label: "Mes Cours" },
          { path: "/auditoires", icon: "fas fa-users", label: "Auditoires" },
          { path: "/quiz", icon: "fas fa-question-circle", label: "Gestion Quiz" },
          { path: "/tptd", icon: "fas fa-tasks", label: "TP/TD" },
          { path: "/library", icon: "fas fa-book-open", label: "Bibliothèque" },
        ]

      case "sga":
        return [
          ...baseItems,
          { path: "/courses", icon: "fas fa-graduation-cap", label: "Gestion Académique" },
          { path: "/auditoires", icon: "fas fa-users", label: "Auditoires" },
          { path: "/administration", icon: "fas fa-cogs", label: "Administration" },
          { path: "/rh", icon: "fas fa-user-tie", label: "Ressources Humaines" },
        ]

      case "sgad":
        return [
          ...baseItems,
          { path: "/comptabilite", icon: "fas fa-calculator", label: "Comptabilité" },
          { path: "/paiements", icon: "fas fa-credit-card", label: "Paiements" },
          { path: "/administration", icon: "fas fa-cogs", label: "Administration" },
          { path: "/rh", icon: "fas fa-user-tie", label: "RH" },
        ]

      case "pdg":
      case "directeur_general":
        return [
          ...baseItems,
          { path: "/administration", icon: "fas fa-building", label: "Administration" },
          { path: "/comptabilite", icon: "fas fa-chart-line", label: "Finances" },
          { path: "/rh", icon: "fas fa-users-cog", label: "RH" },
          { path: "/courses", icon: "fas fa-graduation-cap", label: "Académique" },
        ]

      case "chef_section":
        return [
          ...baseItems,
          { path: "/courses", icon: "fas fa-chalkboard-teacher", label: "Cours" },
          { path: "/auditoires", icon: "fas fa-users", label: "Auditoires" },
          { path: "/administration", icon: "fas fa-cogs", label: "Gestion Départements" },
          { path: "/rh", icon: "fas fa-user-tie", label: "Personnel" },
        ]

      case "chef_departement":
        return [
          ...baseItems,
          { path: "/courses", icon: "fas fa-chalkboard-teacher", label: "Cours Département" },
          { path: "/auditoires", icon: "fas fa-users", label: "Auditoires" },
          { path: "/tptd", icon: "fas fa-tasks", label: "TP/TD" },
        ]

      case "bibliothecaire":
        return [
          ...baseItems,
          { path: "/library", icon: "fas fa-book-open", label: "Bibliothèque" },
          { path: "/courses", icon: "fas fa-book", label: "Ressources Cours" },
        ]

      case "apparitorat":
        return [
          ...baseItems,
          { path: "/apparitorat", icon: "fas fa-clipboard-list", label: "Apparitorat" },
          { path: "/auditoires", icon: "fas fa-door-open", label: "Salles" },
        ]

      case "service_it":
        return [
          ...baseItems,
          { path: "/service-it", icon: "fas fa-laptop-code", label: "Service IT" },
          { path: "/administration", icon: "fas fa-cogs", label: "Administration" },
        ]

      case "caisse_comptabilite":
        return [
          ...baseItems,
          { path: "/comptabilite", icon: "fas fa-calculator", label: "Comptabilité" },
          { path: "/paiements", icon: "fas fa-money-bill-wave", label: "Caisse" },
        ]

      case "iadmin":
        return [
          ...baseItems,
          { path: "/courses", icon: "fas fa-graduation-cap", label: "Gestion Académique" },
          { path: "/auditoires", icon: "fas fa-users", label: "Auditoires" },
          { path: "/administration", icon: "fas fa-building", label: "Administration" },
          { path: "/comptabilite", icon: "fas fa-chart-line", label: "Finances" },
          { path: "/rh", icon: "fas fa-users-cog", label: "RH" },
          { path: "/service-it", icon: "fas fa-laptop-code", label: "Service IT" },
          { path: "/library", icon: "fas fa-book-open", label: "Bibliothèque" },
          { path: "/apparitorat", icon: "fas fa-clipboard-list", label: "Apparitorat" },
          { path: "/paiements", icon: "fas fa-credit-card", label: "Paiements" },
          { path: "/tptd", icon: "fas fa-tasks", label: "TP/TD" },
          { path: "/quiz", icon: "fas fa-question-circle", label: "Quiz" },
        ]

      default:
        return baseItems
    }
  }

  return (
    <Col
      lg={12}
      className="sidebar shadow-sm"
      style={{
        // width: "100%",
        // height: "90vh",
        // position: "fixed",
        // margin:'auto',
        // left: 0,
        // top: 0,
        // zIndex: 1000,
        // background: "linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%)",
      }}
    >
      {/* Logo/Header */}
      <div className="p-4 border-bottom border-light border-opacity-25">
        <h4 className="text-white fw-bold mb-0">NKEBI UNIV</h4>
        <small className="text-white text-opacity-75">Université</small>
      </div>

      {/* User Info */}
      <div className="p-3 border-bottom border-light border-opacity-25">
        <div className="d-flex align-items-center">
          <div
            className="avatar-circle me-3 d-flex align-items-center justify-content-center"
            style={{
              width: "40px",
              height: "40px",
              backgroundColor: "rgba(255,255,255,0.2)",
              borderRadius: "50%",
            }}
          >
            <i className="fas fa-user text-white"></i>
          </div>
          <div>
            <div className="fw-semibold text-white">{user?.name}</div>
            <small className="text-white text-opacity-75">{user?.role?.replace("_", " ").toUpperCase()}</small>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <Nav className="flex-column p-3">
        {getMenuItems().map((item, index) => (
          <LinkContainer key={index} to={item.path}>
            <Nav.Link
              className="sidebar-link d-flex align-items-center py-3 px-3 mb-1 text-white rounded"
              style={{
                transition: "all 0.3s ease",
                "&:hover": {
                  backgroundColor: "rgba(255,255,255,0.1)",
                },
              }}
            >
              <i className={`${item.icon} me-3`} style={{ width: "20px" }}></i>
              {item.label}
            </Nav.Link>
          </LinkContainer>
        ))}
      </Nav>

      {/* Logout Button */}
      <div className="p-3 mt-auto" style={{ position: "absolute", bottom: "20px", left: "20px", right: "20px" }}>
        <Button
          variant="light"
          className="w-100 fw-semibold"
          onClick={handleLogout}
          style={{
            backgroundColor: "rgba(255,255,255,0.9)",
            border: "none",
            color: "#44A08D",
          }}
        >
          <i className="fas fa-sign-out-alt me-2"></i>
          Déconnexion
        </Button>
      </div>
    </Col>
  )
}

export default Sidebar
