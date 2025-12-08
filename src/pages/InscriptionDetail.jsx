"use client"

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
    Container, Row, Col, Card, Spinner, Alert, Button, ListGroup, Badge
} from 'react-bootstrap';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiUser, FiMail, FiPhone, FiCalendar, FiMapPin, FiGlobe, FiHome, FiBook, FiUsers, FiFolder, FiExternalLink, FiUserCheck, FiAward } from 'react-icons/fi';
import api from '../services/api';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

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

    const renderDetailRow = (label, value, icon = null) =>
        value ? (
            <ListGroup.Item style={{ 
                padding: '16px', 
                background: 'var(--color-cardBg)', 
                borderBottom: '1px solid var(--color-border)',
                transition: 'background 0.2s ease'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {icon && <span style={{ color: 'var(--color-primary)' }}>{icon}</span>}
                    <div>
                        <strong style={{ color: 'var(--color-text)', fontSize: '14px' }}>{label} :</strong>
                        <span style={{ marginLeft: '8px', color: 'var(--color-textSecondary)', fontSize: '14px' }}>{value}</span>
                    </div>
                </div>
            </ListGroup.Item>
        ) : null;

    const renderDocumentLink = (label, url) =>
        url ? (
            <ListGroup.Item
                as="a"
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ 
                    padding: '16px', 
                    background: 'var(--color-cardBg)', 
                    borderBottom: '1px solid var(--color-border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    textDecoration: 'none',
                    color: 'var(--color-primary)',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--color-bodyBg)';
                    e.currentTarget.style.paddingLeft = '20px';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--color-cardBg)';
                    e.currentTarget.style.paddingLeft = '16px';
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FiFolder size={16} />
                    <span>{label}</span>
                </div>
                <FiExternalLink size={16} />
            </ListGroup.Item>
        ) : null;

    if (loading) {
        return (
            <Container fluid style={{ padding: '24px', background: 'var(--color-bodyBg)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                    <Spinner animation="border" style={{ color: 'var(--color-primary)', width: '3rem', height: '3rem' }} />
                    <p style={{ marginTop: '16px', color: 'var(--color-textSecondary)', fontSize: '16px' }}>Chargement des détails...</p>
                </div>
            </Container>
        );
    }

    if (error) {
        return (
            <Container fluid style={{ padding: '24px', background: 'var(--color-bodyBg)', minHeight: '100vh' }}>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <Alert variant="danger" style={{ maxWidth: '800px', margin: '40px auto', borderRadius: '12px' }}>{error}</Alert>
                </motion.div>
            </Container>
        );
    }

    if (!inscription) {
        return (
            <Container fluid style={{ padding: '24px', background: 'var(--color-bodyBg)', minHeight: '100vh' }}>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <Alert variant="warning" style={{ maxWidth: '800px', margin: '40px auto', borderRadius: '12px' }}>Aucune donnée trouvée pour cette inscription.</Alert>
                </motion.div>
            </Container>
        );
    }

    return (
        <Container fluid style={{ padding: '24px', background: 'var(--color-bodyBg)', minHeight: '100vh' }}>
            <motion.div 
                variants={containerVariants} 
                initial="hidden" 
                animate="visible"
            >
                {/* Header Section */}
                <motion.div variants={itemVariants} style={{ marginBottom: '32px' }}>
                    <Button
                        as={Link}
                        to="/gestion-inscriptions"
                        variant="outline-primary"
                        style={{ 
                            borderRadius: '24px', 
                            padding: '10px 24px',
                            fontWeight: '600',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginBottom: '24px'
                        }}
                    >
                        <FiArrowLeft size={18} />
                        Retour
                    </Button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{
                            width: '56px',
                            height: '56px',
                            borderRadius: '16px',
                            background: 'linear-gradient(135deg, #30cfd0, #330867)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
                        }}>
                            <FiUser size={28} style={{ color: 'white' }} />
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '32px', fontWeight: '700', color: 'var(--color-text)' }}>
                                Détails de l'Inscription
                            </h2>
                            <p style={{ margin: 0, color: 'var(--color-textSecondary)', fontSize: '16px' }}>
                                Candidature de{" "}
                                <strong style={{ color: 'var(--color-primary)' }}>
                                    {inscription.first_name} {inscription.last_name}
                                </strong>
                            </p>
                        </div>
                    </div>
                </motion.div>

                <Row xs={1} md={2} style={{ gap: '24px 0' }}>

                    {/* Informations personnelles */}
                    <Col>
                        <motion.div variants={itemVariants}>
                            <Card style={{ 
                                background: 'var(--color-cardBg)', 
                                border: '1px solid var(--color-border)', 
                                borderRadius: '16px',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                                overflow: 'hidden',
                                height: '100%'
                            }}>
                                <Card.Header style={{ 
                                    background: 'linear-gradient(135deg, var(--color-primary), #667eea)',
                                    color: 'white',
                                    padding: '20px 24px',
                                    borderBottom: 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    fontWeight: '600',
                                    fontSize: '18px'
                                }}>
                                    <FiUser size={20} />
                                    Informations Personnelles
                                </Card.Header>
                                <ListGroup variant="flush">
                                    {renderDetailRow("Nom complet", `${inscription.last_name} ${inscription.post_nom || ''} ${inscription.first_name}`, <FiUser size={16} />)}
                                    {renderDetailRow("Email", inscription.email, <FiMail size={16} />)}
                                    {renderDetailRow("Téléphone", inscription.phone, <FiPhone size={16} />)}
                                    {renderDetailRow("Sexe", inscription.sexe === 'M' ? 'Masculin' : 'Féminin')}
                                    {renderDetailRow("Date de naissance", new Date(inscription.date_naissance).toLocaleDateString(), <FiCalendar size={16} />)}
                                    {renderDetailRow("Lieu de naissance", inscription.lieu_naissance, <FiMapPin size={16} />)}
                                    {renderDetailRow("Pays de naissance", inscription.pays_naissance, <FiGlobe size={16} />)}
                                    {renderDetailRow("Nationalité", inscription.nationalite, <FiGlobe size={16} />)}
                                    {renderDetailRow("Adresse", inscription.adresse, <FiHome size={16} />)}
                                </ListGroup>
                            </Card>
                        </motion.div>
                    </Col>

                    {/* Choix académiques */}
                    <Col>
                        <motion.div variants={itemVariants}>
                            <Card style={{ 
                                background: 'var(--color-cardBg)', 
                                border: '1px solid var(--color-border)', 
                                borderRadius: '16px',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                                overflow: 'hidden',
                                height: '100%'
                            }}>
                                <Card.Header style={{ 
                                    background: 'linear-gradient(135deg, #11998e, #38ef7d)',
                                    color: 'white',
                                    padding: '20px 24px',
                                    borderBottom: 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    fontWeight: '600',
                                    fontSize: '18px'
                                }}>
                                    <FiBook size={20} />
                                    Choix Académiques
                                </Card.Header>
                                <ListGroup variant="flush">
                                    {renderDetailRow("Niveau d'étude", inscription.niveau, <FiBook size={16} />)}
                                    {renderDetailRow("Filière", inscription.filiere_name, <FiBook size={16} />)}
                                    {renderDetailRow("Vacation", inscription.vacation)}
                                    {renderDetailRow("Points au diplôme d'état", `${inscription.points_diplome_etat || 'N/A'}%`, <FiAward size={16} />)}
                                </ListGroup>
                            </Card>
                        </motion.div>
                    </Col>

                    {/* Famille/Tuteur */}
                    <Col>
                        <motion.div variants={itemVariants}>
                            <Card style={{ 
                                background: 'var(--color-cardBg)', 
                                border: '1px solid var(--color-border)', 
                                borderRadius: '16px',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                                overflow: 'hidden',
                                height: '100%'
                            }}>
                                <Card.Header style={{ 
                                    background: 'linear-gradient(135deg, #f093fb, #f5576c)',
                                    color: 'white',
                                    padding: '20px 24px',
                                    borderBottom: 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    fontWeight: '600',
                                    fontSize: '18px'
                                }}>
                                    <FiUsers size={20} />
                                    Famille & Tuteur
                                </Card.Header>
                                <ListGroup variant="flush">
                                    {renderDetailRow("Nom du père", inscription.nom_complet_pere, <FiUser size={16} />)}
                                    {renderDetailRow("Contact du père", inscription.contact_pere, <FiPhone size={16} />)}
                                    {renderDetailRow("Nom de la mère", inscription.nom_complet_mere, <FiUser size={16} />)}
                                    {renderDetailRow("Contact de la mère", inscription.contact_mere, <FiPhone size={16} />)}

                                    <ListGroup.Item style={{ 
                                        background: 'var(--color-bodyBg)', 
                                        padding: '12px 16px',
                                        fontWeight: '600',
                                        color: 'var(--color-text)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        borderBottom: '1px solid var(--color-border)'
                                    }}>
                                        <FiUserCheck size={16} style={{ color: 'var(--color-primary)' }} />
                                        Informations Tuteur
                                    </ListGroup.Item>

                                    {renderDetailRow("Nom du tuteur", `${inscription.nom_tuteur || ''} ${inscription.postnom_tuteur || ''} ${inscription.prenom_tuteur || ''}`.trim(), <FiUser size={16} />)}
                                    {renderDetailRow("Téléphone du tuteur", inscription.telephone_tuteur, <FiPhone size={16} />)}
                                    {renderDetailRow("WhatsApp du tuteur", inscription.whatsapp_tuteur, <FiPhone size={16} />)}
                                    {renderDetailRow("Email du tuteur", inscription.email_tuteur, <FiMail size={16} />)}
                                    {renderDetailRow("Adresse du tuteur", inscription.adresse_tuteur, <FiHome size={16} />)}
                                </ListGroup>
                            </Card>
                        </motion.div>
                    </Col>

                    {/* Documents */}
                    <Col>
                        <motion.div variants={itemVariants}>
                            <Card style={{ 
                                background: 'var(--color-cardBg)', 
                                border: '1px solid var(--color-border)', 
                                borderRadius: '16px',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                                overflow: 'hidden',
                                height: '100%'
                            }}>
                                <Card.Header style={{ 
                                    background: 'linear-gradient(135deg, #4facfe, #00f2fe)',
                                    color: 'white',
                                    padding: '20px 24px',
                                    borderBottom: 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    fontWeight: '600',
                                    fontSize: '18px'
                                }}>
                                    <FiFolder size={20} />
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
                        </motion.div>
                    </Col>

                </Row>
            </motion.div>
        </Container>
    );
};

export default InscriptionDetail;
