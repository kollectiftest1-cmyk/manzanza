"use client"

import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Spinner, Alert, Breadcrumb, ListGroup, Badge } from 'react-bootstrap';
import { useParams, Link } from 'react-router-dom';
import { getFiliereDetail } from '../services/filiereService';
import { motion } from "framer-motion"
import { FiGrid, FiUsers, FiHome, FiBook, FiUserCheck, FiArrowLeft } from "react-icons/fi"

// Animation variants
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    }
}

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
}

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
            <Container fluid style={{ padding: '24px', background: 'var(--color-bodyBg)', minHeight: '100vh' }}>
                <div className="text-center" style={{ paddingTop: '100px' }}>
                    <Spinner animation="border" style={{ color: 'var(--color-primary)' }} />
                </div>
            </Container>
        );
    }

    if (error) {
        return (
            <Container fluid style={{ padding: '24px', background: 'var(--color-bodyBg)', minHeight: '100vh' }}>
                <Alert variant="danger" style={{ background: 'var(--color-cardBg)', border: '1px solid #dc3545', color: 'var(--color-text)', borderRadius: '12px' }}>
                    {error}
                </Alert>
            </Container>
        );
    }

    if (!filiere) {
        return (
            <Container fluid style={{ padding: '24px', background: 'var(--color-bodyBg)', minHeight: '100vh' }}>
                <Alert variant="warning" style={{ background: 'var(--color-cardBg)', border: '1px solid #ffc107', color: 'var(--color-text)', borderRadius: '12px' }}>
                    Filière non trouvée.
                </Alert>
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
                {/* Breadcrumb */}
                <motion.div variants={itemVariants} style={{ marginBottom: '24px' }}>
                    <Breadcrumb style={{ background: 'transparent', padding: '0' }}>
                        <Breadcrumb.Item as={Link} to="/administration" style={{ color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FiArrowLeft />
                            Académique
                        </Breadcrumb.Item>
                        <Breadcrumb.Item as={Link} to={`/sections/${filiere.section}`} style={{ color: 'var(--color-primary)' }}>
                            {filiere.section_nom}
                        </Breadcrumb.Item>
                        <Breadcrumb.Item active style={{ color: 'var(--color-text)' }}>{filiere.nom}</Breadcrumb.Item>
                    </Breadcrumb>
                </motion.div>

                <Row>
                    {/* Info Filiere */}
                    <Col lg={4}>
                        <motion.div variants={itemVariants}>
                            <div style={{
                                background: 'var(--color-cardBg)',
                                borderRadius: '16px',
                                padding: '24px',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                                border: '1px solid var(--color-border)',
                                marginBottom: '24px'
                            }}>
                                <h3 style={{
                                    fontWeight: '700',
                                    marginBottom: '24px',
                                    color: 'var(--color-text)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px'
                                }}>
                                    <FiGrid size={28} style={{ color: 'var(--color-primary)' }} />
                                    {filiere.nom}
                                </h3>

                                <div style={{
                                    marginBottom: '24px',
                                    padding: '16px',
                                    background: 'var(--color-bodyBg)',
                                    borderRadius: '12px',
                                    border: '1px solid var(--color-border)'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-textSecondary)', marginBottom: '8px' }}>
                                        <FiUserCheck size={18} />
                                        <strong>Chef de Filière :</strong>
                                    </div>
                                    <div style={{ color: 'var(--color-text)', fontWeight: '600', paddingLeft: '26px' }}>
                                        {filiere.chef_filiere_name || 'N/A'}
                                    </div>
                                </div>

                                <div style={{
                                    borderTop: '1px solid var(--color-border)',
                                    paddingTop: '20px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '16px'
                                }}>
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '12px',
                                        background: 'var(--color-bodyBg)',
                                        borderRadius: '8px'
                                    }}>
                                        <span style={{ fontWeight: '600', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <FiHome size={18} style={{ color: 'var(--color-primary)' }} />
                                            Auditoires
                                        </span>
                                        <Badge bg="primary" pill style={{ padding: '6px 12px', fontSize: '0.9rem' }}>
                                            {filiere.auditoires.length}
                                        </Badge>
                                    </div>

                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '12px',
                                        background: 'var(--color-bodyBg)',
                                        borderRadius: '8px'
                                    }}>
                                        <span style={{ fontWeight: '600', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <FiUsers size={18} style={{ color: '#10b981' }} />
                                            Étudiants
                                        </span>
                                        <Badge bg="success" pill style={{ padding: '6px 12px', fontSize: '0.9rem' }}>
                                            {filiere.etudiants_count}
                                        </Badge>
                                    </div>

                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '12px',
                                        background: 'var(--color-bodyBg)',
                                        borderRadius: '8px'
                                    }}>
                                        <span style={{ fontWeight: '600', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <FiBook size={18} style={{ color: '#212529' }} />
                                            Enseignants
                                        </span>
                                        <Badge bg="dark" pill style={{ padding: '6px 12px', fontSize: '0.9rem' }}>
                                            {filiere.enseignants_count}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </Col>

                    {/* Auditoires */}
                    <Col lg={8}>
                        <motion.div variants={itemVariants}>
                            <div style={{
                                background: 'var(--color-cardBg)',
                                borderRadius: '16px',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                                border: '1px solid var(--color-border)',
                                overflow: 'hidden'
                            }}>
                                <div style={{
                                    padding: '20px 24px',
                                    borderBottom: '1px solid var(--color-border)',
                                    background: 'var(--color-cardBg)'
                                }}>
                                    <h4 style={{
                                        margin: 0,
                                        fontWeight: '700',
                                        color: 'var(--color-text)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px'
                                    }}>
                                        <FiHome size={24} style={{ color: 'var(--color-primary)' }} />
                                        Auditoires
                                    </h4>
                                </div>

                                <div style={{ padding: '24px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        {filiere.auditoires.map(auditoire => (
                                            <motion.div
                                                key={auditoire.id}
                                                whileHover={{ x: 8 }}
                                                transition={{ duration: 0.2 }}
                                            >
                                                <div style={{
                                                    background: 'var(--color-bodyBg)',
                                                    borderRadius: '12px',
                                                    padding: '20px',
                                                    border: '1px solid var(--color-border)',
                                                    transition: 'all 0.3s ease'
                                                }}>
                                                    <div style={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center',
                                                        marginBottom: '16px',
                                                        flexWrap: 'wrap',
                                                        gap: '12px'
                                                    }}>
                                                        <h5 style={{ margin: 0 }}>
                                                            <Link
                                                                to={`/auditoires/${auditoire.id}`}
                                                                style={{
                                                                    textDecoration: 'none',
                                                                    color: 'var(--color-primary)',
                                                                    fontWeight: '700',
                                                                    fontSize: '1.1rem'
                                                                }}
                                                            >
                                                                {auditoire.nom}
                                                            </Link>
                                                        </h5>
                                                        <Badge bg="secondary" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
                                                            {auditoire.niveau} — {auditoire.vacation_display}
                                                        </Badge>
                                                    </div>

                                                    <div style={{
                                                        display: 'flex',
                                                        gap: '24px',
                                                        color: 'var(--color-textSecondary)',
                                                        fontSize: '0.9rem',
                                                        flexWrap: 'wrap'
                                                    }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                            <FiUsers size={16} />
                                                            <strong>Étudiants :</strong> {auditoire.etudiants_count}
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                            <FiBook size={16} />
                                                            <strong>Cours :</strong> {auditoire.courses.length}
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </Col>
                </Row>
            </motion.div>
        </Container>
    );
};

export default FiliereDetail;
