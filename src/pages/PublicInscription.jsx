"use client"

import { Container, Row, Col, Card } from "react-bootstrap"
import { Link } from "react-router-dom"
import MultiStepForm from "../components/Inscription/MultiStepForm"

const PublicInscription = () => {
  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={10} lg={8}>
          <Card className="shadow-lg border-0 rounded-lg">
            <Card.Header className="text-center bg-primary text-white">
              <h3 className="fw-light my-4">Formulaire de Pré-inscription</h3>
            </Card.Header>
            <Card.Body className="p-4 p-md-5" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
              <MultiStepForm />
            </Card.Body>
            <Card.Footer className="text-center py-3">
              <div className="small">
                <Link to="/login">Déjà un compte ? Se connecter</Link>
              </div>
            </Card.Footer>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}

export default PublicInscription
