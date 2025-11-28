"use client"

import { useState, useEffect } from "react"
import { Container, Row, Col, Card, Table, Button, Badge, Alert, Spinner, Tab, Tabs } from "react-bootstrap"
import { Link } from "react-router-dom" // Import Link
import api from "../services/api"

const GestionInscriptions = () => {
  const [inscriptions, setInscriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('en_attente')

  const fetchInscriptions = async () => {
    try {
      setLoading(true)
      const res = await api.get("/inscriptions/")
      setInscriptions(res.data.results || res.data)
    } catch (err) {
      setError("Impossible de charger les demandes d'inscription.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInscriptions()
  }, [])

  const handleAction = async (id, action) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir ${action} cette inscription ?`)) return

    try {
      await api.post(`/inscriptions/${id}/${action}/`)
      fetchInscriptions()
    } catch (err) {
      alert(`Erreur lors de l'action : ${err.response?.data?.error || 'Veuillez réessayer.'}`)
    }
  }

  const filteredInscriptions = inscriptions.filter(i => i.status === activeTab)

  const renderTable = () => (
    <Table responsive hover>
      <thead>
        <tr>
          <th>Nom Complet</th>
          <th>Email</th>
          <th>Filière</th>
          <th>Date de la demande</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {filteredInscriptions.length > 0 ? (
          filteredInscriptions.map((item) => (
            <tr key={item.id}>
              <td>{item.first_name} {item.last_name}</td>
              <td>{item.email}</td>
              <td>{item.filiere_name}</td>
              <td>{new Date(item.created_at).toLocaleDateString()}</td>
              <td>
                <Link to={`/gestion-inscriptions/${item.id}`} className="btn btn-info btn-sm me-2">
                  <i className="fas fa-eye me-1"></i> Voir
                </Link>
                {activeTab === 'en_attente' && (
                  <>
                    <Button variant="success" size="sm" className="me-2" onClick={() => handleAction(item.id, 'validate')}>
                      <i className="fas fa-check me-1"></i> Valider
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => handleAction(item.id, 'reject')}>
                      <i className="fas fa-times me-1"></i> Rejeter
                    </Button>
                  </>
                )}
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={5} className="text-center">
              Aucune inscription dans cette catégorie.
            </td>
          </tr>
        )}
      </tbody>
    </Table>
  )

  return (
    <Container fluid>
      <Row className="mb-4">
        <Col>
          <h2 className="text-primary">Gestion des Inscriptions</h2>
          <p className="text-muted">Consultez, validez ou rejetez les nouvelles demandes d'inscription.</p>
        </Col>
      </Row>

      {error && <Alert variant="danger">{error}</Alert>}

      <Card className="shadow-sm">
        <Card.Body>
          <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-3">
            <Tab eventKey="en_attente" title={<><Badge bg="warning" className="me-2">{inscriptions.filter(i => i.status === 'en_attente').length}</Badge>En attente</>}>
              {loading ? <div className="text-center"><Spinner animation="border" /></div> : renderTable()}
            </Tab>
            <Tab eventKey="validee" title={<><Badge bg="success" className="me-2">{inscriptions.filter(i => i.status === 'validee').length}</Badge>Validées</>}>
              {loading ? <div className="text-center"><Spinner animation="border" /></div> : renderTable()}
            </Tab>
            <Tab eventKey="rejetee" title={<><Badge bg="danger" className="me-2">{inscriptions.filter(i => i.status === 'rejetee').length}</Badge>Rejetées</>}>
              {loading ? <div className="text-center"><Spinner animation="border" /></div> : renderTable()}
            </Tab>
          </Tabs>
        </Card.Body>
      </Card>
    </Container>
  )
}

export default GestionInscriptions
