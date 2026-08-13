"use client"

import { Form, Row, Col } from 'react-bootstrap'

const Step3_Documents = ({ files, handleChange }) => {
  const renderFileInput = (name, label) => (
    <Form.Group className="mb-3">
      <Form.Label>{label}</Form.Label>
      <Form.Control type="file" name={name} onChange={handleChange} required />
      {files[name] && <small className="text-muted d-block mt-1">{files[name].name}</small>}
    </Form.Group>
  )

  return (
    <Row>
      <p className="text-muted">Veuillez fournir des copies scannées de bonne qualité des documents suivants.</p>
      <Col md={6}>{renderFileInput("carte_identite", "Carte d'identité valide")}</Col>
      <Col md={6}>{renderFileInput("certificat_naissance", "Certificat de Naissance")}</Col>
      <Col md={6}>{renderFileInput("certificat_etude_primaire", "Certificat d'étude primaire")}</Col>
      <Col md={6}>{renderFileInput("bulletin_5", "Bulletin 5ème Humanités")}</Col>
      <Col md={6}>{renderFileInput("bulletin_6", "Bulletin 6ème Humanités")}</Col>
      <Col md={6}>{renderFileInput("diplome_etat", "Diplôme d'État ou Équivalent")}</Col>
    </Row>
  )
}

export default Step3_Documents
