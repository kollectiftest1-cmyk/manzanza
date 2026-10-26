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
  FiChevronRight, FiChevronDown, FiGrid, FiUserCheck, FiX, FiBriefcase,
  FiFile, FiCalendar, FiTrash2, FiShield, FiAward, FiCheckSquare, FiBarChart2, FiUserPlus
} from "react-icons/fi"

const ModernSidebar = () => {
  const location = useLocation()
  const { user } = useSelector((state) => state.auth)
  const [expandedGroups, setExpandedGroups] = useState({})

  // Define admin roles for reuse in permission checks
  const adminRoles = ['pdg', 'directeur_general', 'sga', 'sgad']
  const academicManagementRoles = ['sga', 'pdg']
  const teacherRoles = ['enseignant', 'assistant']

  // Configuration des icônes pour chaque route
  const iconMap = {
    '/dashboard': FiHome,
    '/courses': FiBook,
    '/auditoires': FiGrid,
    '/gestion-inscriptions': FiUsers,
    '/horaire': FiCalendar,
    '/tptd': FiFileText,
    '/releves-cotes': FiFileText,
    '/quiz': FiHelpCircle,
    '/students': FiUsers,
    '/teachers': FiUsers,
    '/chat': FiMessageSquare,
    '/library': FiBookOpen,
    '/paiements': FiDollarSign,
    '/administration': FiSettings,
    '/rh/employees': FiBriefcase,
    '/rh/contracts': FiFile,
    '/rh/payrolls': FiDollarSign,
    '/rh/leaves': FiCalendar,
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
      title: "Ma Faculté",
      roles: ["chef_section"],
      condition: user?.section,
      items: [
        { path: `/auditoires?section=${user?.section}`, icon: "grid", text: "Auditoires de ma faculté" },
        { path: `/courses?section=${user?.section}`, icon: "book", text: "Cours de ma faculté" },
        { path: `/students?section=${user?.section}`, icon: "users", text: "Étudiants de ma faculté" },
        { path: `/teachers?section=${user?.section}`, icon: "users", text: "Enseignants de ma faculté" },
      ],
    },
    {
      title: "Académique",
      roles: ["chef_section", "chef_departement", "sga", "pdg", 'enseignant', 'assistant', 'etudiant', 'apparitorat', 'caisse', 'commission_admission', 'jury', 'directeur_general'],
      items: [
        { path: "/auditoires", icon: "grid", text: "Gestion Auditoires", requiredRoles: [...academicManagementRoles, ...teacherRoles] },
        { path: "/horaire", icon: "calendar", text: "Horaires", requiredRoles: [] },
        { path: "/calendrier", icon: "calendar", text: "Calendrier Académique", requiredRoles: [] },
        {
          path: "/releves-cotes",
          icon: "file-text",
          text: "Relevés des cotes",
          requiredRoles: ["etudiant", ...teacherRoles, "chef_section", "chef_departement", "sga", "sgad", "pdg", "directeur_general"]
        },
        { path: "/gestion-inscriptions", icon: "users", text: "Admissions", requiredRoles: ["sga", "pdg", "apparitorat", "caisse", "commission_admission"] },
        { path: "/unites-enseignement", icon: "grid", text: "Unités d'enseignement", requiredRoles: ["sga", "pdg", "chef_section", "chef_departement"] },
        { path: "/inscriptions-annuelles", icon: "user-check", text: "Inscriptions annuelles", requiredRoles: ["sga", "pdg", "apparitorat", "chef_section", "chef_departement"] },
        { path: "/validation-notes", icon: "check-square", text: "Validation des notes", requiredRoles: ["sga", "pdg", "chef_section", "chef_departement", ...teacherRoles] },
        { path: "/deliberations", icon: "award", text: "Délibérations", requiredRoles: ["sga", "pdg", "directeur_general", "chef_section", "chef_departement", "jury", ...teacherRoles] },
        { path: "/memoires", icon: "book-open", text: ["etudiant"].includes(user?.role) ? "Mon TFC / mémoire" : "TFC & mémoires", requiredRoles: ["etudiant", "sga", "pdg", "directeur_general", "chef_section", "chef_departement", "jury", ...teacherRoles] },
        { path: "/documents-officiels", icon: "file-text", text: "Documents officiels", requiredRoles: ["sga", "pdg", "apparitorat"] },
        { path: "/mes-resultats", icon: "award", text: "Mes résultats", requiredRoles: ["etudiant"] },
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
        { path: "/gestion-enseignants", icon: "user-plus", text: "Gestion Enseignants", requiredRoles: [...academicManagementRoles] },
        { path: "/gestion-etudiants", icon: "user-check", text: "Gestion Étudiants", requiredRoles: [...academicManagementRoles] },
        { path: "/configuration-notes", icon: "sliders", text: "Config. Académique", requiredRoles: ["sga", "pdg"] },
      ],
    },
    {
      title: "Services",
      items: [
        { path: "/chat", icon: "message-square", text: "Chat", requiredRoles: [] },
        { path: "/rh/mes-bulletins", icon: "briefcase", text: "Mon espace RH", requiredRoles: ["enseignant", "assistant", "sga", "sgad", "caisse", "comptable", "apparitorat", "bibliothecaire", "chef_section", "chef_departement", "directeur_general", "jury", "service_it"] },
        { path: "/rh/heures", icon: "calendar", text: "Mes heures prestées", requiredRoles: ["enseignant", "assistant"] },
        { path: "/assistance", icon: "help-circle", text: "Assistance IT", requiredRoles: ["etudiant", "enseignant", "assistant", "sga", "sgad", "caisse", "comptable", "apparitorat", "bibliothecaire", "chef_section", "chef_departement", "pdg", "directeur_general", "jury"] },
        { path: "/library", icon: "book-open", text: "Bibliothèque", requiredRoles: [] },
        { path: "/paiements", icon: "dollar-sign", text: "Mes Paiements", requiredRoles: ["etudiant"] },
        { path: "/caisse", icon: "dollar-sign", text: "Caisse", requiredRoles: ["caisse", "pdg", "directeur_general"] },
        { path: "/gestion-frais", icon: "dollar-sign", text: "Gestion Frais", requiredRoles: ["pdg", "sgad", "caisse", "directeur_general"] },
        { path: "/finances", icon: "dollar-sign", text: "Barèmes & caisse", requiredRoles: ["pdg", "sgad", "caisse", "comptable", "directeur_general"] },
      ],
    },
    {
      title: "Ressources Humaines",
      roles: ["sgad", "pdg", "directeur_general", "comptable", "caisse"],
      items: [
        { path: "/rh/employees", icon: "briefcase", text: "Employés", requiredRoles: ["sgad", "pdg", "directeur_general"] },
        { path: "/rh/contracts", icon: "file-text", text: "Contrats", requiredRoles: ["sgad", "pdg", "directeur_general"] },
        { path: "/rh/payrolls", icon: "dollar-sign", text: "Paie du personnel", requiredRoles: ["sgad", "pdg", "directeur_general", "comptable", "caisse"] },
        { path: "/rh/presences", icon: "user-check", text: "Pointage du personnel", requiredRoles: ["sgad", "pdg", "directeur_general"] },
        { path: "/rh/heures", icon: "calendar", text: "Heures prestées", requiredRoles: ["sgad", "pdg", "directeur_general"] },
        { path: "/rh/leaves", icon: "calendar", text: "Congés", requiredRoles: ["sgad", "pdg", "directeur_general"] },
      ],
    },
    {
      title: "Administration",
      items: [
        { path: "/administration", icon: "settings", text: "Utilisateurs", requiredRoles: adminRoles },
        { path: "/comptabilite", icon: "dollar-sign", text: "Comptabilité", requiredRoles: ["caisse", "comptable", "sgad", "pdg", "directeur_general"] },
        { path: "/apparitorat", icon: "users", text: "Apparitorat", requiredRoles: ["apparitorat", "sga", "pdg"] },
        { path: "/service-it", icon: "settings", text: "Service IT (tickets)", requiredRoles: ["service_it", "pdg"] },
        { path: "/pilotage", icon: "bar-chart", text: "Pilotage", requiredRoles: ["pdg", "sga", "sgad", "directeur_general", "chef_section", "chef_departement", "comptable"] },
        { path: "/parametres", icon: "settings", text: "Paramètres établissement", requiredRoles: ["pdg", "directeur_general", "sga", "sgad"] },
        { path: "/affectations", icon: "user-plus", text: "Affectations de rôles", requiredRoles: ["pdg", "sga", "sgad"] },
        { path: "/journal-audit", icon: "shield", text: "Journal d'audit", requiredRoles: ["pdg", "directeur_general"] },
        { path: "/corbeille", icon: "trash", text: "Corbeille", requiredRoles: [] },
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
      'briefcase': FiBriefcase,
      'calendar': FiCalendar,
      'trash': FiTrash2,
      'shield': FiShield,
      'award': FiAward,
      'check-square': FiCheckSquare,
      'bar-chart': FiBarChart2,
      'user-plus': FiUserPlus,
    }
    return icons[iconName] || FiHome
  }

  const renderNavGroup = (group, index) => {
    // Check if the group itself should be rendered based on role and condition
    if (group.roles && group.roles.length > 0 && !checkPermission(user, group.roles)) {
      return null
    }
    // Groupes « Ma filière / Ma faculté » : seulement si l'utilisateur a réellement ce périmètre.
    if ('condition' in group && !group.condition) {
      return null
    }

    const accessibleItems = group.items.filter(item => {
      if (item.requiredRoles && item.requiredRoles.length > 0) {
        return checkPermission(user, item.requiredRoles)
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
            height: 100vh;
            overflow-y: auto;
            background: var(--color-sidebarBg);
            border-right: 1px solid var(--color-sidebarBorder);
            box-shadow: 2px 0 8px rgba(0, 0, 0, 0.03);
            transition: all 0.3s ease;
          }

          @media (max-width: 991px) {
            .modern-sidebar {
              position: fixed;
              left: -280px;
              top: 0;
              width: 280px;
              z-index: 1050;
              box-shadow: 4px 0 12px rgba(0, 0, 0, 0.15);
            }

            .modern-sidebar.show {
              left: 0;
            }
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
            display: flex;
            align-items: center;
            justify-content: space-between;
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
            color: var(--color-sidebarText) !important;
            transform: translateX(4px);
          }

          .modern-nav-link.active {
            color: var(--color-sidebarText) !important;
          }

          .modern-nav-link.active:hover {
            transform: translateX(0);
          }

          .nav-group {
            margin-bottom: 16px;
          }

          .sidebar-close-btn {
            display: none;
            width: 40px;
            height: 40px;
            border-radius: 12px;
            border: none;
            background: linear-gradient(135deg, rgba(255, 59, 59, 0.1) 0%, rgba(255, 59, 59, 0.05) 100%);
            color: var(--color-danger);
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            margin-left: auto;
            position: relative;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(255, 59, 59, 0.15);
          }

          .sidebar-close-btn::before {
            content: '';
            position: absolute;
            inset: 0;
            border-radius: 12px;
            background: linear-gradient(135deg, var(--color-danger) 0%, #e74c3c 100%);
            opacity: 0;
            transition: opacity 0.3s ease;
            z-index: -1;
          }

          .sidebar-close-btn:hover {
            color: white;
            transform: rotate(90deg) scale(1.05);
            box-shadow: 0 4px 16px rgba(255, 59, 59, 0.4);
          }

          .sidebar-close-btn:hover::before {
            opacity: 1;
          }

          .sidebar-close-btn:active {
            transform: scale(0.9) rotate(90deg);
            box-shadow: 0 2px 8px rgba(255, 59, 59, 0.3);
          }

          /* Mobile Only */
          @media (max-width: 991px) {
            .sidebar-close-btn {
              display: flex;
            }
          }

          /* Desktop - Force Hide */
          @media (min-width: 992px) {
            .sidebar-close-btn {
              display: none !important;
            }
          }
        `}
      </style>

      <div className="modern-sidebar" id="modernSidebar">
        {/* Logo / Header */}
        <div className="sidebar-header">
          <Link to="/dashboard" className="sidebar-logo">
            <img
              src="/logo.jpeg"
              alt=""
              onError={(e) => { e.currentTarget.style.display = 'none' }}
              style={{
                width: '45px',
                height: '45px',
                objectFit: 'contain',
                borderRadius: '8px'
              }}
            />
            <h4 className="sidebar-logo-text">MAZANZA</h4>
          </Link>

          {/* Close Button - Mobile Only */}
          <motion.button
            className="sidebar-close-btn"
            onClick={() => {
              const sidebar = document.getElementById('modernSidebar')
              const overlay = document.querySelector('.sidebar-overlay-backdrop')
              if (sidebar) sidebar.classList.remove('show')
              if (overlay) overlay.classList.remove('show')
            }}
            whileHover={{
              rotate: 90,
              scale: 1.05
            }}
            whileTap={{
              scale: 0.9,
              rotate: 90
            }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 20
            }}
            title="Fermer le menu"
          >
            <FiX size={22} strokeWidth={2.5} />
          </motion.button>
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
