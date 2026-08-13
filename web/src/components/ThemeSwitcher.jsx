/**
 * 🌓 THEME SWITCHER - Basculer entre Light et Dark Mode
 * =====================================================
 * Composant moderne pour changer entre mode clair et sombre
 */

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { toggleTheme, getCurrentThemeName } from "../config/theme"
import { FiSun, FiMoon } from "react-icons/fi"

const ThemeSwitcher = ({ className = "" }) => {
  const [isDark, setIsDark] = useState(getCurrentThemeName() === 'dark')

  useEffect(() => {
    // Synchroniser l'état avec le thème actuel
    setIsDark(getCurrentThemeName() === 'dark')
  }, [])

  const handleToggle = () => {
    const newTheme = toggleTheme()
    setIsDark(newTheme === 'dark')
  }

  return (
    <motion.button
      onClick={handleToggle}
      className={`theme-switcher-btn ${className}`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      title={isDark ? "Passer au mode clair" : "Passer au mode sombre"}
      style={{
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        padding: '8px 12px',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '1.2rem',
        color: 'var(--color-textPrimary)',
        transition: 'all 0.3s ease',
      }}
    >
      <motion.div
        initial={false}
        animate={{ rotate: isDark ? 180 : 0 }}
        transition={{ duration: 0.3 }}
      >
        {isDark ? (
          <FiMoon style={{ fontSize: '1.3rem' }} />
        ) : (
          <FiSun style={{ fontSize: '1.3rem', color: '#F6C23E' }} />
        )}
      </motion.div>
    </motion.button>
  )
}

export default ThemeSwitcher
