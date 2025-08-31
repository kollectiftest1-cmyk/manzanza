"use client"
import { Nav, Button } from "react-bootstrap"
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
    <div
      className="sidebar shadow-lg"
      style={{
        width: "100%",
        height: "100vh",
        // position: "fixed",
        // left: 0,
        // top: 0,
        // zIndex: 1000,
        background: "linear-gradient(90deg,#43B5D7 0%,#3F97E3 100%)",
        borderRight: "1px solid rgba(255,255,255,0.1)",
        padding :0,
        // borderRadius:"20px",
        borderTopRightRadius:"20px",
        borderBottomRightRadius:"20px"
      }}
    >
      {/* Logo/Header */}
      <div className="p-4 border-bottom" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
        <h4 className="text-white fw-bold mb-0">
          <i className="fas fa-graduation-cap me-0"></i>
          ISIPA
        </h4>
        <small className="text-white-50">Système Universitaire</small>
      </div>

      {/* User Info */}
      <div className="p-3 border-bottom" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
        <div className="d-flex align-items-center">
          <div
            className="avatar-circle me-3 d-flex align-items-center justify-content-center"
            style={{
              width: "45px",
              height: "45px",
              backgroundColor: "rgba(255,255,255,0.15)",
              borderRadius: "50%",
              border: "2px solid rgba(255,255,255,0.2)",
            }}
          >
            <i className="fas fa-user text-white"></i>
          </div>
          <div>
            <div className="fw-semibold text-white">{user?.name}</div>
            <small className="text-white-50">{user?.role?.replace("_", " ").toUpperCase()}</small>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <div style={{ height: "calc(100vh - 200px)", overflowY: "auto" }}>
        <Nav className="flex-column p-3 ">
          {getMenuItems().map((item, index) => (
            <LinkContainer key={index} to={item.path}>
              <Nav.Link
                className="sidebar-link d-flex align-items-center py-1 px-1 mb-2 text-white rounded"
                style={{
                  transition: "all 0.3s ease",
                  fontSize: "0.95rem",
                  fontWeight: "500",
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = "rgba(255,255,255,0.15)"
                  e.target.style.transform = "translateX(5px)"
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = "transparent"
                  e.target.style.transform = "translateX(0)"
                }}
              >
                <i className={`${item.icon} me-3`} style={{ width: "20px", fontSize: "1.1rem" }}></i>
                {item.label}
              </Nav.Link>
            </LinkContainer>
          ))}
        </Nav>
        <Button
          variant="outline-light"
          className=" fw-semibold"
          onClick={handleLogout}
          style={{
            backgroundColor: "rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.3)",
            color: "white",
            transition: "all 0.3s ease",
            width:"95%",
            alignSelf:'end',
            // margin:"auto"
            marginLeft:5

          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = "rgba(255,255,255,0.2)"
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = "rgba(255,255,255,0.1)"
          }}
        >
          <i className="fas fa-sign-out-alt me-2"></i>
          Déconnexion
        </Button>
      </div>

      {/* Logout Button */}
  
        
    </div>
  )
}

export default Sidebar
