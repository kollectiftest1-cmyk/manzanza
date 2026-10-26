import { FiBookOpen } from "react-icons/fi"

const COVER_COLORS = ['#0E8C9B', '#1E6F9F', '#6F42C1', '#B8562F', '#2E7D4F', '#8A5A00']
/** Couverture générée quand l'ouvrage n'a pas d'image (aucun service externe). */
export default function BookCover({ book, height }) {
  const c = COVER_COLORS[(book.id || 0) % COVER_COLORS.length]
  return (
    <div style={{ height, background: `linear-gradient(150deg, ${c}, #0A2F38)`, color: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '18px 16px' }}>
      <FiBookOpen size={28} style={{ opacity: 0.85 }} />
      <div>
        <div style={{ fontWeight: 800, fontSize: '1rem', lineHeight: 1.25, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{book.title}</div>
        <div style={{ fontSize: '.78rem', opacity: 0.8, marginTop: 6 }}>{book.author}</div>
      </div>
    </div>
  )
}
