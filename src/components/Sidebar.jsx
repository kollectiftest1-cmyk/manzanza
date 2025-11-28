"use client"

import { Nav } from "react-bootstrap"
import { Link, useLocation } from "react-router-dom"
import { useSelector } from "react-redux"
import { checkPermission } from "../utils/permissions"

const Sidebar = () => {
  const location = useLocation()
  const { user } = useSelector((state) => state.auth)

  const navGroups = [
    {
      title: "Principal",
      items: [
        { path: "/dashboard", icon: "fa-home", text: "Tableau de Bord", requiredRoles: [] },
        {
          path: "/courses",
          icon: "fa-book",
          text: ["etudiant", "enseignant", "assistant"].includes(user?.role)
            ? "Mes Cours"
            : "Les cours",
          requiredRoles: ["etudiant", "enseignant", "assistant", "sga", "chef_departement", "chef_section", "iadmin"],
        }
      ],
    },
    {
      title: "Académique",
      items: [
        { path: "/auditoires", icon: "fa-school", text: "Gestion Academ", requiredRoles: ["sga", "iadmin","chef_section"] },
        { path: "/gestion-inscriptions", icon: "fa-user-plus", text: "Inscriptions", requiredRoles: ["sga", "iadmin"] },
        { path: "/tptd", icon: "fa-file-alt", text: "TP/TD", requiredRoles: ["etudiant", "enseignant",'chef_section'] },
        { path: "/quiz", icon: "fa-question-circle", text: "Quiz", requiredRoles: ["etudiant", "enseignant","chef_section"] },
      ],
    },
    {
      title: "Services",
      items: [
        { path: "/chat", icon: "fa-comments", text: "Chat", requiredRoles: [] },
        { path: "/library", icon: "fa-book-reader", text: "Bibliothèque", requiredRoles: [] },
        { path: "/paiements", icon: "fa-dollar-sign", text: "Paiements", requiredRoles: ["etudiant"] },
      ],
    },
    {
      title: "Administration",
      items: [
        { path: "/administration", icon: "fa-users-cog", text: "Utilisateurs", requiredRoles: ["sga", "iadmin"] },
        { path: "/rh", icon: "fa-users", text: "Ressources Humaines", requiredRoles: ["sgad", "iadmin"] },
        { path: "/comptabilite", icon: "fa-calculator", text: "Comptabilité", requiredRoles: ["caisse", "sgad", "iadmin"] },
        { path: "/apparitorat", icon: "fa-user-check", text: "Apparitorat", requiredRoles: ["appariteur", "sga", "iadmin"] },
        { path: "/service-it", icon: "fa-laptop-code", text: "Service IT", requiredRoles: ["service_it", "iadmin"] },
      ],
    },
  ]

  const renderNavGroup = (group) => {
    const accessibleItems = group.items.filter(item => checkPermission(user?.role, item.requiredRoles))
    if (accessibleItems.length === 0) {
      return null
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
