"use client"

import { useState, useEffect } from 'react'
import { Form, Row, Col } from 'react-bootstrap'
import api from '../../services/api'

const Step2_AcademicChoice = ({ formData, handleChange }) => {
  const [sections, setSections] = useState([])
  const [allFilieres, setAllFilieres] = useState([])
  const [filteredFilieres, setFilteredFilieres] = useState([])
  const [academicYearOptions, setAcademicYearOptions] = useState([])

  const fallbackAcademicYearOptions = () => {
    const now = new Date()
    const start = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1
    const current = `${start}-${start + 1}`
    const next = `${start + 1}-${start + 2}`
    return [
      { value: current, label: `Annee en cours (${current})` },
      { value: next, label: `Annee prochaine (${next})` },
    ]
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sectionsRes, filieresRes, yearsRes] = await Promise.all([
          api.get("/sections/"),
          api.get("/filieres/"),
          api.get("/inscriptions/academic-year-options/").catch(() => ({ data: fallbackAcademicYearOptions() })),
        ])
        setSections(sectionsRes.data.results || sectionsRes.data)
        setAllFilieres(filieresRes.data.results || filieresRes.data)
        const years = yearsRes.data.results || yearsRes.data || []
        setAcademicYearOptions(years)
      } catch (err) {
        console.error("Failed to fetch sections/filieres", err)
      }
    }
    fetchData()
  }, [])

  useEffect(() => {
    if (!formData.academic_year && academicYearOptions.length > 0) {
      handleChange({
        target: {
          name: 'academic_year',
          value: academicYearOptions[0].value,
        },
      })
    }
  }, [academicYearOptions, formData.academic_year, handleChange])

  useEffect(() => {
    if (formData.section) {
      const filtered = allFilieres.filter(f => f.section == formData.section)
      setFilteredFilieres(filtered)
    } else {
      setFilteredFilieres([])
    }
  }, [formData.section, allFilieres])

  return (
    <Row>
      <Col md={12}>
        <Form.Group className="mb-3">
          <Form.Label>Annee academique</Form.Label>
          <Form.Select
            name="academic_year"
            value={formData.academic_year}
            onChange={handleChange}
            required
          >
            <option value="">Choisir une annee academique...</option>
            {academicYearOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label || option.value}
              </option>
            ))}
          </Form.Select>
          <Form.Text className="text-muted">L'auditoire sera cree ou retrouve pour cette annee.</Form.Text>
        </Form.Group>
      </Col>
      <Col md={6}>
        <Form.Group className="mb-3">
          <Form.Label>Faculté</Form.Label>
          <Form.Select name="section" value={formData.section} onChange={handleChange} required>
            <option value="">Choisir une faculté...</option>
            {sections.map(s => <option key={s.id} value={s.id}>{s.nom}</option>)}
          </Form.Select>
          <Form.Text className="text-muted">Sélectionnez d'abord votre faculté</Form.Text>
        </Form.Group>
      </Col>
      <Col md={6}>
        <Form.Group className="mb-3">
          <Form.Label>Filière (Département)</Form.Label>
          <Form.Select
            name="filiere"
            value={formData.filiere}
            onChange={handleChange}
            required
            disabled={!formData.section}
          >
            <option value="">Choisir une filière...</option>
            {filteredFilieres.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
          </Form.Select>
          <Form.Text className="text-muted">
            {!formData.section ? 'Sélectionnez d\'abord une faculté' : `${filteredFilieres.length} filière(s) disponible(s)`}
          </Form.Text>
        </Form.Group>
      </Col>
      <Col md={6}>
        <Form.Group className="mb-3">
          <Form.Label>Niveau d'Étude</Form.Label>
          <Form.Select name="niveau" value={formData.niveau} onChange={handleChange} required>
            <option value="L1">Licence 1</option>
            <option value="L2">Licence 2</option>
            <option value="L3">Licence 3</option>
            <option value="M1">Master 1</option>
            <option value="M2">Master 2</option>
          </Form.Select>
        </Form.Group>
      </Col>
      <Col md={6}>
        <Form.Group className="mb-3">
          <Form.Label>Vacation</Form.Label>
          <Form.Select name="vacation" value={formData.vacation} onChange={handleChange} required>
            <option value="">Choisir...</option>
            <option value="jour">Jour</option>
            <option value="soir">Soir</option>
          </Form.Select>
        </Form.Group>
      </Col>
      <Col md={6}>
        <Form.Group className="mb-3">
          <Form.Label>Points Obtenus au Diplôme d'État (%)</Form.Label>
          <Form.Control type="number" name="points_diplome_etat" value={formData.points_diplome_etat} onChange={handleChange} min="50" max="100" />
        </Form.Group>
      </Col>
    </Row>
  )
}

export default Step2_AcademicChoice
