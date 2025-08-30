"use client"

import { useState } from "react"
import { Container, Row, Col, Card, Form, Button, Alert } from "react-bootstrap"
import { useDispatch, useSelector } from "react-redux"
import { useNavigate } from "react-router-dom"
import { loginStart, loginSuccess, loginFailure } from "../store/slices/authSlice"

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    userType: "etudiant",
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
    dispatch(loginStart())

    try {
      // Simulation d'une authentification
      setTimeout(() => {
        const mockUser = {
          id: 1,
          name: formData.userType === "etudiant" ? "Jean Dupont" : "Prof. Martin Dubois",
          email: formData.email,
          role: formData.userType,
          auditoire: formData.userType === "etudiant" ? "1ère Licence Finance" : null,
          avatar: null,
        }

        dispatch(loginSuccess(mockUser))
        navigate("/dashboard")
      }, 1000)
    } catch (error) {
      dispatch(loginFailure("Erreur de connexion"))
    }
  }

  return (
    <Container className="py-5" style={{ marginTop: "80px" }}>
      <Row className="justify-content-center">
        <Col md={6} lg={5}>
          <Card className="card-custom">
            <Card.Body className="p-5">
              <div className="text-center mb-4">
                <h2 className="fw-bold text-primary mb-2">Connexion NKEBI UNIV</h2>
                <p className="text-muted">Accédez à votre espace universitaire</p>
              </div>

              {error && (
                <Alert variant="danger" className="mb-4">
                  {error}
                </Alert>
              )}

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Type d'utilisateur</Form.Label>
                  <Form.Select name="userType" value={formData.userType} onChange={handleChange} required>
                    <option value="etudiant">Étudiant</option>
                    <option value="enseignant">Enseignant</option>
                    <option value="assistant">Assistant</option>
                    <option value="chef_departement">Chef de Département</option>
                    <option value="chef_section">Chef de Section</option>
                    <option value="sga">SGA (Secrétariat Général Académique)</option>
                    <option value="sgad">SGAD (Administration & Finances)</option>
                    <option value="directeur_general">Directeur Général</option>
                    <option value="pdg">PDG/Conseil d'Administration</option>
                    <option value="bibliothecaire">Bibliothécaire</option>
                    <option value="rh">Ressources Humaines</option>
                    <option value="caisse_comptabilite">Caisse/Comptabilité</option>
                    <option value="service_it">Service Informatique</option>
                    <option value="apparitorat">Apparitorat</option>
                    <option value="jury">Jury Mémoire/Défense</option>
                    <option value="iadmin">iAdmin (Super Utilisateur)</option>
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="votre.email@NKEBI UNIV.ac.cd"
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
