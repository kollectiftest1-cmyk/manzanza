"use client"

import { useState } from 'react'
import { Button, Alert, Spinner } from 'react-bootstrap'
import Step1_PersonalInfo from './Step1_PersonalInfo'
import Step2_AcademicChoice from './Step2_AcademicChoice'
import Step3_Documents from './Step3_Documents'
import StepIndicator from './StepIndicator'
import api from '../../services/api'
import { useNavigate } from 'react-router-dom'

const steps = [
  { title: 'Infos Personnelles', component: Step1_PersonalInfo },
  { title: 'Choix Académiques', component: Step2_AcademicChoice },
  { title: 'Documents', component: Step3_Documents },
]

const MultiStepForm = () => {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState({
    // Step 1
    first_name: "",
    last_name: "",
    post_nom: "",
    email: "",
    phone: "",
    sexe: "",
    date_naissance: "",
    lieu_naissance: "",
    pays_naissance: "",
    nationalite: "",
    adresse: "",
    nom_complet_pere: "",
    contact_pere: "",
    nom_complet_mere: "",
    contact_mere: "",
    nom_tuteur: "",
    postnom_tuteur: "",
    prenom_tuteur: "",
    telephone_tuteur: "",
    whatsapp_tuteur: "",
    email_tuteur: "",
    adresse_tuteur: "",
    // Step 2
    section: "",
    filiere: "",
    niveau: "L1",
    vacation: "",
    academic_year: "",
    points_diplome_etat: "",
  })
  const [files, setFiles] = useState({
    avatar: null,
    carte_identite: null,
    certificat_naissance: null,
    certificat_etude_primaire: null,
    bulletin_5: null,
    bulletin_6: null,
    diplome_etat: null,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const handleNext = () => setCurrentStep(prev => Math.min(prev + 1, steps.length - 1))
  const handlePrev = () => setCurrentStep(prev => Math.max(prev - 1, 0))

  const handleChange = (e) => {
    const { name, value, type, files: inputFiles } = e.target
    if (type === 'file') {
      setFiles(prev => ({ ...prev, [name]: inputFiles[0] }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)
    
    const submissionData = new FormData()
    // Append formData, ensuring no null/undefined values are sent
    Object.keys(formData).forEach(key => {
      if (formData[key]) {
        submissionData.append(key, formData[key])
      }
    })
    // Append files
    Object.keys(files).forEach(key => {
      if (files[key]) {
        submissionData.append(key, files[key])
      }
    })

    try {
      await api.post("/inscriptions/", submissionData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setSuccess(true)
      setTimeout(() => navigate('/login'), 5000)
    } catch (err) {
      const errorData = err.response?.data
      let errorMsg = "Une erreur est survenue. Veuillez vérifier tous les champs et réessayer."
      if (typeof errorData === 'object' && errorData !== null) {
        const firstErrorKey = Object.keys(errorData)[0]
        const errorMessage = Array.isArray(errorData[firstErrorKey]) ? errorData[firstErrorKey][0] : errorData[firstErrorKey]
        errorMsg = `${firstErrorKey}: ${errorMessage}`
      }
      setError(errorMsg)
      // Find which step has the error
      const errorField = Object.keys(errorData)[0]
      const stepIndex = steps.findIndex(step => {
        const tempFormData = { ...formData, ...files }
        const stepFields = Object.keys(tempFormData).filter(key => {
          // A bit of a hack: we need to know which field belongs to which step.
          // This assumes we can guess it from the component name or props.
          // For now, just go back to the first step.
          return true;
        })
        return stepFields.includes(errorField)
      })
      setCurrentStep(stepIndex !== -1 ? stepIndex : 0)
    } finally {
      setLoading(false)
    }
  }

  const CurrentStepComponent = steps[currentStep].component

  if (success) {
    return (
      <Alert variant="success" style={{
        borderRadius: '12px',
        border: '2px solid #28a745',
        padding: '24px'
      }}>
        <Alert.Heading style={{ fontSize: '24px', fontWeight: '600' }}>
          ✓ Demande envoyée avec succès !
        </Alert.Heading>
        <p style={{ fontSize: '16px', marginTop: '16px' }}>
          Votre demande a été enregistrée. Vous recevrez un e-mail de confirmation une fois qu'elle aura été validée par l'administration.
        </p>
        <hr />
        <p className="mb-0" style={{ fontStyle: 'italic' }}>
          Vous allez être redirigé vers la page de connexion dans quelques instants...
        </p>
      </Alert>
    )
  }

  return (
    <div style={{ position: 'relative', minHeight: '500px' }}>
      {/* Step Indicator */}
      <StepIndicator steps={steps} currentStep={currentStep} />

      {/* Error Alert */}
      {error && (
        <Alert
          variant="danger"
          onClose={() => setError(null)}
          dismissible
          style={{
            borderRadius: '8px',
            marginTop: '100px',
            marginBottom: '20px'
          }}
        >
          {error}
        </Alert>
      )}

      {/* Form Content */}
      <div style={{ marginTop: error ? '20px' : '100px' }}>
        <CurrentStepComponent
          formData={formData}
          files={files}
          handleChange={handleChange}
          setFormData={setFormData}
        />
      </div>

      {/* Navigation Buttons */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: '32px',
        paddingTop: '24px',
        borderTop: '1px solid var(--color-border)',
        gap: '12px',
        flexWrap: 'wrap'
      }}>
        <Button
          variant="secondary"
          onClick={handlePrev}
          disabled={currentStep === 0 || loading}
          style={{
            minWidth: '140px',
            padding: '12px 24px',
            borderRadius: '8px',
            fontWeight: '500'
          }}
        >
          ← Précédent
        </Button>
        {currentStep < steps.length - 1 ? (
          <Button
            variant="primary"
            onClick={handleNext}
            disabled={loading}
            style={{
              minWidth: '140px',
              padding: '12px 24px',
              borderRadius: '8px',
              fontWeight: '500',
              background: 'linear-gradient(135deg, var(--color-primary), #667eea)',
              border: 'none'
            }}
          >
            Suivant →
          </Button>
        ) : (
          <Button
            variant="success"
            onClick={handleSubmit}
            disabled={loading}
            style={{
              minWidth: '180px',
              padding: '12px 32px',
              borderRadius: '8px',
              fontWeight: '600',
              fontSize: '16px'
            }}
          >
            {loading ? (
              <>
                <Spinner as="span" animation="border" size="sm" style={{ marginRight: '8px' }} />
                Envoi en cours...
              </>
            ) : (
              "✓ Soumettre ma demande"
            )}
          </Button>
        )}
      </div>
    </div>
  )
}

export default MultiStepForm
