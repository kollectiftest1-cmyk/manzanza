"use client"

import { Nav } from "react-bootstrap"
import { Link, useLocation } from "react-router-dom"
import { useSelector } from "react-redux"
import { checkPermission } from "../utils/permissions" // Assuming checkPermission is robust enough for roles

const Sidebar = () => {
  const location = useLocation()
  const { user } = useSelector((state) => state.auth)
  console.log("usser ",user);
  

  // Define admin roles for reuse in permission checks
  const adminRoles = ['iadmin', 'pdg', 'directeur_general', 'sga', 'sgad'];
  const academicManagementRoles = ['sga', 'iadmin' ];
  const teacherRoles = ['enseignant', 'assistant'];

  const navGroups = [
    {
      title: "Principal",
      items: [
        { path: "/dashboard", icon: "fa-home", text: "Tableau de Bord", requiredRoles: [] }, // Accessible to all authenticated
        {
          path: "/courses",
          icon: "fa-book",
          text: ["etudiant", ...teacherRoles].includes(user?.role) ? "Mes Cours" : "Les cours",
          requiredRoles: ["etudiant", ...teacherRoles, ...academicManagementRoles],
        }
      ],
    },
    // Groupes spécifiques aux rôles avec affectation
    {
      title: "Ma Filière",
      roles: ["chef_departement"],
      condition: user?.filiere, // Only render if user is chef_departement and has a filiere
      items: [
        { path: `/auditoires?filiere=${user?.filiere}`, icon: "fa-school", text: "Auditoires de ma filière" },
        { path: `/courses?filiere=${user?.filiere}`, icon: "fa-book", text: "Cours de ma filière" },
        { path: `/students?filiere=${user?.filiere}`, icon: "fa-user-graduate", text: "Étudiants de ma filière" },
        { path: `/teachers?filiere=${user?.filiere}`, icon: "fa-chalkboard-teacher", text: "Enseignants de ma filière" },
      ],
    },
    {
      title: "Ma Section",
      roles: ["chef_section"],
      condition: user?.section_id, // Only render if user is chef_section and has a section
      items: [
        { path: `/auditoires?section=${user?.section?.id}`, icon: "fa-school", text: "Auditoires de ma section" },
        { path: `/courses?section=${user?.section?.id}`, icon: "fa-book", text: "Cours de ma section" },
        { path: `/students?section=${user?.section?.id}`, icon: "fa-user-graduate", text: "Étudiants de ma section" },
        { path: `/teachers?section=${user?.section?.id}`, icon: "fa-chalkboard-teacher", text: "Enseignants de ma section" },
      ],
    },
    {
      title: "Mes Cours",
      roles: teacherRoles,
      items: [
        { path: "/courses/my_courses", icon: "fa-book-open", text: "Mes Cours Enseignés" },
        // Potentiellement ajouter des liens vers les étudiants de leurs cours si un endpoint est disponible
      ],
    },
    // Groupes généraux
    {
      title: "Académique",
      roles: ["chef_section,", "chef_departement", "sga", "iadmin"],
      items: [
        { path: "/auditoires", icon: "fa-school", text: "Gestion Auditoires", requiredRoles: academicManagementRoles },
        { path: "/gestion-inscriptions", icon: "fa-user-plus", text: "Inscriptions", requiredRoles: ["sga", "iadmin"] },
        { path: "/tptd", icon: "fa-file-alt", text: "TP/TD", requiredRoles: ["etudiant", ...teacherRoles, "chef_section","chef_departement"] },
        { path: "/quiz", icon: "fa-question-circle", text: "Quiz", requiredRoles: ["etudiant", ...teacherRoles, "chef_section","chef_departement"] },
        { path: "/students", icon: "fa-user-graduate", text: "Tous les Étudiants", requiredRoles: academicManagementRoles },
        { path: "/teachers", icon: "fa-chalkboard-teacher", text: "Tous les Enseignants", requiredRoles: academicManagementRoles },
      ],
    },
    {
      title: "Services",
      items: [
        { path: "/chat", icon: "fa-comments", text: "Chat", requiredRoles: [] },
        { path: "/library", icon: "fa-book-reader", text: "Bibliothèque", requiredRoles: [] },
        { path: "/paiements", icon: "fa-dollar-sign", text: "Paiements", requiredRoles: ["etudiant", "iadmin", "sgad", "caisse"] },
      ],
    },
    {
      title: "Administration",
      items: [
        { path: "/administration", icon: "fa-users-cog", text: "Utilisateurs", requiredRoles: adminRoles },
        { path: "/rh", icon: "fa-users", text: "Ressources Humaines", requiredRoles: ["sgad", "iadmin"] },
        { path: "/comptabilite", icon: "fa-calculator", text: "Comptabilité", requiredRoles: ["caisse", "sgad", "iadmin"] },
        { path: "/apparitorat", icon: "fa-user-check", text: "Apparitorat", requiredRoles: ["apparitorat", "sga", "iadmin"] },
        { path: "/service-it", icon: "fa-laptop-code", text: "Service IT", requiredRoles: ["service_it", "iadmin"] },
      ],
    },
  ]

  const renderNavGroup = (group) => {
    // Check if the group itself should be rendered based on role and condition
    if (group.roles && group.roles.length > 0 && !group.roles.includes(user?.role)) {
      return null;
    }
    if (group.condition === false) { // Explicitly check for false, as condition can be an ID (truthy)
      return null;
    }

    const accessibleItems = group.items.filter(item => {
      // If item has specific requiredRoles, check them
      if (item.requiredRoles && item.requiredRoles.length > 0) {
        return checkPermission(user?.role, item.requiredRoles);
      }
      // If item has no specific requiredRoles, it's accessible if the group is accessible
      return true;
    });

    if (accessibleItems.length === 0) {
      return null;
    }

    return (
      <div key={group.title} className="nav-group mb-2">
        <h6 className="sidebar-heading px-3 mt-3 mb-1 text-muted text-uppercase" style={{ fontSize: '0.75rem' }}>{group.title}</h6>
        {accessibleItems.map(item => (
          <Nav.Item key={item.path}>
            <Nav.Link as={Link} to={item.path} className={location.pathname.startsWith(item.path) ? "active" : ""}>
              <i className={`fas ${item.icon} fa-fw me-2`}></i>
              {item.text}
            </Nav.Link>
          </Nav.Item>
        ))}
      </div>
    )
  }

  return (
    <>
      <style type="text/css">
        {`
          .sidebar {
            position: sticky;
            top: 0;
            height: 100vh;
            overflow-y: auto;
          }
          .sidebar .sidebar-header {
            border-bottom: 1px solid #e3e6f0;
          }
          .sidebar .nav-link {
            padding: 0.75rem 1.5rem;
            color: #5a5c69;
            font-weight: 500;
            border-radius: 0.35rem;
            margin: 0 0.5rem;
            transition: background-color 0.15s ease-in-out, color 0.15s ease-in-out;
          }
          .sidebar .nav-link:hover {
            background-color: #f8f9fa;
            color: #4e73df;
          }
          .sidebar .nav-link.active {
            background-color: #4e73df;
            color: #fff;
            font-weight: 700;
          }
          .sidebar .nav-link .fa-fw {
            width: 1.25em;
          }
        `}
      </style>
      <div className="sidebar border-end bg-light">
        <div className="sidebar-header p-3 text-center">
          <h4 className="text-primary fw-bold">Syntax GU</h4>
        </div>
        <Nav className="flex-column p-2">
          {navGroups.map(renderNavGroup)}
        </Nav>
      </div>
    </>
  )
}

export default Sidebar
