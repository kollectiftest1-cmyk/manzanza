/**
 * 🎨 MODERN SIDEBAR - Inspiré du design Acadex
 * ============================================
 * Sidebar professionnelle avec animations et support dark mode
 */

import { Nav } from "react-bootstrap"
import { Link, useLocation } from "react-router-dom"
import { useSelector } from "react-redux"
import { motion, AnimatePresence } from "framer-motion"
import { useState } from "react"
import { checkPermission } from "../utils/permissions"
import {
  FiHome, FiBook, FiUsers, FiMessageSquare, FiBookOpen,
  FiDollarSign, FiSettings, FiFileText, FiHelpCircle,
  FiChevronRight, FiChevronDown, FiGrid, FiUserCheck
} from "react-icons/fi"

const ModernSidebar = () => {
  const location = useLocation()
  const { user } = useSelector((state) => state.auth)
  const [expandedGroups, setExpandedGroups] = useState({})

  // Define admin roles for reuse in permission checks
  const adminRoles = ['iadmin', 'pdg', 'directeur_general', 'sga', 'sgad']
  const academicManagementRoles = ['sga', 'iadmin']
  const teacherRoles = ['enseignant', 'assistant']

  // Configuration des icônes pour chaque route
  const iconMap = {
    '/dashboard': FiHome,
    '/courses': FiBook,
    '/auditoires': FiGrid,
    '/gestion-inscriptions': FiUsers,
    '/tptd': FiFileText,
    '/quiz': FiHelpCircle,
    '/students': FiUsers,
    '/teachers': FiUsers,
    '/chat': FiMessageSquare,
    '/library': FiBookOpen,
    '/paiements': FiDollarSign,
    '/administration': FiSettings,
    '/rh': FiUsers,
    '/comptabilite': FiDollarSign,
    '/apparitorat': FiUsers,
    '/service-it': FiSettings,
  }

  const navGroups = [
    {
      title: "Principal",
      items: [
        { path: "/dashboard", icon: "home", text: "Tableau de Bord", requiredRoles: [] },
        {
          path: "/courses",
          icon: "book",
          text: ["etudiant", ...teacherRoles].includes(user?.role) ? "Mes Cours" : "Les cours",
          requiredRoles: ["etudiant", ...teacherRoles, ...academicManagementRoles],
        }
      ],
    },
    {
      title: "Ma Filière",
      roles: ["chef_departement"],
      condition: user?.filiere,
      items: [
        { path: `/auditoires?filiere=${user?.filiere}`, icon: "grid", text: "Auditoires de ma filière" },
        { path: `/courses?filiere=${user?.filiere}`, icon: "book", text: "Cours de ma filière" },
        { path: `/students?filiere=${user?.filiere}`, icon: "users", text: "Étudiants de ma filière" },
        { path: `/teachers?filiere=${user?.filiere}`, icon: "users", text: "Enseignants de ma filière" },
      ],
    },
    {
      title: "Ma Section",
      roles: ["chef_section"],
      condition: user?.section,
      items: [
        { path: `/auditoires?section=${user?.section}`, icon: "grid", text: "Auditoires de ma section" },
        { path: `/courses?section=${user?.section}`, icon: "book", text: "Cours de ma section" },
        { path: `/students?section=${user?.section}`, icon: "users", text: "Étudiants de ma section" },
        { path: `/teachers?section=${user?.section}`, icon: "users", text: "Enseignants de ma section" },
      ],
    },
    {
      title: "Académique",
      roles: ["chef_section", "chef_departement", "sga", "iadmin", 'enseignant', 'assistant', 'etudiant'],
      items: [
        { path: "/auditoires", icon: "grid", text: "Gestion Auditoires", requiredRoles: [...academicManagementRoles, ...teacherRoles] },
        { path: "/gestion-inscriptions", icon: "users", text: "Inscriptions", requiredRoles: ["sga", "iadmin"] },
        // TP/TD Links - Different for teachers and students
        {
          path: teacherRoles.includes(user?.role) ? "/teacher/assignments" : "/student/assignments",
          icon: "file-text",
          text: teacherRoles.includes(user?.role) ? "Gérer TP/TD" : "Mes TP/TD",
          requiredRoles: ["etudiant", ...teacherRoles]
        },
        // Quiz Links - Different for teachers and students
        {
          path: teacherRoles.includes(user?.role) ? "/teacher/quizzes" : "/student/quizzes",
          icon: "help-circle",
          text: teacherRoles.includes(user?.role) ? "Gérer Quiz" : "Mes Quiz",
          requiredRoles: ["etudiant", ...teacherRoles]
        },
        // Attendance/Présences - Only for teachers
        {
          path: "/teacher/attendance",
          icon: "user-check",
          text: "Gérer Présences",
          requiredRoles: [...teacherRoles]
        },
        { path: "/students", icon: "users", text: "Tous les Étudiants", requiredRoles: academicManagementRoles },
        { path: "/teachers", icon: "users", text: "Tous les Enseignants", requiredRoles: academicManagementRoles },
      ],
    },
    {
      title: "Services",
      items: [
        { path: "/chat", icon: "message-square", text: "Chat", requiredRoles: [] },
        { path: "/library", icon: "book-open", text: "Bibliothèque", requiredRoles: [] },
        { path: "/paiements", icon: "dollar-sign", text: "Paiements", requiredRoles: ["etudiant", "iadmin", "sgad", "caisse"] },
      ],
    },
    {
      title: "Administration",
      items: [
        { path: "/administration", icon: "settings", text: "Utilisateurs", requiredRoles: adminRoles },
        { path: "/rh", icon: "users", text: "Ressources Humaines", requiredRoles: ["sgad", "iadmin"] },
        { path: "/comptabilite", icon: "dollar-sign", text: "Comptabilité", requiredRoles: ["caisse", "sgad", "iadmin"] },
        { path: "/apparitorat", icon: "users", text: "Apparitorat", requiredRoles: ["apparitorat", "sga", "iadmin"] },
        { path: "/service-it", icon: "settings", text: "Service IT", requiredRoles: ["service_it", "iadmin"] },
      ],
    },
  ]

  const toggleGroup = (groupTitle) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupTitle]: !prev[groupTitle]
    }))
  }

  const getIcon = (iconName) => {
    const icons = {
      'home': FiHome,
      'book': FiBook,
      'grid': FiGrid,
      'users': FiUsers,
      'file-text': FiFileText,
      'help-circle': FiHelpCircle,
      'user-check': FiUserCheck,
      'message-square': FiMessageSquare,
      'book-open': FiBookOpen,
      'dollar-sign': FiDollarSign,
      'settings': FiSettings,
    }
    return icons[iconName] || FiHome
  }

  const renderNavGroup = (group, index) => {
    // Check if the group itself should be rendered based on role and condition
    if (group.roles && group.roles.length > 0 && !group.roles.includes(user?.role)) {
      return null
    }
    if (group.condition === false) {
      return null
    }

    const accessibleItems = group.items.filter(item => {
      if (item.requiredRoles && item.requiredRoles.length > 0) {
        return checkPermission(user?.role, item.requiredRoles)
      }
      return true
    })

    if (accessibleItems.length === 0) {
      return null
    }

    const isExpanded = expandedGroups[group.title] !== false

    return (
      <motion.div
        key={group.title}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className="nav-group mb-3"
      >
        <div
          className="sidebar-heading"
          onClick={() => toggleGroup(group.title)}
          style={{
            cursor: 'pointer',
            padding: '8px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.75rem',
            fontWeight: '700',
            textTransform: 'uppercase',
            color: 'var(--color-sidebarTextLight)',
            letterSpacing: '0.5px',
            marginBottom: '8px',
            userSelect: 'none',
          }}
        >
          <span>{group.title}</span>
          <motion.div
            animate={{ rotate: isExpanded ? 0 : -90 }}
            transition={{ duration: 0.2 }}
          >
            <FiChevronDown size={14} />
          </motion.div>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{ overflow: 'hidden' }}
            >
              {accessibleItems.map((item, itemIndex) => {
                const Icon = getIcon(item.icon)
                const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/')

                return (
                  <motion.div
                    key={item.path}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: itemIndex * 0.05 }}
                  >
                    <Nav.Item>
                      <Nav.Link
                        as={Link}
                        to={item.path}
                        className={isActive ? "active modern-nav-link" : "modern-nav-link"}
                        style={{
                          padding: '12px 20px',
                          margin: '4px 12px',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          fontSize: '0.9rem',
                          fontWeight: isActive ? '600' : '500',
                          color: isActive ? 'var(--color-sidebarActive)' : 'var(--color-sidebarText)',
                          backgroundColor: isActive ? 'var(--color-sidebarActiveBg)' : 'transparent',
                          transition: 'all 0.2s ease',
                          textDecoration: 'none',
                          position: 'relative',
                          overflow: 'hidden',
                        }}
                      >
                        <Icon size={18} />
                        <span>{item.text}</span>
                        {isActive && (
                          <motion.div
                            layoutId="activeIndicator"
                            style={{
                              position: 'absolute',
                              left: 0,
                              top: 0,
                              bottom: 0,
                              width: '3px',
                              backgroundColor: 'var(--color-sidebarActive)',
                              borderRadius: '0 3px 3px 0',
                            }}
                          />
                        )}
                      </Nav.Link>
                    </Nav.Item>
                  </motion.div>
                )
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    )
  }

  return (
    <>
      <style type="text/css">
        {`
          .modern-sidebar {
            position: sticky;
            top: 0;
            height: 100vh;
            overflow-y: auto;
            background: var(--color-sidebarBg);
            border-right: 1px solid var(--color-sidebarBorder);
            box-shadow: 2px 0 8px rgba(0, 0, 0, 0.03);
            transition: all 0.3s ease;
          }

          .modern-sidebar::-webkit-scrollbar {
            width: 6px;
          }

          .modern-sidebar::-webkit-scrollbar-track {
            background: transparent;
          }

          .modern-sidebar::-webkit-scrollbar-thumb {
            background: var(--color-border);
            border-radius: 3px;
          }

          .modern-sidebar::-webkit-scrollbar-thumb:hover {
            background: var(--color-secondary);
          }

          .sidebar-header {
            padding: 24px 20px;
            border-bottom: 1px solid var(--color-sidebarBorder);
            background: var(--color-sidebarBg);
            position: sticky;
            top: 0;
            z-index: 10;
          }

          .sidebar-logo {
            display: flex;
            align-items: center;
            gap: 12px;
            text-decoration: none;
          }

          .sidebar-logo-icon {
            width: 40px;
            height: 40px;
            background: var(--color-gradientPrimary);
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 1.4rem;
            font-weight: bold;
            box-shadow: 0 4px 12px rgba(78, 115, 223, 0.3);
          }

          .sidebar-logo-text {
            font-size: 1.25rem;
            font-weight: 700;
            color: var(--color-sidebarLogo);
            margin: 0;
          }

          .modern-nav-link:hover {
            background-color: var(--color-sidebarHover) !important;
            transform: translateX(4px);
          }

          .modern-nav-link.active:hover {
            transform: translateX(0);
          }

          .nav-group {
            margin-bottom: 16px;
          }
        `}
      </style>

      <div className="modern-sidebar">
        {/* Logo / Header */}
        <div className="sidebar-header">
          <Link to="/dashboard" className="sidebar-logo">
            <div className="sidebar-logo-icon">A</div>
            <h4 className="sidebar-logo-text">Acadex</h4>
          </Link>
        </div>

        {/* Navigation */}
        <Nav className="flex-column p-2 pt-3">
          {navGroups.map((group, index) => renderNavGroup(group, index))}
        </Nav>
      </div>
    </>
  )
}

export default ModernSidebar
