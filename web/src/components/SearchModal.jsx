/**
 * 🔍 SEARCH MODAL COMPONENT (Ctrl+K)
 * ===================================
 * Modal de recherche style docs.expo.dev
 */

import { useState, useEffect, useRef } from "react"
import { Modal } from "react-bootstrap"
import { motion, AnimatePresence } from "framer-motion"
import { useNavigate } from "react-router-dom"
import {
  FiSearch, FiBook, FiUsers, FiFileText, FiMessageSquare,
  FiDollarSign, FiSettings, FiHelpCircle, FiHome, FiGrid,
  FiCommand
} from "react-icons/fi"

const SearchModal = ({ show, onHide }) => {
  const [query, setQuery] = useState("")
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [results, setResults] = useState([])
  const inputRef = useRef(null)
  const navigate = useNavigate()

  // Définir les pages disponibles pour la recherche
  const searchablePages = [
    { icon: FiHome, title: "Tableau de Bord", path: "/dashboard", keywords: ["dashboard", "accueil", "home"] },
    { icon: FiBook, title: "Mes Cours", path: "/courses", keywords: ["cours", "classes", "enseignement"] },
    { icon: FiGrid, title: "Auditoires", path: "/auditoires", keywords: ["auditoires", "salles", "classes"] },
    { icon: FiFileText, title: "Mes TP/TD", path: "/student/assignments", keywords: ["tp", "td", "devoirs", "travaux"] },
    { icon: FiHelpCircle, title: "Mes Quiz", path: "/student/quizzes", keywords: ["quiz", "test", "examen"] },
    { icon: FiMessageSquare, title: "Chat", path: "/chat", keywords: ["chat", "messages", "discussion"] },
    { icon: FiBook, title: "Bibliothèque", path: "/library", keywords: ["bibliothèque", "livres", "library"] },
    { icon: FiDollarSign, title: "Paiements", path: "/paiements", keywords: ["paiements", "finance", "frais"] },
    { icon: FiUsers, title: "Administration", path: "/administration", keywords: ["admin", "users", "utilisateurs"] },
    { icon: FiSettings, title: "Profil", path: "/profile", keywords: ["profil", "compte", "paramètres"] },
  ]

  // Recherche
  useEffect(() => {
    if (!query.trim()) {
      setResults(searchablePages.slice(0, 5)) // Montrer les 5 premiers par défaut
      setSelectedIndex(0)
      return
    }

    const searchQuery = query.toLowerCase()
    const filtered = searchablePages.filter(page => {
      const matchTitle = page.title.toLowerCase().includes(searchQuery)
      const matchKeywords = page.keywords.some(keyword =>
        keyword.toLowerCase().includes(searchQuery)
      )
      return matchTitle || matchKeywords
    })

    setResults(filtered)
    setSelectedIndex(0)
  }, [query])

  // Focus input quand modal s'ouvre
  useEffect(() => {
    if (show && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [show])

  // Navigation au clavier
  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIndex(prev => Math.max(prev - 1, 0))
    } else if (e.key === "Enter" && results[selectedIndex]) {
      e.preventDefault()
      handleSelect(results[selectedIndex])
    } else if (e.key === "Escape") {
      onHide()
    }
  }

  const handleSelect = (page) => {
    navigate(page.path)
    onHide()
    setQuery("")
  }

  return (
    <Modal
      show={show}
      onHide={onHide}
      centered
      size="lg"
      backdrop="static"
      keyboard={true}
      style={{ zIndex: 2000 }}
    >
      <div
        style={{
          background: 'var(--color-cardBg)',
          borderRadius: '16px',
          overflow: 'hidden',
          border: '1px solid var(--color-border)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
        }}
      >
        {/* Input de recherche */}
        <div
          style={{
            padding: '1.5rem',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}
        >
          <FiSearch size={24} style={{ color: 'var(--color-textSecondary)' }} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Rechercher une page... (Ctrl+K)"
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontSize: '1.25rem',
              color: 'var(--color-textPrimary)',
              fontWeight: '500'
            }}
          />
          <div
            style={{
              display: 'flex',
              gap: '4px',
              padding: '4px 8px',
              background: 'var(--color-bodyBg)',
              borderRadius: '6px',
              fontSize: '0.75rem',
              color: 'var(--color-textSecondary)',
              fontWeight: '600'
            }}
          >
            ESC
          </div>
        </div>

        {/* Résultats */}
        <div
          style={{
            maxHeight: '400px',
            overflowY: 'auto',
            padding: '0.5rem'
          }}
        >
          <AnimatePresence>
            {results.length > 0 ? (
              results.map((page, index) => {
                const Icon = page.icon
                const isSelected = index === selectedIndex

                return (
                  <motion.div
                    key={page.path}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: index * 0.02 }}
                    onClick={() => handleSelect(page)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    style={{
                      padding: '1rem 1.25rem',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      cursor: 'pointer',
                      background: isSelected ? 'var(--color-sidebarHover)' : 'transparent',
                      borderLeft: isSelected ? '3px solid var(--color-primary)' : '3px solid transparent',
                      transition: 'all 0.2s ease',
                      margin: '4px 0'
                    }}
                  >
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '8px',
                        background: isSelected ? 'var(--color-primaryLight)' : 'var(--color-bodyBg)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: isSelected ? 'var(--color-primary)' : 'var(--color-textSecondary)',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <Icon size={20} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontSize: '1rem',
                          fontWeight: '600',
                          color: 'var(--color-textPrimary)',
                          marginBottom: '2px'
                        }}
                      >
                        {page.title}
                      </div>
                      <div
                        style={{
                          fontSize: '0.85rem',
                          color: 'var(--color-textSecondary)'
                        }}
                      >
                        {page.path}
                      </div>
                    </div>
                    {isSelected && (
                      <div
                        style={{
                          padding: '4px 8px',
                          background: 'var(--color-primaryLight)',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          color: 'var(--color-primary)',
                          fontWeight: '600'
                        }}
                      >
                        ↵
                      </div>
                    )}
                  </motion.div>
                )
              })
            ) : (
              <div
                style={{
                  padding: '3rem',
                  textAlign: 'center',
                  color: 'var(--color-textSecondary)'
                }}
              >
                <FiSearch size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                <p style={{ fontSize: '1.1rem', fontWeight: '500', margin: 0 }}>
                  Aucun résultat trouvé
                </p>
                <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
                  Essayez avec d'autres mots-clés
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer avec raccourcis */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid var(--color-border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.85rem',
            color: 'var(--color-textSecondary)',
            background: 'var(--color-bodyBg)'
          }}
        >
          <div style={{ display: 'flex', gap: '1rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <kbd style={{ padding: '2px 6px', background: 'var(--color-cardBg)', borderRadius: '4px', fontSize: '0.75rem', border: '1px solid var(--color-border)' }}>↑</kbd>
              <kbd style={{ padding: '2px 6px', background: 'var(--color-cardBg)', borderRadius: '4px', fontSize: '0.75rem', border: '1px solid var(--color-border)' }}>↓</kbd>
              Naviguer
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <kbd style={{ padding: '2px 6px', background: 'var(--color-cardBg)', borderRadius: '4px', fontSize: '0.75rem', border: '1px solid var(--color-border)' }}>↵</kbd>
              Sélectionner
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <FiCommand size={14} />
            Navigation rapide
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default SearchModal
