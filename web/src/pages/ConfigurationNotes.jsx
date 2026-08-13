/**
 * ConfigurationNotes.jsx — Configuration Académique
 * Onglets : Général (crédits/heures, seuils de notation), Catégories de notes
 */
import { useState, useEffect, useCallback } from 'react'
import {
  Container, Row, Col, Card, Table, Button, Modal, Form,
  Spinner, Alert, Badge, InputGroup, ProgressBar
} from 'react-bootstrap'
import { motion } from 'framer-motion'
import {
  FiSettings, FiPlus, FiEdit, FiTrash2,
  FiCheck, FiRefreshCw, FiAward,
  FiSliders, FiTarget, FiSave,
  FiAlertCircle, FiClock, FiHash
} from 'react-icons/fi'
import { useSelector } from 'react-redux'
import gradeService from '../services/gradeService'

const CATEGORY_TYPES = [
  { value: 'interro', label: 'Interrogation', color: '#f0ad4e', description: 'Interrogation orale/écrite en classe' },
  { value: 'quiz', label: 'Quiz (en ligne)', color: '#17a2b8', description: 'Quiz en ligne via le module quiz' },
  { value: 'tp_td', label: 'TP / TD', color: '#28a745', description: 'Travaux pratiques et dirigés' },
  { value: 'examen', label: 'Examen', color: '#dc3545', description: 'Examen partiel ou final' },
  { value: 'bonus', label: 'Bonus', color: '#6c757d', description: 'Points bonus supplémentaires' },
]

const EMPTY_CATEGORY = {
  name: '',
  category_type: 'examen',
  weight: 0,
  description: '',
}

