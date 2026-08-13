/**
 * 📈 CHART CARD - Carte avec graphique
 * ====================================
 * Composant pour afficher des graphiques dans des cartes
 */

import { motion } from "framer-motion"
import { Line, Bar, Doughnut } from "react-chartjs-2"
import { FiMoreVertical } from "react-icons/fi"
import { useState } from "react"

const ChartCard = ({
  title,
  subtitle,
  chartType = "line",
  data,
  options,
  delay = 0,
  actions,
  height = 250,
}) => {
  const [showActions, setShowActions] = useState(false)

  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: 12,
            family: "'Inter', sans-serif",
          },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        borderRadius: 8,
        titleFont: {
          size: 14,
          weight: '600',
        },
        bodyFont: {
          size: 13,
        },
      },
    },
    scales: chartType !== 'doughnut' ? {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 11,
          },
        },
      },
      y: {
        grid: {
          borderDash: [5, 5],
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          font: {
            size: 11,
          },
        },
      },
    } : undefined,
  }

  const mergedOptions = { ...defaultOptions, ...options }

  const renderChart = () => {
    switch (chartType) {
      case 'bar':
        return <Bar data={data} options={mergedOptions} />
      case 'doughnut':
        return <Doughnut data={data} options={mergedOptions} />
      case 'line':
      default:
        return <Line data={data} options={mergedOptions} />
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      whileHover={{ boxShadow: 'var(--color-cardHoverShadow)' }}
      style={{
        background: 'var(--color-cardBg)',
        border: '1px solid var(--color-cardBorder)',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: 'var(--color-cardShadow)',
        transition: 'all 0.3s ease',
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
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
            {title}
          </h5>
          {subtitle && (
            <p style={{
              margin: 0,
              fontSize: '0.85rem',
              color: 'var(--color-textSecondary)',
            }}>
              {subtitle}
            </p>
          )}
        </div>

        {actions && (
          <div style={{ position: 'relative' }}>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowActions(!showActions)}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '6px',
                color: 'var(--color-textSecondary)',
                transition: 'all 0.2s ease',
              }}
            >
              <FiMoreVertical size={18} />
            </motion.button>
          </div>
        )}
      </div>

      {/* Chart */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: delay + 0.2, duration: 0.5 }}
        style={{ height: `${height}px` }}
      >
        {renderChart()}
      </motion.div>
    </motion.div>
  )
}

export default ChartCard
