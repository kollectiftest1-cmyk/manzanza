"use client"

import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Spinner, Alert, Breadcrumb, Badge } from 'react-bootstrap';
import { useParams, Link } from 'react-router-dom';
import { getSectionDetail } from '../services/sectionService';

const customCardStyle = {
    border: "none",
    borderRadius: "14px",
    boxShadow: "0 4px 16px rgba(0,0,0,0.08)"
};

const SectionDetail = () => {
    const { id } = useParams();
    const [section, setSection] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchSection = async () => {
            try {
                setLoading(true);
                const res = await getSectionDetail(id);
                setSection(res.data);
            } catch (err) {
                setError("Impossible de charger les détails de la section.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchSection();
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

    if (!section) {
        return (
            <Container className="py-4">
                <Alert variant="warning">Section non trouvée.</Alert>
            </Container>
        );
    }

    return (
        <Container fluid className="py-3">

            {/* BREADCRUMB */}
            <Breadcrumb className="mb-4 fs-5">
                <Breadcrumb.Item as={Link} to="/administration">Administration</Breadcrumb.Item>
                <Breadcrumb.Item active>{section.nom}</Breadcrumb.Item>
            </Breadcrumb>

            <Row>
                {/* INFO SECTION */}
                <Col md={4}>
                    <Card style={customCardStyle} className="mb-4">
                        <Card.Body>
                            <h3 className="fw-bold mb-3">{section.nom}</h3>

                            <div className="mb-2">
                                <strong>Chef de Section :</strong>
                                <div>{section.chef_section_name || 'N/A'}</div>
                            </div>

                            <hr />

                            <div className="d-flex justify-content-between mb-2">
                                <span className="fw-semibold">Filières</span>
                                <Badge bg="primary" pill>{section.filieres.length}</Badge>
                            </div>

                            <div className="d-flex justify-content-between mb-2">
                                <span className="fw-semibold">Auditoires</span>
                                <Badge bg="secondary" pill>{section.auditoires_count}</Badge>
                            </div>

                            <div className="d-flex justify-content-between mb-2">
                                <span className="fw-semibold">Étudiants</span>
                                <Badge bg="success" pill>{section.etudiants_count}</Badge>
                            </div>

                            <div className="d-flex justify-content-between mb-2">
                                <span className="fw-semibold">Enseignants</span>
                                <Badge bg="dark" pill>{section.enseignants_count}</Badge>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>

                {/* FILIERES */}
                <Col md={8}>
                    <Card style={customCardStyle}>
                        <Card.Header className="fw-bold fs-4 bg-white border-0 pb-0">
                            Filières
                        </Card.Header>

                        <Card.Body className="mt-2">
                            {section.filieres.map(filiere => (
                                <Card
                                    key={filiere.id}
                                    className="mb-3 border-0 shadow-sm"
                                    style={{ borderRadius: "12px" }}
                                >
                                    <Card.Body>
                                        <div className="d-flex justify-content-between align-items-center">
                                            <h5 className="mb-0">
                                                <Link
                                                    to={`/filieres/${filiere.id}`}
                                                    style={{ textDecoration: "none" }}
                                                    className="text-primary fw-bold"
                                                >
                                                    {filiere.nom}
                                                </Link>
                                            </h5>
                                            <Badge bg="info" pill>Chef : {filiere.chef_filiere_name || 'N/A'}</Badge>
                                        </div>

                                        <div className="mt-2 text-muted">
                                            <div><strong>Auditoires : </strong>{filiere.auditoires.length}</div>
                                            <div><strong>Étudiants : </strong>{filiere.etudiants_count}</div>
                                            <div><strong>Enseignants : </strong>{filiere.enseignants_count}</div>
                                        </div>
                                    </Card.Body>
                                </Card>
                            ))}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default SectionDetail;
