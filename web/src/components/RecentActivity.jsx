/**
 * 🔔 RECENT ACTIVITY - Activités récentes
 * =======================================
 * Composant pour afficher les activités récentes
 */

import { motion } from "framer-motion"
import { FiUser, FiFileText, FiAward, FiTrendingUp, FiCheckCircle } from "react-icons/fi"

const RecentActivity = ({ activities = [], delay = 0 }) => {
  const getIcon = (type) => {
    const icons = {
      'user': FiUser,
      'file': FiFileText,
      'award': FiAward,
      'trending': FiTrendingUp,
      'check': FiCheckCircle,
    }
    return icons[type] || FiUser
  }

  const getIconColor = (type) => {
    const colors = {
      'user': 'var(--color-primary)',
      'file': 'var(--color-info)',
      'award': 'var(--color-warning)',
      'trending': 'var(--color-success)',
      'check': 'var(--color-success)',
    }
    return colors[type] || 'var(--color-primary)'
  }

  const getIconBg = (type) => {
    const backgrounds = {
      'user': 'var(--color-primaryLight)',
      'file': 'rgba(54, 185, 204, 0.1)',
      'award': 'rgba(246, 194, 62, 0.1)',
      'trending': 'rgba(28, 200, 138, 0.1)',
      'check': 'rgba(28, 200, 138, 0.1)',
    }
    return backgrounds[type] || 'var(--color-primaryLight)'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      style={{
        background: 'var(--color-cardBg)',
        border: '1px solid var(--color-cardBorder)',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: 'var(--color-cardShadow)',
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
      }}>
        <h5 style={{
          margin: 0,
          fontSize: '1.1rem',
          fontWeight: '700',
          color: 'var(--color-textPrimary)',
        }}>
          Activités Récentes
        </h5>
        <a href="/activities" style={{
          fontSize: '0.85rem',
          color: 'var(--color-primary)',
          textDecoration: 'none',
          fontWeight: '600',
        }}>
          Voir tout
        </a>
      </div>

      {/* Activity List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {activities.length === 0 ? (
          <div style={{
            padding: '32px',
            textAlign: 'center',
            color: 'var(--color-textMuted)',
            fontSize: '0.9rem',
          }}>
            Aucune activité récente
          </div>
        ) : (
          activities.map((activity, index) => {
            const Icon = getIcon(activity.type)
            const iconColor = getIconColor(activity.type)
            const iconBg = getIconBg(activity.type)

            return (
              <motion.div
                key={activity.id || index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: delay + (index * 0.1) }}
                style={{
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'flex-start',
                }}
              >
                {/* Icon */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: delay + (index * 0.1) + 0.2, type: 'spring', stiffness: 200 }}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: iconBg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: iconColor,
                    flexShrink: 0,
                  }}
                >
                  <Icon size={18} />
                </motion.div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '8px',
                    marginBottom: '4px',
                  }}>
                    <p style={{
                      margin: 0,
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      color: 'var(--color-textPrimary)',
                      lineHeight: 1.4,
                    }}>
                      {activity.title}
                    </p>
                    <span style={{
                      fontSize: '0.75rem',
                      color: 'var(--color-textMuted)',
                      whiteSpace: 'nowrap',
                    }}>
                      {activity.time}
                    </span>
                  </div>
                  <p style={{
                    margin: 0,
                    fontSize: '0.85rem',
                    color: 'var(--color-textSecondary)',
                    lineHeight: 1.5,
                  }}>
                    {activity.description}
                  </p>
                  {activity.badge && (
                    <span style={{
                      display: 'inline-block',
                      marginTop: '8px',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      background: activity.badgeColor || 'var(--color-primaryLight)',
                      color: activity.badgeTextColor || 'var(--color-primary)',
                    }}>
                      {activity.badge}
                    </span>
                  )}
                </div>
              </motion.div>
            )
          })
        )}
      </div>
    </motion.div>
  )
}

export default RecentActivity
