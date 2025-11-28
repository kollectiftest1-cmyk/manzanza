"use client"

import { useState } from "react"
import { Container, Row, Col, Card, Form, Button, Alert } from "react-bootstrap"
import { useDispatch, useSelector } from "react-redux"
import { useNavigate } from "react-router-dom"
import { login } from "../store/slices/authSlice"

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })

  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { loading, error } = useSelector((state) => state.auth)

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      const result = await dispatch(login({
        email: formData.email,
        password: formData.password
      })).unwrap()

      // Connexion réussie, rediriger vers le dashboard
      navigate("/dashboard")
    } catch (error) {
      // L'erreur est déjà gérée dans le slice
      console.error("Erreur de connexion:", error)
    }
  }

  return (
    <Container className="py-5" style={{ marginTop: "80px" }}>
      <Row className="justify-content-center">
        <Col md={6} lg={5}>
          <Card className="card-custom">
            <Card.Body className="p-5">
              <div className="text-center mb-4">
                <h2 className="fw-bold text-primary mb-2">Connexion Syntax GU</h2>
                <p className="text-muted">Accédez à votre espace universitaire</p>
              </div>

              {error && (
                <Alert variant="danger" className="mb-4">
                  {error}
                </Alert>
              )}

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="votre.email@syntaxgu.ac.cd"
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label>Mot de passe</Form.Label>
                  <Form.Control
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Votre mot de passe"
                    required
                  />
                </Form.Group>

                <Button type="submit" className="btn-primary-custom w-100 mb-3" disabled={loading}>
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Connexion...
                    </>
                  ) : (
                    "Se connecter"
                  )}
                </Button>

                <div className="text-center">
                  <small className="text-muted">
                    Mot de passe oublié ?{" "}
                    <a href="#" className="text-primary">
                      Réinitialiser
                    </a>
                  </small>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}

export default Login
