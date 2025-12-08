"use client"

import { useState, useEffect } from 'react'
import { Form, Row, Col } from 'react-bootstrap'
import api from '../../services/api'

const Step2_AcademicChoice = ({ formData, handleChange }) => {
  const [filieres, setFilieres] = useState([])

  useEffect(() => {
    const fetchFilieres = async () => {
      try {
        const res = await api.get("/filieres/")
        setFilieres(res.data.results || res.data)
      } catch (err) {
        console.error("Failed to fetch filieres", err)
      }
    }
    fetchFilieres()
  }, [])

  return (
    <Row>
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
          <Form.Label>Filière Souhaitée</Form.Label>
          <Form.Select name="filiere" value={formData.filiere} onChange={handleChange} required>
            <option value="">Choisir...</option>
            {filieres.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
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
