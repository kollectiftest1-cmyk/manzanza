/**
 * 📋 SCHEDULE WIDGET - Widget de planning
 * =======================================
 * Composant pour afficher le planning du jour
 */

import { motion } from "framer-motion"
import { FiClock, FiMapPin, FiUsers, FiPlus } from "react-icons/fi"

import { useHome } from "./dashboards/homeData"

// source="agenda" : prochains événements réels (calendrier académique, délibérations).
const ScheduleWidget = ({ schedule: given = [], source, date, onAddSchedule, delay = 0 }) => {
  const home = useHome()
  const schedule = source === "agenda"
    ? (home?.agenda || []).map((e) => ({
        title: e.title, description: e.description, badge: e.badge,
        time: new Date(e.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }) +
          (e.end && e.end !== e.date ? ` → ${new Date(e.end).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}` : ""),
        color: e.kind === "deliberation" ? "var(--color-warning)" : "var(--color-primary)",
      }))
    : given
  const formatTime = (time) => {
    return new Date(time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
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
        <div>
          <h5 style={{
            margin: 0,
            fontSize: '1.1rem',
            fontWeight: '700',
            color: 'var(--color-textPrimary)',
            marginBottom: '4px',
          }}>
            {source === "agenda" ? "Agenda" : "Planning"}
          </h5>
          <p style={{
            margin: 0,
            fontSize: '0.85rem',
            color: 'var(--color-textSecondary)',
          }}>
            {source === "agenda" ? "Prochaines échéances" : date ? new Date(date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }) : "Aujourd'hui"}
          </p>
        </div>

        {onAddSchedule && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onAddSchedule}
            style={{
              background: 'var(--color-primary)',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: 'white',
              fontSize: '0.85rem',
              fontWeight: '600',
            }}
          >
            <FiPlus size={16} />
          </motion.button>
        )}
      </div>

      {/* Schedule Items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {schedule.length === 0 ? (
          <div style={{
            padding: '32px',
            textAlign: 'center',
            color: 'var(--color-textMuted)',
            fontSize: '0.9rem',
          }}>
            Aucun événement prévu
          </div>
        ) : (
          schedule.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: delay + (index * 0.1) }}
              whileHover={{ x: 4 }}
              style={{
                padding: '16px',
                borderRadius: '10px',
                background: 'var(--color-bodyBg)',
                borderLeft: `4px solid ${item.color || 'var(--color-primary)'}`,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <h6 style={{
                  margin: 0,
                  fontSize: '0.95rem',
                  fontWeight: '700',
                  color: 'var(--color-textPrimary)',
                }}>
                  {item.title}
                </h6>
                <span style={{
                  padding: '4px 8px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  background: item.badgeColor || 'var(--color-primaryLight)',
                  color: item.badgeTextColor || 'var(--color-primary)',
                }}>
                  {item.badge}
                </span>
              </div>

              <p style={{
                margin: '0 0 8px 0',
                fontSize: '0.85rem',
                color: 'var(--color-textSecondary)',
              }}>
                {item.description}
              </p>

              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '12px',
                fontSize: '0.8rem',
                color: 'var(--color-textMuted)',
              }}>
                {item.time && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <FiClock size={14} />
                    <span>{item.time}</span>
                  </div>
                )}
                {item.location && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <FiMapPin size={14} />
                    <span>{item.location}</span>
                  </div>
                )}
                {item.participants && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <FiUsers size={14} />
                    <span>{item.participants}</span>
                  </div>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  )
}

export default ScheduleWidget
