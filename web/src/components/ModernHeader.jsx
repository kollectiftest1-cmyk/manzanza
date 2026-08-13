/**
 * 🎨 MODERN HEADER - Inspiré du design Acadex
 * ===========================================
 * Header professionnel avec search, notifications, et profil
 */

import { useState, useEffect } from "react"
import { useSelector, useDispatch } from "react-redux"
import { Link } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { Dropdown, Badge, Form } from "react-bootstrap"
import { logout } from "../store/slices/authSlice"
import { markAllAsRead } from "../store/slices/notificationsSlice"
import ThemeSwitcher from "./ThemeSwitcher"
import UserAvatar from "./UserAvatar"
import SearchModal from "./SearchModal"
import {
  FiSearch, FiBell, FiUser, FiMail, FiCalendar,
  FiSettings, FiLogOut, FiChevronDown, FiMenu
} from "react-icons/fi"

const ModernHeader = () => {
  const dispatch = useDispatch()
  const { user } = useSelector((state) => state.auth)
  const { unreadCount } = useSelector((state) => state.notifications)
  const [searchFocused, setSearchFocused] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showSearchModal, setShowSearchModal] = useState(false)

  // Gérer Ctrl+K pour ouvrir la recherche
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setShowSearchModal(true)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const toggleSidebar = () => {
    const newState = !sidebarOpen
    setSidebarOpen(newState)

    const sidebar = document.getElementById('modernSidebar')
    const overlay = document.querySelector('.sidebar-overlay-backdrop')

    if (sidebar && overlay) {
      if (newState) {
        sidebar.classList.add('show')
        overlay.classList.add('show')
      } else {
        sidebar.classList.remove('show')
        overlay.classList.remove('show')
      }
    }
  }

  const closeSidebar = () => {
    setSidebarOpen(false)
    const sidebar = document.getElementById('modernSidebar')
    const overlay = document.querySelector('.sidebar-overlay-backdrop')
    if (sidebar) sidebar.classList.remove('show')
    if (overlay) overlay.classList.remove('show')
  }

  const handleLogout = () => {
    dispatch(logout())
  }

  const handleMarkAllRead = () => {
    dispatch(markAllAsRead())
  }

  // Format date
  const getCurrentDate = () => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
    return new Date().toLocaleDateString('fr-FR', options)
  }

  // Sample notifications (remplacez par vos vraies données)
  const notifications = [
    { id: 1, title: "Nouveau TP disponible", message: "TP de Programmation Web", time: "Il y a 5 min", unread: true },
    { id: 2, title: "Résultat publié", message: "Quiz de Base de données", time: "Il y a 1h", unread: true },
    { id: 3, title: "Rappel cours", message: "Cours demain à 8h00", time: "Il y a 2h", unread: false },
  ]

  return (
    <>
      <style type="text/css">
        {`
          .modern-header {
            background: var(--color-headerBg);
            border-bottom: 1px solid var(--color-headerBorder);
            padding: 16px 32px;
            position: sticky;
            top: 0;
            z-index: 100;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
            transition: all 0.3s ease;
          }

          .header-content {
            display: flex;
            align-items: center;
            justify-content: space-between;
            max-width: 100%;
          }

          .header-left {
            display: flex;
            align-items: center;
            gap: 24px;
            flex: 1;
          }

          .header-title {
            margin: 0;
            font-size: 1.5rem;
            font-weight: 700;
            color: var(--color-textWhite);
          }

          .header-date {
            font-size: 0.875rem;
            color: rgba(255, 255, 255, 0.85);
            display: flex;
            align-items: center;
            gap: 6px;
          }

          .header-search {
            position: relative;
            width: 100%;
            max-width: 400px;
          }

          .header-search input {
            width: 100%;
            padding: 10px 16px 10px 40px;
            border: 1px solid var(--color-border);
            border-radius: 10px;
            background: var(--color-headerSearchBg);
            color: var(--color-textPrimary);
            font-size: 0.9rem;
            transition: all 0.3s ease;
          }

          .header-search input:focus {
            outline: none;
            border-color: var(--color-primary);
            background: var(--color-headerSearchBg);
            box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.16);
          }

          .header-search-icon {
            position: absolute;
            left: 12px;
            top: 50%;
            transform: translateY(-50%);
            color: rgba(255, 255, 255, 0.75);
            pointer-events: none;
          }

          .header-right {
            display: flex;
            align-items: center;
            gap: 12px;
          }

          .header-icon-btn {
            position: relative;
            width: 40px;
            height: 40px;
            border-radius: 10px;
            border: none;
            background: rgba(255, 255, 255, 0.1);
            color: var(--color-textWhite);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.2s ease;
          }

          .header-icon-btn:hover {
            background: rgba(255, 255, 255, 0.18);
          }

          .notification-badge {
            position: absolute;
            top: -4px;
            right: -4px;
            min-width: 18px;
            height: 18px;
            border-radius: 9px;
            background: var(--color-danger);
            color: white;
            font-size: 0.7rem;
            font-weight: 600;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0 4px;
          }

          .user-profile-btn {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 6px 12px 6px 6px;
            border-radius: 10px;
            border: 1px solid rgba(255,255,255,0.2);
            background: rgba(255,255,255,0.14);
            cursor: pointer;
            transition: all 0.2s ease;
            color: var(--color-textWhite);
          }

          .user-profile-btn:hover {
            background: rgba(255,255,255,0.22);
            border-color: rgba(255,255,255,0.28);
          }

          .user-avatar-header {
            width: 36px;
            height: 36px;
            border-radius: 8px;
            background: var(--color-gradientPrimary);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: 600;
            font-size: 0.9rem;
          }

          .user-info {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
          }

          .user-name {
            font-size: 0.9rem;
            font-weight: 600;
            color: var(--color-textPrimary);
            margin: 0;
            line-height: 1.2;
          }

          .user-role {
            font-size: 0.75rem;
            color: var(--color-textSecondary);
            margin: 0;
            line-height: 1.2;
          }

          .dropdown-menu-modern {
            border: 1px solid var(--color-border);
            border-radius: 12px;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
            padding: 8px;
            min-width: 280px;
            background: var(--color-cardBg);
            margin-top: 8px;
          }

          .dropdown-item-modern {
            padding: 10px 12px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            gap: 12px;
            color: var(--color-textPrimary);
            transition: all 0.2s ease;
            cursor: pointer;
            border: none;
            background: transparent;
            width: 100%;
            text-align: left;
          }

          .dropdown-item-modern:hover {
            background: var(--color-sidebarHover);
            color: var(--color-primary);
          }

          .dropdown-header-modern {
            padding: 12px;
            font-size: 0.85rem;
            font-weight: 600;
            color: var(--color-textPrimary);
            border-bottom: 1px solid var(--color-border);
            margin-bottom: 8px;
          }

          .notification-item {
            padding: 12px;
            border-radius: 8px;
            margin-bottom: 4px;
            cursor: pointer;
            transition: all 0.2s ease;
            border-left: 3px solid transparent;
          }

          .notification-item:hover {
            background: var(--color-sidebarHover);
          }

          .notification-item.unread {
            background: var(--color-primaryLight);
            border-left-color: var(--color-primary);
          }

          .notification-title {
            font-size: 0.9rem;
            font-weight: 600;
            color: var(--color-textPrimary);
            margin-bottom: 4px;
          }

          .notification-message {
            font-size: 0.8rem;
            color: var(--color-textSecondary);
            margin-bottom: 4px;
          }

          .notification-time {
            font-size: 0.75rem;
            color: var(--color-textMuted);
          }

          .menu-toggle-btn {
            display: none;
            width: 44px;
            height: 44px;
            border-radius: 10px;
            border: none;
            background: var(--color-sidebarHover);
            color: var(--color-textPrimary);
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
          }

          .menu-toggle-btn:hover {
            background: var(--color-primary);
            color: white;
            transform: scale(1.05);
          }

          .menu-toggle-btn:active {
            transform: scale(0.95);
          }

          .menu-toggle-btn::before {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            width: 0;
            height: 0;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.2);
            transform: translate(-50%, -50%);
            transition: width 0.3s, height 0.3s;
          }

          .menu-toggle-btn:hover::before {
            width: 100%;
            height: 100%;
          }

          @media (max-width: 991px) {
            .menu-toggle-btn {
              display: flex;
            }
          }

          @media (max-width: 768px) {
            .header-search {
              display: none;
            }
            .header-date {
              display: none;
            }
            .user-info {
              display: none;
            }
            .modern-header {
              padding: 12px 16px;
            }
          }
        `}
      </style>

      <header className="modern-header">
        <div className="header-content">
          {/* Left Section */}
          <div className="header-left">
            {/* Mobile Menu Toggle */}
            <motion.button
              className="menu-toggle-btn"
              onClick={toggleSidebar}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Menu"
            >
              <FiMenu size={22} />
            </motion.button>
            <div>
              <h1 className="header-title">Dashboard</h1>
              <div className="header-date">
                <FiCalendar size={14} />
                {getCurrentDate()}
              </div>
            </div>

            {/* Search Bar */}
            <div className="header-search">
              <FiSearch className="header-search-icon" size={18} />
              <Form.Control
                type="text"
                placeholder="Rechercher..."
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
              />
            </div>
          </div>

          {/* Right Section */}
          <div className="header-right">
            {/* Theme Switcher */}
            <ThemeSwitcher />

            {/* Messages */}
            <motion.button
              className="header-icon-btn"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Messages"
            >
              <FiMail size={20} />
            </motion.button>

            {/* Notifications */}
            <div style={{ position: 'relative' }}>
              <motion.button
                className="header-icon-btn"
                onClick={() => setShowNotifications(!showNotifications)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title="Notifications"
              >
                <FiBell size={20} />
                {unreadCount > 0 && (
                  <motion.span
                    className="notification-badge"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500 }}
                  >
                    {unreadCount}
                  </motion.span>
                )}
              </motion.button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    className="dropdown-menu-modern"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    style={{ position: 'absolute', right: 0, top: '100%' }}
                  >
                    <div className="dropdown-header-modern">
                      Notifications
                      <button
                        onClick={handleMarkAllRead}
                        style={{
                          float: 'right',
                          background: 'none',
                          border: 'none',
                          color: 'var(--color-primary)',
                          fontSize: '0.8rem',
                          cursor: 'pointer'
                        }}
                      >
                        Tout marquer comme lu
                      </button>
                    </div>
                    {notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`notification-item ${notif.unread ? 'unread' : ''}`}
                      >
                        <div className="notification-title">{notif.title}</div>
                        <div className="notification-message">{notif.message}</div>
                        <div className="notification-time">{notif.time}</div>
                      </div>
                    ))}
                    <Link to="/notifications" style={{ textDecoration: 'none' }}>
                      <button className="dropdown-item-modern" style={{ marginTop: '8px' }}>
                        Voir toutes les notifications
                      </button>
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* User Profile */}
            <div style={{ position: 'relative' }}>
              <motion.button
                className="user-profile-btn"
                onClick={() => setShowProfile(!showProfile)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <UserAvatar user={user} size="md" showStatus={true} />
                <div className="user-info">
                  <p className="user-name">{user?.name || 'Utilisateur'}</p>
                  <p className="user-role">{user?.role || 'Étudiant'}</p>
                </div>
                <FiChevronDown size={16} />
              </motion.button>

              <AnimatePresence>
                {showProfile && (
                  <motion.div
                    className="dropdown-menu-modern"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    style={{ position: 'absolute', right: 0, top: '100%' }}
                  >
                    <div className="dropdown-header-modern">
                      Mon Compte
                    </div>
                    <Link to="/profile" style={{ textDecoration: 'none' }}>
                      <button className="dropdown-item-modern">
                        <FiUser size={18} />
                        <span>Mon Profil</span>
                      </button>
                    </Link>
                    <Link to="/settings" style={{ textDecoration: 'none' }}>
                      <button className="dropdown-item-modern">
                        <FiSettings size={18} />
                        <span>Paramètres</span>
                      </button>
                    </Link>
                    <div style={{ borderTop: '1px solid var(--color-border)', margin: '8px 0' }} />
                    <button className="dropdown-item-modern" onClick={handleLogout}>
                      <FiLogOut size={18} />
                      <span>Déconnexion</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      {/* Search Modal */}
      <SearchModal
        show={showSearchModal}
        onHide={() => setShowSearchModal(false)}
      />
    </>
  )
}

export default ModernHeader
