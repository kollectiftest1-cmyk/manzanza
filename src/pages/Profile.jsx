"use client"

import { useState, useEffect } from "react"
import { Container, Spinner, Alert } from "react-bootstrap"
import { useSelector } from "react-redux"
import { useParams } from "react-router-dom"
import { usersAPI } from "../services/api"
import UserDetail from "./UserDetail"

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
        setUser(res.data)
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

  if (loading) return <Container className="text-center mt-5"><Spinner animation="border" /></Container>
  if (error) return <Container className="mt-5"><Alert variant="danger">{error}</Alert></Container>
  if (!user) return <Container className="mt-5"><Alert variant="warning">Aucun utilisateur trouvé.</Alert></Container>

  return (
    <UserDetail 
      user={user} 
      currentUser={currentUser}
      onProfileUpdate={handleProfileUpdate}
      onPasswordChange={handlePasswordChange}
    />
  )
}

export default Profile
