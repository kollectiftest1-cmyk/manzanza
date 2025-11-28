"use client"

import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Spinner, Alert, Breadcrumb, ListGroup, Badge } from 'react-bootstrap';
import { useParams, Link } from 'react-router-dom';
import { getFiliereDetail } from '../services/filiereService';

const customCardStyle = {
    border: "none",
    borderRadius: "14px",
    boxShadow: "0 4px 16px rgba(0,0,0,0.08)"
};

const FiliereDetail = () => {
    const { id } = useParams();
    const [filiere, setFiliere] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchFiliere = async () => {
            try {
                setLoading(true);
                const res = await getFiliereDetail(id);
                setFiliere(res.data);
            } catch (err) {
                setError("Impossible de charger les détails de la filière.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchFiliere();
    }, [id]);

    if (loading) {
        return (
            <Container className="py-5 text-center">
                <Spinner animation="border" variant="primary" />
            </Container>
        );
    }

    if (error) {
        return (
            <Container className="py-4">
                <Alert variant="danger">{error}</Alert>
            </Container>
        );
    }

    if (!filiere) {
        return (
            <Container className="py-4">
                <Alert variant="warning">Filière non trouvée.</Alert>
            </Container>
        );
    }

    return (
        <Container fluid className="py-3">
            
            {/* BREADCRUMB */}
            <Breadcrumb className="mb-4 fs-5">
                <Breadcrumb.Item as={Link} to="/administration">Academique</Breadcrumb.Item>
                <Breadcrumb.Item as={Link} to={`/sections/${filiere.section}`}>{filiere.section_nom}</Breadcrumb.Item>
                <Breadcrumb.Item active>{filiere.nom}</Breadcrumb.Item>
            </Breadcrumb>

            <Row>
                {/* INFO FILIERE */}
                <Col md={4}>
                    <Card style={customCardStyle} className="mb-4">
                        <Card.Body>
                            <h3 className="fw-bold mb-3">{filiere.nom}</h3>

                            <div className="mb-2">
                                <strong>Chef de Filière :</strong>
                                <div>{filiere.chef_filiere_name || 'N/A'}</div>
                            </div>

                            <hr />

                            <div className="d-flex justify-content-between mb-2">
                                <span className="fw-semibold">Auditoires</span>
                                <Badge bg="primary" pill>{filiere.auditoires.length}</Badge>
                            </div>

                            <div className="d-flex justify-content-between mb-2">
                                <span className="fw-semibold">Étudiants</span>
                                <Badge bg="success" pill>{filiere.etudiants_count}</Badge>
                            </div>

                            <div className="d-flex justify-content-between mb-2">
                                <span className="fw-semibold">Enseignants</span>
                                <Badge bg="dark" pill>{filiere.enseignants_count}</Badge>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>

                {/* AUDITOIRES */}
                <Col md={8}>
                    <Card style={customCardStyle}>
                        <Card.Header className="fw-bold fs-4 bg-white border-0 pb-0">
                            Auditoires
                        </Card.Header>

                        <ListGroup variant="flush" className="mt-2">
                            {filiere.auditoires.map(auditoire => (
                                <ListGroup.Item
                                    key={auditoire.id}
                                    className="py-3"
                                    style={{ borderBottom: "1px solid #f0f0f0" }}
                                >
                                    <div className="d-flex justify-content-between align-items-center">
                                        <h5 className="mb-0">
                                            <Link
                                                to={`/auditoires/${auditoire.id}`}
                                                style={{ textDecoration: "none" }}
                                                className="text-primary fw-bold"
                                            >
                                                {auditoire.nom}
                                            </Link>
                                        </h5>

                                        <Badge bg="secondary">
                                            {auditoire.niveau} — {auditoire.vacation_display}
                                        </Badge>
                                    </div>

                                    <div className="mt-2 text-muted">
                                        <div><strong>Étudiants : </strong>{auditoire.etudiants_count}</div>
                                        <div><strong>Cours : </strong>{auditoire.courses.length}</div>
                                    </div>
                                </ListGroup.Item>
                            ))}
                        </ListGroup>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default FiliereDetail;
