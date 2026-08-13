"use client"

import { Form, Row, Col } from 'react-bootstrap'
import countryList from 'react-select-country-list'
import Select from 'react-select'
import { useMemo, useState, useEffect } from 'react'
import PhoneInput from 'react-phone-number-input'
import 'react-phone-number-input/style.css'
import { FiCamera, FiUser } from 'react-icons/fi'

const Step1_PersonalInfo = ({ formData, handleChange, setFormData, files }) => {
  const options = useMemo(() => countryList().getData(), [])
  const [avatarPreview, setAvatarPreview] = useState(null)

  // State local pour gérer les composantes de la date de naissance
  const [birthDate, setBirthDate] = useState({ day: '', month: '', year: '' });

  // Synchroniser le state local si formData.date_naissance change
  useEffect(() => {
    if (formData.date_naissance) {
      const [year, month, day] = formData.date_naissance.split('-');
      setBirthDate({ day, month, year });
    }
  }, [formData.date_naissance]);

  // Gérer le changement de la date et mettre à jour le state parent
  const handleDateChange = (e) => {
    const { name, value } = e.target;
    const newBirthDate = { ...birthDate, [name]: value };
    setBirthDate(newBirthDate);

    if (newBirthDate.year && newBirthDate.month && newBirthDate.day) {
      const formattedDate = `${newBirthDate.year}-${String(newBirthDate.month).padStart(2, '0')}-${String(newBirthDate.day).padStart(2, '0')}`;
      handleChange({ target: { name: 'date_naissance', value: formattedDate } });
    }
  };

  const handleCountryChange = (value) => {
    handleChange({ target: { name: 'nationalite', value: value ? value.label : '' } })
  }

  const handleBirthCountryChange = (value) => {
    handleChange({ target: { name: 'pays_naissance', value: value ? value.label : '' } })
  }
  
  const handlePhoneChange = (value) => {
    setFormData(prev => ({ ...prev, phone: value || '' }))
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      handleChange(e)
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  // Options pour les sélecteurs de date
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);
  const months = [
    { value: '01', label: 'Janvier' }, { value: '02', label: 'Février' },
    { value: '03', label: 'Mars' }, { value: '04', label: 'Avril' },
    { value: '05', label: 'Mai' }, { value: '06', label: 'Juin' },
    { value: '07', 'label': 'Juillet' }, { value: '08', label: 'Août' },
    { value: '09', label: 'Septembre' }, { value: '10', label: 'Octobre' },
    { value: '11', label: 'Novembre' }, { value: '12', label: 'Décembre' }
  ];
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <Row>
      <h5 className="text-muted mb-4">Identité du candidat</h5>

      {/* Avatar Upload */}
      <Col xs={12} className="mb-4">
        <div style={{ textAlign: 'center' }}>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <div style={{
              width: '120px',
              height: '120px',
              borderRadius: '12px',
              border: '3px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: avatarPreview ? `url(${avatarPreview})` : 'var(--color-bodyBg)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              margin: '0 auto',
              cursor: 'pointer',
              overflow: 'hidden'
            }} onClick={() => document.getElementById('avatar-input').click()}>
              {!avatarPreview && (
                <FiUser size={48} style={{ color: 'var(--color-textSecondary)' }} />
              )}
            </div>
            <label
              htmlFor="avatar-input"
              style={{
                position: 'absolute',
                bottom: '0',
                right: '0',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'var(--color-primary)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                border: '3px solid var(--color-cardBg)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
              }}
            >
              <FiCamera size={16} />
            </label>
          </div>
          <input
            id="avatar-input"
            type="file"
            name="avatar"
            accept="image/*"
            onChange={handleAvatarChange}
            style={{ display: 'none' }}
          />
          <p style={{ marginTop: '12px', fontSize: '0.9rem', color: 'var(--color-textSecondary)' }}>
            Photo de profil (optionnel)
          </p>
        </div>
      </Col>

      <Col md={4}><Form.Group className="mb-3"><Form.Label>Nom</Form.Label><Form.Control type="text" name="last_name" value={formData.last_name} onChange={handleChange} required /></Form.Group></Col>
      <Col md={4}><Form.Group className="mb-3"><Form.Label>Post-nom</Form.Label><Form.Control type="text" name="post_nom" value={formData.post_nom} onChange={handleChange} /></Form.Group></Col>
      <Col md={4}><Form.Group className="mb-3"><Form.Label>Prénom</Form.Label><Form.Control type="text" name="first_name" value={formData.first_name} onChange={handleChange} required /></Form.Group></Col>
      
      <Col md={6}><Form.Group className="mb-3"><Form.Label>Lieu de Naissance</Form.Label><Form.Control type="text" name="lieu_naissance" value={formData.lieu_naissance} onChange={handleChange} required /></Form.Group></Col>
      <Col md={6}><Form.Group className="mb-3"><Form.Label>Pays de Naissance</Form.Label><Select options={options} value={options.find(o => o.label === formData.pays_naissance)} onChange={handleBirthCountryChange} isClearable /></Form.Group></Col>
      
      <Col xs={12}><Form.Label>Date de Naissance</Form.Label></Col>
      <Col xs={12}>
        <Row>
          <Col xs={4} md={3}><Form.Group className="mb-3"><Form.Select name="day" value={birthDate.day} onChange={handleDateChange} required><option value="">Jour</option>{days.map(d => <option key={d} value={d}>{d}</option>)}</Form.Select></Form.Group></Col>
          <Col xs={4} md={5}><Form.Group className="mb-3"><Form.Select name="month" value={birthDate.month} onChange={handleDateChange} required><option value="">Mois</option>{months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}</Form.Select></Form.Group></Col>
          <Col xs={4} md={4}><Form.Group className="mb-3"><Form.Select name="year" value={birthDate.year} onChange={handleDateChange} required><option value="">Année</option>{years.map(y => <option key={y} value={y}>{y}</option>)}</Form.Select></Form.Group></Col>
        </Row>
      </Col>

      <Col md={6}><Form.Group className="mb-3"><Form.Label>Sexe</Form.Label><Form.Select name="sexe" value={formData.sexe} onChange={handleChange} required><option value="">Choisir...</option><option value="M">Masculin</option><option value="F">Féminin</option></Form.Select></Form.Group></Col>
      <Col md={6}><Form.Group className="mb-3"><Form.Label>Nationalité</Form.Label><Select options={options} value={options.find(o => o.label === formData.nationalite)} onChange={handleCountryChange} isClearable /></Form.Group></Col>
      <Col md={12}><Form.Group className="mb-3"><Form.Label>Adresse Complète</Form.Label><Form.Control type="text" name="adresse" value={formData.adresse} onChange={handleChange} required /></Form.Group></Col>

      <Col md={6}><Form.Group className="mb-3"><Form.Label>Email</Form.Label><Form.Control type="email" name="email" value={formData.email} onChange={handleChange} required /></Form.Group></Col>
      <Col md={6}><Form.Group className="mb-3"><Form.Label>Téléphone</Form.Label><PhoneInput international defaultCountry="CD" value={formData.phone} onChange={handlePhoneChange} className="form-control" /></Form.Group></Col>

      <hr className="my-4" />
      <h5 className="text-muted mb-4">Informations des Parents</h5>
      <Col md={6}><Form.Group className="mb-3"><Form.Label>Nom complet du Père</Form.Label><Form.Control type="text" name="nom_complet_pere" value={formData.nom_complet_pere} onChange={handleChange} /></Form.Group></Col>
      <Col md={6}>
        <Form.Group className="mb-3">
          <Form.Label>Contact du Père</Form.Label>
          <PhoneInput
            international
            defaultCountry="CD"
            value={formData.contact_pere}
            onChange={(value) => setFormData(prev => ({ ...prev, contact_pere: value || '' }))}
            className="form-control"
          />
        </Form.Group>
      </Col>
      <Col md={6}><Form.Group className="mb-3"><Form.Label>Nom complet de la Mère</Form.Label><Form.Control type="text" name="nom_complet_mere" value={formData.nom_complet_mere} onChange={handleChange} /></Form.Group></Col>
      <Col md={6}>
        <Form.Group className="mb-3">
          <Form.Label>Contact de la Mère</Form.Label>
          <PhoneInput
            international
            defaultCountry="CD"
            value={formData.contact_mere}
            onChange={(value) => setFormData(prev => ({ ...prev, contact_mere: value || '' }))}
            className="form-control"
          />
        </Form.Group>
      </Col>

      <hr className="my-4" />
      <h5 className="text-muted mb-4">Tuteur (si différent des parents)</h5>
      <Col md={4}><Form.Group className="mb-3"><Form.Label>Nom du Tuteur</Form.Label><Form.Control type="text" name="nom_tuteur" value={formData.nom_tuteur} onChange={handleChange} /></Form.Group></Col>
      <Col md={4}><Form.Group className="mb-3"><Form.Label>Post-nom du Tuteur</Form.Label><Form.Control type="text" name="postnom_tuteur" value={formData.postnom_tuteur} onChange={handleChange} /></Form.Group></Col>
      <Col md={4}><Form.Group className="mb-3"><Form.Label>Prénom du Tuteur</Form.Label><Form.Control type="text" name="prenom_tuteur" value={formData.prenom_tuteur} onChange={handleChange} /></Form.Group></Col>
      <Col md={6}>
        <Form.Group className="mb-3">
          <Form.Label>Téléphone Tuteur</Form.Label>
          <PhoneInput
            international
            defaultCountry="CD"
            value={formData.telephone_tuteur}
            onChange={(value) => setFormData(prev => ({ ...prev, telephone_tuteur: value || '' }))}
            className="form-control"
          />
        </Form.Group>
      </Col>
      <Col md={6}>
        <Form.Group className="mb-3">
          <Form.Label>WhatsApp Tuteur</Form.Label>
          <PhoneInput
            international
            defaultCountry="CD"
            value={formData.whatsapp_tuteur}
            onChange={(value) => setFormData(prev => ({ ...prev, whatsapp_tuteur: value || '' }))}
            className="form-control"
          />
        </Form.Group>
      </Col>
      <Col md={6}><Form.Group className="mb-3"><Form.Label>Email Tuteur</Form.Label><Form.Control type="email" name="email_tuteur" value={formData.email_tuteur} onChange={handleChange} /></Form.Group></Col>
      <Col md={6}><Form.Group className="mb-3"><Form.Label>Adresse Tuteur</Form.Label><Form.Control type="text" name="adresse_tuteur" value={formData.adresse_tuteur} onChange={handleChange} /></Form.Group></Col>
    </Row>
  )
}

export default Step1_PersonalInfo
