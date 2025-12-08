/**
 * 📸 AVATAR UPLOAD COMPONENT
 * ==========================
 * Composant pour uploader et modifier l'avatar utilisateur
 */

import { useState, useRef } from "react"
import { Modal, Button, Form, Alert } from "react-bootstrap"
import { motion } from "framer-motion"
import { FiCamera, FiUpload, FiX, FiCheck } from "react-icons/fi"
import UserAvatar from "../UserAvatar"

const AvatarUpload = ({ user, onSave, onClose }) => {
  const [selectedFile, setSelectedFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const fileInputRef = useRef(null)

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Validation
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!validTypes.includes(file.type)) {
      setError("Format d'image non supporté. Utilisez JPG, PNG, GIF ou WebP.")
      return
    }

    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      setError("L'image est trop volumineuse. Taille maximale : 5MB.")
      return
    }

    setError(null)
    setSelectedFile(file)

    // Créer la prévisualisation
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result)
    }
    reader.readAsDataURL(file)
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    try {
      setUploading(true)
      setError(null)

      const formData = new FormData()
      formData.append('avatar', selectedFile)

      // TODO: Implémenter l'appel API pour uploader l'avatar
      // const response = await usersAPI.uploadAvatar(user.id, formData)

      // Simuler l'upload pour le moment
      await new Promise(resolve => setTimeout(resolve, 1500))

      if (onSave) {
        onSave(preview) // Passer l'URL de prévisualisation temporairement
      }

      onClose()
    } catch (err) {
      console.error("Erreur lors de l'upload:", err)
      setError("Erreur lors de l'upload de l'image. Veuillez réessayer.")
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = () => {
    setSelectedFile(null)
    setPreview(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <Modal show={true} onHide={onClose} centered>
      <Modal.Header closeButton style={{
        borderBottom: '1px solid var(--color-border)',
        background: 'var(--color-cardBg)'
      }}>
        <Modal.Title style={{ color: 'var(--color-textPrimary)', fontWeight: '700' }}>
          <FiCamera style={{ marginRight: '8px' }} />
          Modifier la photo de profil
        </Modal.Title>
      </Modal.Header>

      <Modal.Body style={{ background: 'var(--color-cardBg)', padding: '2rem' }}>
        {error && (
          <Alert variant="danger" style={{
            borderRadius: '12px',
            marginBottom: '1.5rem'
          }}>
            {error}
          </Alert>
        )}

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.5rem'
        }}>
          {/* Avatar Preview */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {preview ? (
              <div style={{ position: 'relative' }}>
                <img
                  src={preview}
                  alt="Preview"
                  style={{
                    width: '150px',
                    height: '150px',
                    borderRadius: '12px',
                    objectFit: 'cover',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                    border: '3px solid var(--color-primary)'
                  }}
                />
                <button
                  onClick={handleRemove}
                  style={{
                    position: 'absolute',
                    top: '-10px',
                    right: '-10px',
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'var(--color-danger)',
                    color: 'white',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
                  }}
                >
                  <FiX size={18} />
                </button>
              </div>
            ) : (
              <UserAvatar user={user} size="xxl" />
            )}
          </motion.div>

          {/* Upload Button */}
          <div style={{ width: '100%' }}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            <Button
              variant="outline-primary"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '10px',
                fontWeight: '600',
                borderWidth: '2px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <FiUpload size={18} />
              {preview ? 'Choisir une autre image' : 'Choisir une image'}
            </Button>
          </div>

          {/* Info */}
          <div style={{
            padding: '1rem',
            background: 'var(--color-primaryLight)',
            borderRadius: '10px',
            width: '100%'
          }}>
            <p style={{
              fontSize: '0.85rem',
              color: 'var(--color-textSecondary)',
              margin: 0,
              lineHeight: '1.5'
            }}>
              <strong>Format acceptés :</strong> JPG, PNG, GIF, WebP<br />
              <strong>Taille maximale :</strong> 5 MB<br />
              <strong>Dimensions recommandées :</strong> 400x400 pixels
            </p>
          </div>
        </div>
      </Modal.Body>

      <Modal.Footer style={{
        borderTop: '1px solid var(--color-border)',
        background: 'var(--color-cardBg)',
        gap: '8px'
      }}>
        <Button
          variant="outline-secondary"
          onClick={onClose}
          disabled={uploading}
          style={{
            padding: '10px 20px',
            borderRadius: '10px',
            fontWeight: '600'
          }}
        >
          Annuler
        </Button>
        <Button
          variant="primary"
          onClick={handleUpload}
          disabled={!selectedFile || uploading}
          style={{
            padding: '10px 24px',
            borderRadius: '10px',
            fontWeight: '600',
            background: 'var(--color-gradientPrimary)',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          {uploading ? (
            <>
              <span className="spinner-border spinner-border-sm" />
              Upload en cours...
            </>
          ) : (
            <>
              <FiCheck size={18} />
              Enregistrer
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

export default AvatarUpload
