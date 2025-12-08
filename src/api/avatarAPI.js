/**
 * 📸 AVATAR API
 * =============
 * API pour la gestion des avatars utilisateurs
 */

import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

// Configuration axios avec token
const getAuthConfig = () => {
  const token = localStorage.getItem('access_token')
  return {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'multipart/form-data'
    }
  }
}

/**
 * Upload avatar pour un utilisateur
 * @param {number} userId - ID de l'utilisateur
 * @param {File} file - Fichier image
 * @returns {Promise} - Réponse avec l'URL de l'avatar
 */
export const uploadAvatar = async (userId, file) => {
  try {
    const formData = new FormData()
    formData.append('avatar', file)

    const response = await axios.post(
      `${API_URL}/users/${userId}/avatar/`,
      formData,
      getAuthConfig()
    )

    return response.data
  } catch (error) {
    console.error('Erreur upload avatar:', error)
    throw error
  }
}

/**
 * Supprimer l'avatar d'un utilisateur
 * @param {number} userId - ID de l'utilisateur
 * @returns {Promise}
 */
export const deleteAvatar = async (userId) => {
  try {
    const token = localStorage.getItem('access_token')
    const response = await axios.delete(
      `${API_URL}/users/${userId}/avatar/`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    )

    return response.data
  } catch (error) {
    console.error('Erreur suppression avatar:', error)
    throw error
  }
}

/**
 * Récupérer l'URL de l'avatar d'un utilisateur
 * @param {number} userId - ID de l'utilisateur
 * @returns {Promise} - URL de l'avatar
 */
export const getAvatarUrl = async (userId) => {
  try {
    const token = localStorage.getItem('access_token')
    const response = await axios.get(
      `${API_URL}/users/${userId}/avatar/`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    )
    return response.data.avatar_url
  } catch (error) {
    console.error('Erreur récupération avatar:', error)
    return null
  }
}

/**
 * Upload avatar lors de l'inscription publique
 * @param {File} file - Fichier image
 * @returns {Promise} - Réponse temporaire (sera associé après création compte)
 */
export const uploadTempAvatar = async (file) => {
  try {
    const formData = new FormData()
    formData.append('avatar', file)

    const response = await axios.post(
      `${API_URL}/upload-temp-avatar/`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    )

    return response.data
  } catch (error) {
    console.error('Erreur upload avatar temporaire:', error)
    throw error
  }
}

export default {
  uploadAvatar,
  deleteAvatar,
  getAvatarUrl,
  uploadTempAvatar
}
