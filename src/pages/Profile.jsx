"use client"

import { useState, useEffect } from "react"
import { Container, Spinner, Alert } from "react-bootstrap"
import { useSelector } from "react-redux"
import { useParams } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { usersAPI } from "../services/api"
import { getTeacherStatistics } from "../services/userService"
import UserDetail from "./UserDetail"

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.3 }
  }
}

const Profile = () => {
  const { user: currentUser } = useSelector((state) => state.auth)
  const { id: urlId } = useParams()

  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const userIdToFetch = urlId || currentUser?.id;

  useEffect(() => {
    if (!userIdToFetch) {
      setError("Aucun utilisateur à afficher.");
      setLoading(false);
      return;
    }

    const fetchUser = async () => {
      try {
        setLoading(true)
        const res = await usersAPI.getById(userIdToFetch)
        let userData = res.data

        // Si c'est un enseignant ou assistant, charger les statistiques
        if (userData.role === 'enseignant' || userData.role === 'assistant') {
          try {
            console.log('🔍 Chargement des statistiques pour enseignant/assistant:', userIdToFetch)
            const statsRes = await getTeacherStatistics(userIdToFetch)
            console.log('📊 Réponse brute du backend:', statsRes.data)
            console.log('📚 Cours reçus:', statsRes.data.courses)
            console.log('📈 Stats reçues:', statsRes.data.teacher_stats)

            // Vérifier le premier cours en détail
            if (statsRes.data.courses && statsRes.data.courses.length > 0) {
              console.log('🔍 Premier cours en détail:', statsRes.data.courses[0])
              console.log('👥 Nombre étudiants du premier cours:', statsRes.data.courses[0].students_count)
            }

            userData = {
              ...userData,
              courses: statsRes.data.courses,
              teacher_stats: statsRes.data.teacher_stats
            }

            console.log('✅ userData final avec stats:', userData)
          } catch (statsErr) {
            console.error("❌ Erreur lors du chargement des statistiques:", statsErr)
            console.error("Détails de l'erreur:", statsErr.response?.data)
            // Continue without stats if there's an error
          }
        }

        setUser(userData)
      } catch (err) {
        console.error("Erreur lors de la récupération de l'utilisateur:", err)
        setError("Impossible de charger les informations de l'utilisateur.")
      } finally {
        setLoading(false)
      }
    }
    fetchUser()
  }, [userIdToFetch])

  const handleProfileUpdate = async (formData) => {
    try {
      const updatedUser = await usersAPI.update(userIdToFetch, {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
      })
      setUser(updatedUser.data)
    } catch (err) {
      alert("Erreur lors de la mise à jour du profil.")
    }
  }

  const handlePasswordChange = async (formData) => {
    try {
      await usersAPI.changePassword({
        old_password: formData.currentPassword,
        new_password: formData.newPassword,
      })
    } catch (err) {
      alert("Erreur lors du changement de mot de passe.")
    }
  }

  if (loading) {
    return (
      <Container fluid style={{ padding: '24px', background: 'var(--color-bodyBg)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          style={{ textAlign: 'center' }}
        >
          <Spinner animation="border" style={{ color: 'var(--color-primary)', width: '3rem', height: '3rem' }} />
          <p style={{ marginTop: '16px', color: 'var(--color-textSecondary)', fontWeight: '500' }}>Chargement du profil...</p>
        </motion.div>
      </Container>
    )
  }

  if (error) {
    return (
      <Container fluid style={{ padding: '24px', background: 'var(--color-bodyBg)', minHeight: '100vh' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Alert
            variant="danger"
            style={{
              maxWidth: '600px',
              margin: '40px auto',
              borderRadius: '16px',
              padding: '20px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              border: '1px solid rgba(220, 53, 69, 0.3)'
            }}
          >
            {error}
          </Alert>
        </motion.div>
      </Container>
    )
  }

  if (!user) {
    return (
      <Container fluid style={{ padding: '24px', background: 'var(--color-bodyBg)', minHeight: '100vh' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Alert
            variant="warning"
            style={{
              maxWidth: '600px',
              margin: '40px auto',
              borderRadius: '16px',
              padding: '20px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              border: '1px solid rgba(255, 193, 7, 0.3)'
            }}
          >
            Aucun utilisateur trouvé.
          </Alert>
        </motion.div>
      </Container>
    )
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <UserDetail
        user={user}
        currentUser={currentUser}
        onProfileUpdate={handleProfileUpdate}
        onPasswordChange={handlePasswordChange}
      />
    </motion.div>
  )
}

export default Profile
