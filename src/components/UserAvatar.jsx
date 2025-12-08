/**
 * 👤 USER AVATAR COMPONENT
 * ======================
 * Composant réutilisable pour afficher les avatars utilisateurs
 */

import { useState } from "react"
import { motion } from "framer-motion"

const UserAvatar = ({
  user,
  size = "md",
  showStatus = false,
  editable = false,
  onClick = null,
  className = ""
}) => {
  const [imageError, setImageError] = useState(false)

  // Tailles disponibles
  const sizes = {
    xs: { width: '24px', height: '24px', fontSize: '0.7rem' },
    sm: { width: '32px', height: '32px', fontSize: '0.8rem' },
    md: { width: '40px', height: '40px', fontSize: '1rem' },
    lg: { width: '56px', height: '56px', fontSize: '1.4rem' },
    xl: { width: '80px', height: '80px', fontSize: '2rem' },
    xxl: { width: '120px', height: '120px', fontSize: '3rem' }
  }

  const sizeStyle = sizes[size] || sizes.md

  // Obtenir les initiales de l'utilisateur
  const getInitials = () => {
    if (!user?.name) return 'U'
    const names = user.name.split(' ')
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase()
    }
    return user.name.substring(0, 2).toUpperCase()
  }

  // Couleurs de fond basées sur le rôle
  const getRoleColor = () => {
    const roleColors = {
      'iadmin': 'linear-gradient(135deg, #001F54, #00143A)',
      'pdg': 'linear-gradient(135deg, #001F54, #00143A)',
      'directeur_general': 'linear-gradient(135deg, #001F54, #00143A)',
      'sga': 'linear-gradient(135deg, #F4A900, #D4A017)',
      'sgad': 'linear-gradient(135deg, #F4A900, #D4A017)',
      'chef_departement': 'linear-gradient(135deg, #1CC88A, #13855C)',
      'chef_section': 'linear-gradient(135deg, #1CC88A, #13855C)',
      'enseignant': 'linear-gradient(135deg, #36B9CC, #258391)',
      'assistant': 'linear-gradient(135deg, #36B9CC, #258391)',
      'etudiant': 'linear-gradient(135deg, #6F42C1, #5A2D9C)',
      'bibliothecaire': 'linear-gradient(135deg, #E74A3B, #BE2617)',
      'caisse': 'linear-gradient(135deg, #F6C23E, #D4A017)',
      'apparitorat': 'linear-gradient(135deg, #858796, #6C757D)',
      'service_it': 'linear-gradient(135deg, #001F54, #00143A)',
    }
    return roleColors[user?.role] || 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))'
  }

  const avatarStyle = {
    width: sizeStyle.width,
    height: sizeStyle.height,
    borderRadius: size === 'xs' || size === 'sm' ? '6px' : '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: sizeStyle.fontSize,
    fontWeight: '600',
    color: 'white',
    background: getRoleColor(),
    position: 'relative',
    cursor: editable || onClick ? 'pointer' : 'default',
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    flexShrink: 0
  }

  const handleImageError = () => {
    setImageError(true)
  }

  return (
    <motion.div
      className={`user-avatar ${className}`}
      style={avatarStyle}
      whileHover={editable || onClick ? { scale: 1.05 } : {}}
      onClick={onClick}
      title={user?.name || 'Utilisateur'}
    >
      {user?.avatar && !imageError ? (
        <img
          src={user.avatar}
          alt={user.name}
          onError={handleImageError}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
        />
      ) : (
        <span>{getInitials()}</span>
      )}

      {/* Status indicator */}
      {showStatus && (
        <span
          style={{
            position: 'absolute',
            bottom: '2px',
            right: '2px',
            width: size === 'xs' || size === 'sm' ? '8px' : '12px',
            height: size === 'xs' || size === 'sm' ? '8px' : '12px',
            borderRadius: '50%',
            background: user?.isOnline ? '#1CC88A' : '#858796',
            border: '2px solid white',
            boxShadow: '0 0 0 1px rgba(0,0,0,0.1)'
          }}
        />
      )}

      {/* Edit overlay */}
      {editable && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0,
            transition: 'opacity 0.2s ease',
            fontSize: sizeStyle.fontSize
          }}
          className="avatar-edit-overlay"
        >
          <i className="fas fa-camera" style={{ color: 'white' }} />
        </div>
      )}

      <style jsx>{`
        .user-avatar:hover .avatar-edit-overlay {
          opacity: 1;
        }
      `}</style>
    </motion.div>
  )
}

export default UserAvatar
