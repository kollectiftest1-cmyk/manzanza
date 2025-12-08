import React, { useState, useEffect } from 'react';
import { Row, Col, Form, Button, Card } from 'react-bootstrap';
import { FiFilter, FiX } from 'react-icons/fi';
import api from '../services/api';

/**
 * FilterBar - Composant réutilisable pour filtrer les données
 *
 * Props:
 * - filters: Array d'objets définissant les filtres
 *   Exemple: [
 *     { name: 'section', label: 'Section', type: 'select', options: [] },
 *     { name: 'niveau', label: 'Niveau', type: 'select', options: [...] },
 *     { name: 'sexe', label: 'Sexe', type: 'select', options: [...] }
 *   ]
 * - onFilterChange: Callback appelé quand les filtres changent
 * - initialValues: Valeurs initiales des filtres
 */
const FilterBar = ({ filters = [], onFilterChange, initialValues = {} }) => {
  const [filterValues, setFilterValues] = useState(initialValues);
  const [showFilters, setShowFilters] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState({});

  // États pour les options chargées dynamiquement
  const [sections, setSections] = useState([]);
  const [filieres, setFilieres] = useState([]);
  const [auditoires, setAuditoires] = useState([]);

  // Charger les options des filtres au montage
  useEffect(() => {
    loadDynamicOptions();
  }, []);

  const loadDynamicOptions = async () => {
    try {
      // Charger sections
      if (filters.some(f => f.name === 'section')) {
        setLoadingOptions(prev => ({ ...prev, section: true }));
        const sectionsRes = await api.get('/sections/');
        setSections(sectionsRes.data.results || sectionsRes.data);
        setLoadingOptions(prev => ({ ...prev, section: false }));
      }

      // Charger filières
      if (filters.some(f => f.name === 'filiere')) {
        setLoadingOptions(prev => ({ ...prev, filiere: true }));
        const filieresRes = await api.get('/filieres/');
        setFilieres(filieresRes.data.results || filieresRes.data);
        setLoadingOptions(prev => ({ ...prev, filiere: false }));
      }

      // Charger auditoires
      if (filters.some(f => f.name === 'auditoire')) {
        setLoadingOptions(prev => ({ ...prev, auditoire: true }));
        const auditoiresRes = await api.get('/auditoires/');
        setAuditoires(auditoiresRes.data.results || auditoiresRes.data);
        setLoadingOptions(prev => ({ ...prev, auditoire: false }));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des options:', error);
    }
  };

  const handleFilterChange = (name, value) => {
    const newFilters = { ...filterValues, [name]: value };
    setFilterValues(newFilters);
    onFilterChange(newFilters);
  };

  const handleReset = () => {
    setFilterValues({});
    onFilterChange({});
  };

  const getOptions = (filter) => {
    // Options prédéfinies
    if (filter.options) return filter.options;

    // Options chargées dynamiquement
    switch (filter.name) {
      case 'section':
        return sections.map(s => ({ value: s.id, label: s.nom }));
      case 'filiere':
        return filieres.map(f => ({ value: f.id, label: f.nom }));
      case 'auditoire':
        return auditoires.map(a => ({ value: a.id, label: a.nom }));
      case 'niveau':
        return [
          { value: 'L1', label: 'Licence 1 (L1)' },
          { value: 'L2', label: 'Licence 2 (L2)' },
          { value: 'L3', label: 'Licence 3 (L3)' },
          { value: 'M1', label: 'Master 1 (M1)' },
          { value: 'M2', label: 'Master 2 (M2)' },
        ];
      case 'vacation':
        return [
          { value: 'jour', label: 'Jour' },
          { value: 'soir', label: 'Soir' },
        ];
      case 'sexe':
        return [
          { value: 'M', label: 'Masculin' },
          { value: 'F', label: 'Féminin' },
        ];
      case 'semester':
        return [
          { value: 'Semestre 1', label: 'Semestre 1' },
          { value: 'Semestre 2', label: 'Semestre 2' },
        ];
      case 'is_active':
        return [
          { value: 'true', label: 'Actif' },
          { value: 'false', label: 'Inactif' },
        ];
      default:
        return [];
    }
  };

  const renderFilter = (filter) => {
    const options = getOptions(filter);
    const isLoading = loadingOptions[filter.name];

    switch (filter.type) {
      case 'select':
        return (
          <Form.Group key={filter.name} className="mb-3">
            <Form.Label style={{ fontWeight: '600', color: 'var(--color-textPrimary)' }}>
              {filter.label}
            </Form.Label>
            <Form.Select
              value={filterValues[filter.name] || ''}
              onChange={(e) => handleFilterChange(filter.name, e.target.value)}
              disabled={isLoading}
              style={{
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
                background: 'var(--color-cardBg)',
                color: 'var(--color-textPrimary)',
              }}
            >
              <option value="">
                {isLoading ? 'Chargement...' : `Tous les ${filter.label.toLowerCase()}`}
              </option>
              {options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        );

      case 'text':
        return (
          <Form.Group key={filter.name} className="mb-3">
            <Form.Label style={{ fontWeight: '600', color: 'var(--color-textPrimary)' }}>
              {filter.label}
            </Form.Label>
            <Form.Control
              type="text"
              placeholder={filter.placeholder || `Entrez ${filter.label.toLowerCase()}`}
              value={filterValues[filter.name] || ''}
              onChange={(e) => handleFilterChange(filter.name, e.target.value)}
              style={{
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
                background: 'var(--color-cardBg)',
                color: 'var(--color-textPrimary)',
              }}
            />
          </Form.Group>
        );

      case 'date':
        return (
          <Form.Group key={filter.name} className="mb-3">
            <Form.Label style={{ fontWeight: '600', color: 'var(--color-textPrimary)' }}>
              {filter.label}
            </Form.Label>
            <Form.Control
              type="date"
              value={filterValues[filter.name] || ''}
              onChange={(e) => handleFilterChange(filter.name, e.target.value)}
              style={{
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
                background: 'var(--color-cardBg)',
                color: 'var(--color-textPrimary)',
              }}
            />
          </Form.Group>
        );

      default:
        return null;
    }
  };

  const activeFiltersCount = Object.values(filterValues).filter(v => v !== '' && v !== null && v !== undefined).length;

  return (
    <Card style={{
      background: 'var(--color-cardBg)',
      border: '1px solid var(--color-border)',
      borderRadius: '12px',
      marginBottom: '1.5rem',
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
    }}>
      <Card.Header style={{
        background: 'transparent',
        borderBottom: '1px solid var(--color-border)',
        padding: '1rem 1.25rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FiFilter size={18} style={{ color: 'var(--color-primary)' }} />
          <span style={{ fontWeight: '600', color: 'var(--color-textPrimary)' }}>
            Filtres
            {activeFiltersCount > 0 && (
              <span style={{
                marginLeft: '0.5rem',
                padding: '0.2rem 0.5rem',
                background: 'var(--color-primary)',
                color: 'white',
                borderRadius: '12px',
                fontSize: '0.75rem'
              }}>
                {activeFiltersCount}
              </span>
            )}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {activeFiltersCount > 0 && (
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={handleReset}
              style={{
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem'
              }}
            >
              <FiX size={16} />
              Réinitialiser
            </Button>
          )}
          <Button
            variant="outline-primary"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            style={{ borderRadius: '8px' }}
          >
            {showFilters ? 'Masquer' : 'Afficher'}
          </Button>
        </div>
      </Card.Header>

      {showFilters && (
        <Card.Body style={{ padding: '1.25rem' }}>
          <Row>
            {filters.map((filter, index) => (
              <Col key={filter.name} md={filter.width || 4} sm={filter.width || 6} xs={12}>
                {renderFilter(filter)}
              </Col>
            ))}
          </Row>
        </Card.Body>
      )}
    </Card>
  );
};

export default FilterBar;
