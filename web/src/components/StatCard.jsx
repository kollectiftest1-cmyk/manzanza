/**
 * 📊 STAT CARD - Carte de statistique animée
 * ==========================================
 * Composant réutilisable pour afficher des statistiques
 */

import { motion } from "framer-motion"
import { FiArrowUp, FiArrowDown, FiTrendingUp } from "react-icons/fi"

const StatCard = ({
  title,
  value,
  icon: Icon,
  color = "primary",
  trend,
  trendValue,
  subtitle,
  delay = 0,
  onClick
}) => {
  const colorMap = {
    primary: {
      bg: 'var(--color-primary)',
      gradient: 'var(--color-gradientPrimary)',
      light: 'var(--color-primaryLight)',
    },
    success: {
      bg: 'var(--color-success)',
      gradient: 'var(--color-gradientSuccess)',
      light: 'rgba(28, 200, 138, 0.1)',
    },
    warning: {
      bg: 'var(--color-warning)',
      gradient: 'var(--color-gradientWarning)',
      light: 'rgba(246, 194, 62, 0.1)',
    },
    danger: {
      bg: 'var(--color-danger)',
      gradient: 'var(--color-gradientDanger)',
      light: 'rgba(231, 74, 59, 0.1)',
    },
    info: {
      bg: 'var(--color-info)',
      gradient: 'var(--color-gradientInfo)',
      light: 'rgba(54, 185, 204, 0.1)',
    },
  }

  const currentColor = colorMap[color] || colorMap.primary

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      whileHover={{ y: -5, boxShadow: 'var(--color-cardHoverShadow)' }}
      onClick={onClick}
      style={{
        background: 'var(--color-cardBg)',
        border: '1px solid var(--color-cardBorder)',
        borderRadius: '12px',
        padding: '20px',
        cursor: onClick ? 'pointer' : 'default',
        boxShadow: 'var(--color-cardShadow)',
        transition: 'all 0.3s ease',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background decoration */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.05, scale: 1 }}
        transition={{ delay: delay + 0.2, duration: 0.5 }}
        style={{
          position: 'absolute',
          right: '-20px',
          top: '-20px',
          width: '120px',
          height: '120px',
          background: currentColor.gradient,
          borderRadius: '50%',
          filter: 'blur(40px)',
        }}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
        <div style={{ flex: 1 }}>
          <p style={{
            margin: 0,
            fontSize: '0.85rem',
            fontWeight: '600',
            color: 'var(--color-textSecondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: '8px',
          }}>
            {title}
          </p>

          <motion.h3
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: delay + 0.3, type: "spring", stiffness: 200 }}
            style={{
              margin: 0,
              fontSize: '2rem',
              fontWeight: '700',
              color: 'var(--color-textPrimary)',
              marginBottom: '8px',
            }}
          >
            {value}
          </motion.h3>

          {subtitle && (
            <p style={{
              margin: 0,
              fontSize: '0.8rem',
              color: 'var(--color-textMuted)',
            }}>
              {subtitle}
            </p>
          )}

          {trend && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: delay + 0.4 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                marginTop: '8px',
                fontSize: '0.85rem',
                color: trend === 'up' ? 'var(--color-success)' : trend === 'down' ? 'var(--color-danger)' : 'var(--color-textSecondary)',
                fontWeight: '600',
              }}
            >
              {trend === 'up' && <FiArrowUp size={14} />}
              {trend === 'down' && <FiArrowDown size={14} />}
              {trend === 'neutral' && <FiTrendingUp size={14} />}
              <span>{trendValue}</span>
            </motion.div>
          )}
        </div>

        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: delay + 0.2, type: "spring", stiffness: 200 }}
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '12px',
            background: currentColor.light,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: currentColor.bg,
          }}
        >
          <Icon size={28} />
        </motion.div>
      </div>
    </motion.div>
  )
}

export default StatCard
