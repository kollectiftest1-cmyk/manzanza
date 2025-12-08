/**
 * 📅 CALENDAR WIDGET - Widget de calendrier
 * =========================================
 * Composant calendrier inspiré du design Acadex
 */

import { useState } from "react"
import { motion } from "framer-motion"
import { FiChevronLeft, FiChevronRight, FiPlus } from "react-icons/fi"

const CalendarWidget = ({ events = [], onAddEvent, delay = 0 }) => {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay()

  const monthNames = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"]

  const dayNames = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"]

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }

  const isToday = (day) => {
    const today = new Date()
    return day === today.getDate() &&
           currentDate.getMonth() === today.getMonth() &&
           currentDate.getFullYear() === today.getFullYear()
  }

  const isSelected = (day) => {
    return day === selectedDate.getDate() &&
           currentDate.getMonth() === selectedDate.getMonth() &&
           currentDate.getFullYear() === selectedDate.getFullYear()
  }

  const hasEvent = (day) => {
    return events.some(event => {
      const eventDate = new Date(event.date)
      return eventDate.getDate() === day &&
             eventDate.getMonth() === currentDate.getMonth() &&
             eventDate.getFullYear() === currentDate.getFullYear()
    })
  }

  const renderCalendarDays = () => {
    const days = []

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} style={{ padding: '8px' }} />)
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const isCurrentDay = isToday(day)
      const isDaySelected = isSelected(day)
      const dayHasEvent = hasEvent(day)

      days.push(
        <motion.div
          key={day}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))}
          style={{
            padding: '8px',
            textAlign: 'center',
            cursor: 'pointer',
            borderRadius: '8px',
            fontSize: '0.85rem',
            fontWeight: isCurrentDay || isDaySelected ? '700' : '500',
            color: isDaySelected ? 'white' : isCurrentDay ? 'var(--color-primary)' : 'var(--color-textPrimary)',
            background: isDaySelected ? 'var(--color-primary)' : isCurrentDay ? 'var(--color-primaryLight)' : 'transparent',
            position: 'relative',
            transition: 'all 0.2s ease',
          }}
        >
          {day}
          {dayHasEvent && (
            <div style={{
              position: 'absolute',
              bottom: '4px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '4px',
              height: '4px',
              borderRadius: '50%',
              background: isDaySelected ? 'white' : 'var(--color-primary)',
            }} />
          )}
        </motion.div>
      )
    }

    return days
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
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h5>

        <div style={{ display: 'flex', gap: '8px' }}>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={previousMonth}
            style={{
              background: 'transparent',
              border: '1px solid var(--color-border)',
              borderRadius: '6px',
              padding: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-textPrimary)',
            }}
          >
            <FiChevronLeft size={16} />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={nextMonth}
            style={{
              background: 'transparent',
              border: '1px solid var(--color-border)',
              borderRadius: '6px',
              padding: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-textPrimary)',
            }}
          >
            <FiChevronRight size={16} />
          </motion.button>
        </div>
      </div>

      {/* Day names */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '4px',
        marginBottom: '8px',
      }}>
        {dayNames.map(day => (
          <div key={day} style={{
            textAlign: 'center',
            fontSize: '0.75rem',
            fontWeight: '600',
            color: 'var(--color-textSecondary)',
            padding: '8px',
          }}>
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '4px',
      }}>
        {renderCalendarDays()}
      </div>
    </motion.div>
  )
}

export default CalendarWidget