const ConfigurationAcademique = () => {
  const { user: currentUser } = useSelector((s) => s.auth)

  // ── State ──────────────────────────────────────────────────────────────
  const [activeSection, setActiveSection] = useState('general')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  // Academic Config (Général)
  const [academicConfig, setAcademicConfig] = useState(null)
  const [configForm, setConfigForm] = useState({
    hours_per_credit: 15,
    max_grade: 20,
    passing_grade: 10,
    passing_percentage: 50,
    allow_compensation: false,
    compensation_threshold: 8,
    current_academic_year: '',
    current_semester: 'S1',
    include_retard_in_presence: false,
  })
  const [savingConfig, setSavingConfig] = useState(false)
  const [loadingConfig, setLoadingConfig] = useState(true)

  // Categories
  const [categories, setCategories] = useState([])
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [categoryForm, setCategoryForm] = useState({ ...EMPTY_CATEGORY })
  const [savingCategory, setSavingCategory] = useState(false)
  const [categoryError, setCategoryError] = useState(null)

  // ── Load data ──────────────────────────────────────────────────────────
  const loadAcademicConfig = useCallback(async () => {
    setLoadingConfig(true)
    try {
      const res = await gradeService.getAcademicConfig()
      const data = Array.isArray(res.data) ? res.data[0] : res.data
      if (data) {
        setAcademicConfig(data)
        setConfigForm({
          hours_per_credit: data.hours_per_credit ?? 15,
          max_grade: data.max_grade ?? 20,
          passing_grade: data.passing_grade ?? 10,
          passing_percentage: data.passing_percentage ?? 50,
          allow_compensation: data.allow_compensation ?? false,
          compensation_threshold: data.compensation_threshold ?? 8,
          current_academic_year: data.current_academic_year || '',
          current_semester: data.current_semester || 'S1',
          include_retard_in_presence: data.include_retard_in_presence ?? false,
        })
      }
    } catch (err) {
      console.error('Erreur chargement config académique:', err)
    } finally {
      setLoadingConfig(false)
    }
  }, [])

  const loadCategories = useCallback(async () => {
    try {
      setLoading(true)
      const res = await gradeService.getCategories()
      setCategories(res.data?.results || res.data || [])
    } catch (err) {
      setError('Erreur lors du chargement des catégories.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAcademicConfig()
    loadCategories()
  }, [loadAcademicConfig, loadCategories])

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 4000)
      return () => clearTimeout(timer)
    }
  }, [success])

  // ── Academic Config Save ────────────────────────────────────────────────
  const handleSaveConfig = async () => {
    setSavingConfig(true)
    try {
      await gradeService.updateAcademicConfig(configForm)
      setSuccess('Configuration académique sauvegardée avec succès.')
      loadAcademicConfig()
    } catch (err) {
      const msg = err.response?.data
      if (msg && typeof msg === 'object') {
        const first = Object.values(msg).flat()[0]
        setError(typeof first === 'string' ? first : JSON.stringify(msg))
      } else {
        setError('Erreur lors de la sauvegarde de la configuration.')
      }
    } finally {
      setSavingConfig(false)
    }
  }

  // ── Category CRUD ─────────────────────────────────────────────────────
  const openCreateCategory = () => {
    setEditingCategory(null)
    setCategoryForm({ ...EMPTY_CATEGORY })
    setCategoryError(null)
    setShowCategoryModal(true)
  }

  const openEditCategory = (cat) => {
    setEditingCategory(cat)
    setCategoryForm({
      name: cat.name,
      category_type: cat.category_type,
      weight: cat.weight,
      description: cat.description || '',
    })
    setCategoryError(null)
    setShowCategoryModal(true)
  }

  const handleSaveCategory = async () => {
    setCategoryError(null)
    if (!categoryForm.name) {
      setCategoryError('Le nom est obligatoire.')
      return
    }

    setSavingCategory(true)
    try {
      if (editingCategory) {
        await gradeService.updateCategory(editingCategory.id, categoryForm)
        setSuccess(`Catégorie "${categoryForm.name}" modifiée.`)
      } else {
        await gradeService.createCategory(categoryForm)
        setSuccess(`Catégorie "${categoryForm.name}" créée.`)
      }
      setShowCategoryModal(false)
      loadCategories()
    } catch (err) {
      const msg = err.response?.data
      if (msg && typeof msg === 'object') {
        const first = Object.values(msg).flat()[0]
        setCategoryError(typeof first === 'string' ? first : JSON.stringify(msg))
      } else {
        setCategoryError('Erreur lors de la sauvegarde.')
      }
    } finally {
      setSavingCategory(false)
    }
  }

  const handleDeleteCategory = async (cat) => {
    if (!window.confirm(`Supprimer la catégorie "${cat.name}" ? Les notes liées pourraient être affectées.`)) return
    try {
      await gradeService.deleteCategory(cat.id)
      setSuccess(`Catégorie "${cat.name}" supprimée.`)
      loadCategories()
    } catch (err) {
      setError('Erreur lors de la suppression. Vérifiez qu\'aucune note n\'utilise cette catégorie.')
    }
  }

  // ── Computed ──────────────────────────────────────────────────────────
  const totalCategoryWeight = categories.reduce((sum, c) => sum + parseFloat(c.weight || 0), 0)
  const getCategoryTypeInfo = (type) => CATEGORY_TYPES.find(t => t.value === type) || CATEGORY_TYPES[0]

  return (
    <Container fluid style={{ padding: '24px', background: 'var(--color-bodyBg)', minHeight: '100vh' }}>
      {/* Alerts */}
      {success && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <Alert variant="success" dismissible onClose={() => setSuccess(null)} style={{ borderRadius: '12px', marginBottom: '16px' }}>
            <FiCheck className="me-2" />{success}
          </Alert>
        </motion.div>
      )}
      {error && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <Alert variant="danger" dismissible onClose={() => setError(null)} style={{ borderRadius: '12px', marginBottom: '16px' }}>
            {error}
          </Alert>
        </motion.div>
      )}

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '16px',
              background: 'linear-gradient(135deg, #f093fb, #f5576c)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 16px rgba(240,147,251,0.3)'
            }}>
              <FiSettings size={28} color="white" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '28px', fontWeight: '700', color: 'var(--color-text)' }}>
                Configuration Académique
              </h2>
              <p style={{ margin: 0, color: 'var(--color-textSecondary)' }}>
                Paramètres généraux et catégories de notes
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Navigation Tabs */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          {[
            { id: 'general', label: 'Configuration Générale', icon: FiSettings },
            { id: 'categories', label: 'Catégories de Notes', icon: FiSliders, count: categories.length },
          ].map(tab => (
            <Button key={tab.id}
              variant={activeSection === tab.id ? 'primary' : 'outline-secondary'}
              onClick={() => setActiveSection(tab.id)}
              style={{
                borderRadius: '10px', padding: '10px 20px', fontWeight: '600',
                display: 'flex', alignItems: 'center', gap: '8px',
                ...(activeSection === tab.id ? { background: 'linear-gradient(135deg, #f093fb, #f5576c)', border: 'none' } : {})
              }}>
              <tab.icon size={16} />
              {tab.label}
              {tab.count != null && <Badge bg="light" text="dark" style={{ borderRadius: '20px' }}>{tab.count}</Badge>}
            </Button>
          ))}
        </div>
      </motion.div>

      {/* ═══════════ SECTION: Configuration Générale ═══════════ */}
      {activeSection === 'general' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {loadingConfig ? (
            <div style={{ textAlign: 'center', padding: '60px' }}>
              <Spinner animation="border" style={{ color: 'var(--color-primary)' }} />
            </div>
          ) : (
            <Row className="g-4">
              {/* Crédits & Heures */}
              <Col lg={6}>
                <Card style={cardStyle}>
                  <Card.Header style={cardHeaderStyle}>
                    <h6 style={{ margin: 0, fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FiClock /> Crédits & Heures
                    </h6>
                  </Card.Header>
                  <Card.Body style={{ padding: '24px' }}>
                    <Form.Group className="mb-4">
                      <Form.Label style={labelStyle}>
                        <FiHash className="me-2" />1 Crédit = combien d'heures ?
                      </Form.Label>
                      <InputGroup>
                        <Form.Control
                          type="number" min="1" max="100" step="1"
                          value={configForm.hours_per_credit}
                          onChange={(e) => setConfigForm({ ...configForm, hours_per_credit: parseInt(e.target.value) || 15 })}
                          style={inputStyle}
                        />
                        <InputGroup.Text style={{ background: 'var(--color-bodyBg)', border: '1px solid var(--color-border)', borderRadius: '0 10px 10px 0' }}>
                          heures
                        </InputGroup.Text>
                      </InputGroup>
                      <Form.Text style={{ color: 'var(--color-textSecondary)' }}>
                        Utilisé pour calculer les heures prévues d'un cours (crédits × heures/crédit) et la prestation enseignant.
                      </Form.Text>
                    </Form.Group>

                    <Alert variant="light" style={{ borderRadius: '10px', border: '1px solid var(--color-border)', fontSize: '13px' }}>
                      <strong>Exemple :</strong> Un cours de 5 crédits = <strong>{5 * (configForm.hours_per_credit || 15)} heures</strong> prévues.
                      <br />Un cours de 3 crédits = <strong>{3 * (configForm.hours_per_credit || 15)} heures</strong> prévues.
                    </Alert>

                    <hr style={{ borderColor: 'var(--color-border)' }} />

                    <Form.Group className="mb-3">
                      <Form.Label style={labelStyle}>Année académique en cours</Form.Label>
                      <Form.Control
                        type="text"
                        value={configForm.current_academic_year}
                        onChange={(e) => setConfigForm({ ...configForm, current_academic_year: e.target.value })}
                        placeholder="Ex: 2024-2025"
                        style={inputStyle}
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label style={labelStyle}>Semestre en cours</Form.Label>
                      <Form.Select
                        value={configForm.current_semester}
                        onChange={(e) => setConfigForm({ ...configForm, current_semester: e.target.value })}
                        style={inputStyle}
                      >
                        <option value="S1">Semestre 1</option>
                        <option value="S2">Semestre 2</option>
                      </Form.Select>
                    </Form.Group>
                  </Card.Body>
                </Card>
              </Col>

              {/* Seuils & Notes */}
              <Col lg={6}>
                <Card style={cardStyle}>
                  <Card.Header style={cardHeaderStyle}>
                    <h6 style={{ margin: 0, fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FiTarget /> Seuils & Notation
                    </h6>
                  </Card.Header>
                  <Card.Body style={{ padding: '24px' }}>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label style={labelStyle}>Note maximale</Form.Label>
                          <InputGroup>
                            <Form.Control
                              type="number" min="1" max="100" step="1"
                              value={configForm.max_grade}
                              onChange={(e) => setConfigForm({ ...configForm, max_grade: parseInt(e.target.value) || 20 })}
                              style={inputStyle}
                            />
                            <InputGroup.Text style={{ background: 'var(--color-bodyBg)', border: '1px solid var(--color-border)', borderRadius: '0 10px 10px 0' }}>
                              /{configForm.max_grade || 20}
                            </InputGroup.Text>
                          </InputGroup>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label style={labelStyle}>Note de passage</Form.Label>
                          <InputGroup>
                            <Form.Control
                              type="number" min="0" max={configForm.max_grade} step="0.5"
                              value={configForm.passing_grade}
                              onChange={(e) => setConfigForm({ ...configForm, passing_grade: parseFloat(e.target.value) || 10 })}
                              style={inputStyle}
                            />
                            <InputGroup.Text style={{ background: 'var(--color-bodyBg)', border: '1px solid var(--color-border)', borderRadius: '0 10px 10px 0' }}>
                              /{configForm.max_grade || 20}
                            </InputGroup.Text>
                          </InputGroup>
                        </Form.Group>
                      </Col>
                    </Row>

                    <Form.Group className="mb-3">
                      <Form.Label style={labelStyle}>Pourcentage de réussite</Form.Label>
                      <InputGroup>
                        <Form.Control
                          type="number" min="0" max="100" step="1"
                          value={configForm.passing_percentage}
                          onChange={(e) => setConfigForm({ ...configForm, passing_percentage: parseInt(e.target.value) || 50 })}
                          style={inputStyle}
                        />
                        <InputGroup.Text style={{ background: 'var(--color-bodyBg)', border: '1px solid var(--color-border)', borderRadius: '0 10px 10px 0' }}>%</InputGroup.Text>
                      </InputGroup>
                      <Form.Text style={{ color: 'var(--color-textSecondary)' }}>
                        Seuil de réussite d'un cours en pourcentage de la note maximale.
                      </Form.Text>
                    </Form.Group>

                    <hr style={{ borderColor: 'var(--color-border)' }} />

                    <Form.Group className="mb-3">
                      <Form.Check
                        type="switch"
                        id="allow-compensation"
                        label={<span style={{ fontWeight: '600', fontSize: '14px' }}>Autoriser la compensation entre cours</span>}
                        checked={configForm.allow_compensation}
                        onChange={(e) => setConfigForm({ ...configForm, allow_compensation: e.target.checked })}
                      />
                      <Form.Text style={{ color: 'var(--color-textSecondary)' }}>
                        Permet à un étudiant de valider un semestre si la moyenne générale est suffisante, même avec des cours sous le seuil.
                      </Form.Text>
                    </Form.Group>

                    {configForm.allow_compensation && (
                      <Form.Group className="mb-3">
                        <Form.Label style={labelStyle}>Seuil de compensation</Form.Label>
                        <InputGroup>
                          <Form.Control
                            type="number" min="0" max={configForm.max_grade} step="0.5"
                            value={configForm.compensation_threshold}
                            onChange={(e) => setConfigForm({ ...configForm, compensation_threshold: parseFloat(e.target.value) || 8 })}
                            style={inputStyle}
                          />
                          <InputGroup.Text style={{ background: 'var(--color-bodyBg)', border: '1px solid var(--color-border)', borderRadius: '0 10px 10px 0' }}>
                            /{configForm.max_grade || 20}
                          </InputGroup.Text>
                        </InputGroup>
                        <Form.Text style={{ color: 'var(--color-textSecondary)' }}>
                          Note minimale dans un cours pour pouvoir bénéficier de la compensation.
                        </Form.Text>
                      </Form.Group>
                    )}

                    <Form.Group className="mb-3">
                      <Form.Check
                        type="switch"
                        id="include-retard"
                        label={<span style={{ fontWeight: '600', fontSize: '14px' }}>Compter les retards dans les présences</span>}
                        checked={configForm.include_retard_in_presence}
                        onChange={(e) => setConfigForm({ ...configForm, include_retard_in_presence: e.target.checked })}
                      />
                      <Form.Text style={{ color: 'var(--color-textSecondary)' }}>
                        Si activé, un retard est compté comme présent dans le calcul du taux de présence.
                      </Form.Text>
                    </Form.Group>
                  </Card.Body>
                </Card>
              </Col>

              {/* Save button */}
              <Col xs={12}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                  <Button variant="outline-secondary" onClick={loadAcademicConfig} style={{ borderRadius: '10px', fontWeight: '600' }}>
                    <FiRefreshCw className="me-1" /> Réinitialiser
                  </Button>
                  <Button onClick={handleSaveConfig} disabled={savingConfig}
                    style={{ background: 'linear-gradient(135deg, #f093fb, #f5576c)', border: 'none', borderRadius: '10px', fontWeight: '600', padding: '10px 28px' }}>
                    {savingConfig ? <Spinner size="sm" /> : <><FiSave className="me-1" /> Sauvegarder la configuration</>}
                  </Button>
                </div>
              </Col>

              {/* Info Card */}
              <Col xs={12}>
                <Card style={{ ...cardStyle, background: 'linear-gradient(135deg, rgba(240,147,251,0.05), rgba(245,87,108,0.05))' }}>
                  <Card.Body style={{ padding: '20px' }}>
                    <h6 style={{ fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                      <FiAlertCircle style={{ color: '#f093fb' }} /> Comment sont utilisés ces paramètres ?
                    </h6>
                    <Row>
                      <Col md={4}>
                        <div style={{ fontSize: '13px', marginBottom: '12px' }}>
                          <Badge bg="info" style={{ borderRadius: '6px', marginBottom: '4px' }}>Crédits → Heures</Badge>
                          <p style={{ margin: '4px 0 0', color: 'var(--color-textSecondary)' }}>
                            Un cours de N crédits = N × {configForm.hours_per_credit || 15}h prévues. Sert au calcul de la prestation enseignant (heures prestées vs heures prévues).
                          </p>
                        </div>
                      </Col>
                      <Col md={4}>
                        <div style={{ fontSize: '13px', marginBottom: '12px' }}>
                          <Badge bg="success" style={{ borderRadius: '6px', marginBottom: '4px' }}>Moyennes pondérées</Badge>
                          <p style={{ margin: '4px 0 0', color: 'var(--color-textSecondary)' }}>
                            La moyenne d'un cours est calculée par catégorie (interro, examen, TP...) avec les poids configurés. La moyenne générale est pondérée par les crédits du cours.
                          </p>
                        </div>
                      </Col>
                      <Col md={4}>
                        <div style={{ fontSize: '13px', marginBottom: '12px' }}>
                          <Badge bg="warning" text="dark" style={{ borderRadius: '6px', marginBottom: '4px' }}>Validation crédits</Badge>
                          <p style={{ margin: '4px 0 0', color: 'var(--color-textSecondary)' }}>
                            Un étudiant valide un cours si sa moyenne ≥ {configForm.passing_grade}/{configForm.max_grade} ({configForm.passing_percentage}%).
                            {configForm.allow_compensation && ` Compensation possible si note ≥ ${configForm.compensation_threshold}/${configForm.max_grade}.`}
                          </p>
                        </div>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}
        </motion.div>
      )}

      {/* ═══════════ SECTION: Catégories de Notes ═══════════ */}
      {activeSection === 'categories' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Row className="g-4">
            {/* Category list Card */}
            <Col lg={8}>
              <Card style={cardStyle}>
                <Card.Header style={{ ...cardHeaderStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h6 style={{ margin: 0, fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FiSliders /> Catégories d'évaluation
                  </h6>
                  <Button size="sm" onClick={openCreateCategory}
                    style={{ background: 'linear-gradient(135deg, #f093fb, #f5576c)', border: 'none', borderRadius: '8px', fontWeight: '600' }}>
                    <FiPlus className="me-1" /> Nouvelle catégorie
                  </Button>
                </Card.Header>
                <Card.Body style={{ padding: '0' }}>
                  {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                      <Spinner animation="border" style={{ color: 'var(--color-primary)' }} />
                    </div>
                  ) : categories.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px' }}>
                      <FiSliders size={48} style={{ color: 'var(--color-textSecondary)', opacity: 0.5 }} />
                      <p style={{ color: 'var(--color-textSecondary)', marginTop: '16px' }}>
                        Aucune catégorie de note configurée. Créez-en une pour commencer.
                      </p>
                      <Button size="sm" variant="primary" onClick={openCreateCategory} style={{ borderRadius: '10px' }}>
                        <FiPlus className="me-1" /> Créer la première catégorie
                      </Button>
                    </div>
                  ) : (
                    <Table hover responsive style={{ marginBottom: 0 }}>
                      <thead>
                        <tr style={{ background: 'var(--color-bodyBg)' }}>
                          <th style={thStyle}>Nom</th>
                          <th style={thStyle}>Type</th>
                          <th style={thStyle}>Poids (%)</th>
                          <th style={thStyle}>Description</th>
                          <th style={{ ...thStyle, textAlign: 'center' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {categories.map(cat => {
                          const typeInfo = getCategoryTypeInfo(cat.category_type)
                          return (
                            <tr key={cat.id}>
                              <td style={{ ...tdStyle, fontWeight: '600' }}>{cat.name}</td>
                              <td style={tdStyle}>
                                <Badge style={{
                                  background: `${typeInfo.color}20`,
                                  color: typeInfo.color,
                                  padding: '6px 12px', borderRadius: '8px', fontSize: '12px',
                                  border: `1px solid ${typeInfo.color}40`
                                }}>
                                  {typeInfo.label}
                                </Badge>
                              </td>
                              <td style={tdStyle}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <ProgressBar now={parseFloat(cat.weight)}
                                    style={{ height: '8px', flex: 1, maxWidth: '100px', borderRadius: '4px' }}
                                    variant={parseFloat(cat.weight) > 30 ? 'primary' : 'info'} />
                                  <strong style={{ fontSize: '14px' }}>{cat.weight}%</strong>
                                </div>
                              </td>
                              <td style={{ ...tdStyle, color: 'var(--color-textSecondary)', fontSize: '13px' }}>
                                {cat.description || '—'}
                              </td>
                              <td style={{ ...tdStyle, textAlign: 'center' }}>
                                <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                                  <Button size="sm" variant="outline-warning" onClick={() => openEditCategory(cat)}
                                    style={{ borderRadius: '8px', padding: '4px 8px' }}>
                                    <FiEdit size={14} />
                                  </Button>
                                  <Button size="sm" variant="outline-danger" onClick={() => handleDeleteCategory(cat)}
                                    style={{ borderRadius: '8px', padding: '4px 8px' }}>
                                    <FiTrash2 size={14} />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                        {/* Total row */}
                        <tr style={{ background: 'var(--color-bodyBg)', fontWeight: '700' }}>
                          <td colSpan={2} style={{ ...tdStyle, textAlign: 'right' }}>TOTAL PONDÉRATION :</td>
                          <td style={tdStyle}>
                            <Badge bg={totalCategoryWeight === 100 ? 'success' : 'warning'}
                              style={{ fontSize: '14px', padding: '6px 14px', borderRadius: '8px' }}>
                              {totalCategoryWeight}%
                            </Badge>
                            {totalCategoryWeight !== 100 && (
                              <small style={{ color: '#f0ad4e', marginLeft: '8px' }}>
                                <FiAlertCircle size={12} /> Devrait être 100%
                              </small>
                            )}
                          </td>
                          <td colSpan={2} style={tdStyle}></td>
                        </tr>
                      </tbody>
                    </Table>
                  )}
                </Card.Body>
              </Card>
            </Col>

            {/* Guide Card */}
            <Col lg={4}>
              <Card style={cardStyle}>
                <Card.Header style={cardHeaderStyle}>
                  <h6 style={{ margin: 0, fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FiAward /> Guide de configuration
                  </h6>
                </Card.Header>
                <Card.Body style={{ padding: '20px' }}>
                  <div style={{ fontSize: '13px', color: 'var(--color-text)', lineHeight: '1.8' }}>
                    <p><strong>Comment fonctionne le système de notes :</strong></p>

                    <div style={{ marginBottom: '16px' }}>
                      <Badge bg="warning" text="dark" style={{ borderRadius: '6px', marginBottom: '4px' }}>1. Catégories</Badge>
                      <p style={{ margin: '4px 0 0', color: 'var(--color-textSecondary)' }}>
                        Définissez les types d'évaluation (Interro, Quiz, TP/TD, Examen) avec un poids. Le total devrait être 100%.
                      </p>
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                      <Badge bg="info" style={{ borderRadius: '6px', marginBottom: '4px' }}>2. Notes multiples</Badge>
                      <p style={{ margin: '4px 0 0', color: 'var(--color-textSecondary)' }}>
                        Plusieurs notes par catégorie sont possibles (ex: Interro 1, Interro 2). La moyenne par catégorie est calculée automatiquement.
                      </p>
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                      <Badge bg="success" style={{ borderRadius: '6px', marginBottom: '4px' }}>3. Moyenne du cours</Badge>
                      <p style={{ margin: '4px 0 0', color: 'var(--color-textSecondary)' }}>
                        Moyenne = Σ (moyenne_catégorie × poids / total_poids). Le bulletin est auto-généré.
                      </p>
                    </div>

                    <div>
                      <Badge bg="primary" style={{ borderRadius: '6px', marginBottom: '4px' }}>4. Moyenne générale</Badge>
                      <p style={{ margin: '4px 0 0', color: 'var(--color-textSecondary)' }}>
                        La moyenne générale est pondérée par les <strong>crédits</strong> de chaque cours. Un cours de 5 crédits pèse plus qu'un cours de 2 crédits.
                      </p>
                    </div>
                  </div>

                  <hr style={{ borderColor: 'var(--color-border)' }} />

                  <div style={{ fontSize: '12px' }}>
                    <strong>Exemple de configuration :</strong>
                    <ul style={{ marginTop: '8px', paddingLeft: '16px', color: 'var(--color-textSecondary)' }}>
                      <li>Interrogations : 20%</li>
                      <li>TP/TD : 20%</li>
                      <li>Quiz en ligne : 10%</li>
                      <li>Examen final : 50%</li>
                    </ul>
                  </div>

                  <hr style={{ borderColor: 'var(--color-border)' }} />

                  <div style={{ fontSize: '12px' }}>
                    <strong>Examens & Horaires :</strong>
                    <p style={{ margin: '4px 0 0', color: 'var(--color-textSecondary)' }}>
                      Les examens et rattrapages se programment via le module <strong>Horaire</strong> (type "Examen" ou "Rattrapage"). Les dates sont auto-générées dans le <strong>Calendrier académique</strong>.
                    </p>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </motion.div>
      )}

      {/* ═══════════ MODAL: Catégorie ═══════════ */}
      <Modal show={showCategoryModal} onHide={() => setShowCategoryModal(false)} centered>
        <Modal.Header closeButton style={{ background: 'var(--color-cardBg)', borderBottom: '1px solid var(--color-border)' }}>
          <Modal.Title style={{ fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FiSliders style={{ color: '#f093fb' }} />
            {editingCategory ? 'Modifier la catégorie' : 'Nouvelle catégorie de note'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ background: 'var(--color-cardBg)', padding: '24px' }}>
          {categoryError && <Alert variant="danger" style={{ borderRadius: '10px' }}>{categoryError}</Alert>}

          <Form.Group className="mb-3">
            <Form.Label style={labelStyle}>Nom de la catégorie *</Form.Label>
            <Form.Control value={categoryForm.name}
              onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
              placeholder="Ex: Interrogation, Examen final" style={inputStyle} />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label style={labelStyle}>Type d'évaluation *</Form.Label>
            <Form.Select value={categoryForm.category_type}
              onChange={(e) => setCategoryForm({ ...categoryForm, category_type: e.target.value })} style={inputStyle}>
              {CATEGORY_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label} — {t.description}</option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label style={labelStyle}>Poids (%) *</Form.Label>
            <InputGroup>
              <Form.Control type="number" min="0" max="100" step="0.5"
                value={categoryForm.weight}
                onChange={(e) => setCategoryForm({ ...categoryForm, weight: parseFloat(e.target.value) || 0 })}
                style={inputStyle} />
              <InputGroup.Text style={{ background: 'var(--color-bodyBg)', border: '1px solid var(--color-border)', borderRadius: '0 10px 10px 0' }}>%</InputGroup.Text>
            </InputGroup>
            <Form.Text style={{ color: 'var(--color-textSecondary)' }}>
              Poids de cette catégorie dans le calcul de la moyenne du cours.
            </Form.Text>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label style={labelStyle}>Description</Form.Label>
            <Form.Control as="textarea" rows={2} value={categoryForm.description}
              onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
              placeholder="Description optionnelle..." style={inputStyle} />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer style={{ background: 'var(--color-cardBg)', borderTop: '1px solid var(--color-border)' }}>
          <Button variant="outline-secondary" onClick={() => setShowCategoryModal(false)} style={{ borderRadius: '10px' }}>
            Annuler
          </Button>
          <Button onClick={handleSaveCategory} disabled={savingCategory}
            style={{ background: 'linear-gradient(135deg, #f093fb, #f5576c)', border: 'none', borderRadius: '10px', fontWeight: '600' }}>
            {savingCategory ? <Spinner size="sm" /> : <><FiSave className="me-1" /> Sauvegarder</>}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  )
}

// ── Styles ─────────────────────────────────────────────────────────────
const cardStyle = {
  border: 'none', borderRadius: '16px',
  background: 'var(--color-cardBg)', boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
}
const cardHeaderStyle = {
  background: 'var(--color-cardBg)', borderBottom: '1px solid var(--color-border)',
  padding: '16px 20px', borderRadius: '16px 16px 0 0'
}
const thStyle = {
  padding: '12px 16px', color: 'var(--color-text)', fontWeight: '600',
  fontSize: '13px', borderBottom: '2px solid var(--color-border)', whiteSpace: 'nowrap'
}
const tdStyle = {
  padding: '12px 16px', color: 'var(--color-text)',
  borderBottom: '1px solid var(--color-border)', fontSize: '14px', verticalAlign: 'middle'
}
const labelStyle = { fontWeight: '600', color: 'var(--color-text)', fontSize: '13px', marginBottom: '6px' }
const inputStyle = {
  borderRadius: '10px', border: '1px solid var(--color-border)',
  background: 'var(--color-bodyBg)', color: 'var(--color-text)', padding: '10px 14px'
}

export default ConfigurationAcademique
