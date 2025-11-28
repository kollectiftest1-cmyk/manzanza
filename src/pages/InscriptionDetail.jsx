"use client"

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
    Container, Row, Col, Card, Spinner, Alert, Button, ListGroup, Badge
} from 'react-bootstrap';
import api from '../services/api';
// import 'inscr.css';

const InscriptionDetail = () => {
    const { id } = useParams();
    const [inscription, setInscription] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchInscription = async () => {
            try {
                setLoading(true);
                const res = await api.get(`/inscriptions/${id}/`);
                setInscription(res.data);
            } catch (err) {
                setError("Impossible de charger les détails de l'inscription.");
            } finally {
                setLoading(false);
            }
        };

        fetchInscription();
    }, [id]);

    const renderDetailRow = (label, value) =>
        value ? (
            <ListGroup.Item className="py-3">
                <strong className="text-dark">{label} :</strong>
                <span className="ms-2 text-secondary">{value}</span>
            </ListGroup.Item>
        ) : null;

    const renderDocumentLink = (label, url) =>
        url ? (
            <ListGroup.Item
                as="a"
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="py-3 d-flex justify-content-between align-items-center"
            >
                {label}
                <i className="fas fa-external-link-alt"></i>
            </ListGroup.Item>
        ) : null;

    if (loading) {
        return (
            <div className="text-center py-5">
                <Spinner animation="border" variant="primary" />
            </div>
        );
    }

    if (error) {
        return (
            <Container>
                <Alert variant="danger">{error}</Alert>
            </Container>
        );
    }

    if (!inscription) {
        return (
            <Container>
                <Alert variant="warning">Aucune donnée trouvée pour cette inscription.</Alert>
            </Container>
        );
    }

    return (
        <Container fluid className="px-4 pb-5">
            <Row className="mb-4 align-items-center">
                <Col>
                    <Button
                        as={Link}
                        to="/gestion-inscriptions"
                        variant="outline-primary"
                        className="rounded-pill fw-bold px-4"
                    >
                        <i className="fas fa-arrow-left me-2"></i>
                        Retour
                    </Button>

                    <h2 className="mt-4 fw-bold text-primary">Détails de l'Inscription</h2>
                    <p className="text-muted">
                        Candidature de{" "}
                        <strong className="text-dark">
                            {inscription.first_name} {inscription.last_name}
                        </strong>
                    </p>
                </Col>
            </Row>

            <Row xs={1} md={2} className="g-4">

                {/* Informations personnelles */}
                <Col>
                    <Card className="shadow-lg border-0 rounded-4 overflow-hidden animate__animated animate__fadeInUp">
                        <Card.Header className="bg-primary text-white fw-bold py-3">
                            <i className="fas fa-user me-2"></i>
                            Informations Personnelles
                        </Card.Header>
                        <ListGroup variant="flush">
                            {renderDetailRow("Nom complet", `${inscription.last_name} ${inscription.post_nom || ''} ${inscription.first_name}`)}
                            {renderDetailRow("Email", inscription.email)}
                            {renderDetailRow("Téléphone", inscription.phone)}
                            {renderDetailRow("Sexe", inscription.sexe === 'M' ? 'Masculin' : 'Féminin')}
                            {renderDetailRow("Date de naissance", new Date(inscription.date_naissance).toLocaleDateString())}
                            {renderDetailRow("Lieu de naissance", inscription.lieu_naissance)}
                            {renderDetailRow("Pays de naissance", inscription.pays_naissance)}
                            {renderDetailRow("Nationalité", inscription.nationalite)}
                            {renderDetailRow("Adresse", inscription.adresse)}
                        </ListGroup>
                    </Card>
                </Col>

                {/* Choix académiques */}
                <Col>
                    <Card className="shadow-lg border-0 rounded-4 overflow-hidden animate__animated animate__fadeInUp">
                        <Card.Header className="bg-success text-white fw-bold py-3">
                            <i className="fas fa-graduation-cap me-2"></i>
                            Choix Académiques
                        </Card.Header>
                        <ListGroup variant="flush">
                            {renderDetailRow("Niveau d'étude", inscription.niveau)}
                            {renderDetailRow("Filière", inscription.filiere_name)}
                            {renderDetailRow("Vacation", inscription.vacation)}
                            {renderDetailRow("Points au diplôme d'état", `${inscription.points_diplome_etat || 'N/A'}%`)}
                        </ListGroup>
                    </Card>
                </Col>

                {/* Famille/Tuteur */}
                <Col>
                    <Card className="shadow-lg border-0 rounded-4 overflow-hidden animate__animated animate__fadeInUp">
                        <Card.Header className="bg-warning text-dark fw-bold py-3">
                            <i className="fas fa-users me-2"></i>
                            Famille & Tuteur
                        </Card.Header>
                        <ListGroup variant="flush">
                            {renderDetailRow("Nom du père", inscription.nom_complet_pere)}
                            {renderDetailRow("Contact du père", inscription.contact_pere)}
                            {renderDetailRow("Nom de la mère", inscription.nom_complet_mere)}
                            {renderDetailRow("Contact de la mère", inscription.contact_mere)}

                            <ListGroup.Item className="bg-light fw-bold">
                                <i className="fas fa-user-shield me-2"></i>Informations Tuteur
                            </ListGroup.Item>

                            {renderDetailRow("Nom du tuteur", `${inscription.nom_tuteur || ''} ${inscription.postnom_tuteur || ''} ${inscription.prenom_tuteur || ''}`.trim())}
                            {renderDetailRow("Téléphone du tuteur", inscription.telephone_tuteur)}
                            {renderDetailRow("WhatsApp du tuteur", inscription.whatsapp_tuteur)}
                            {renderDetailRow("Email du tuteur", inscription.email_tuteur)}
                            {renderDetailRow("Adresse du tuteur", inscription.adresse_tuteur)}
                        </ListGroup>
                    </Card>
                </Col>

                {/* Documents */}
                <Col>
                    <Card className="shadow-lg border-0 rounded-4 overflow-hidden animate__animated animate__fadeInUp">
                        <Card.Header className="bg-info text-white fw-bold py-3">
                            <i className="fas fa-folder-open me-2"></i>
                            Documents Fournis
                        </Card.Header>
                        <ListGroup variant="flush">
                            {renderDocumentLink("Carte d'identité", inscription.carte_identite)}
                            {renderDocumentLink("Certificat de naissance", inscription.certificat_naissance)}
                            {renderDocumentLink("Certificat d'étude primaire", inscription.certificat_etude_primaire)}
                            {renderDocumentLink("Bulletin 5ème", inscription.bulletin_5)}
                            {renderDocumentLink("Bulletin 6ème", inscription.bulletin_6)}
                            {renderDocumentLink("Diplôme d'État", inscription.diplome_etat)}
                        </ListGroup>
                    </Card>
                </Col>

            </Row>
        </Container>
    );
};

export default InscriptionDetail;
