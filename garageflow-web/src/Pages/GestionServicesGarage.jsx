import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Button, Card, Col, Container, Form, Row, Spinner } from 'react-bootstrap';
import {
  createGarageServiceRequest,
  deleteGarageServiceRequest,
  fetchGarageServicesRequest,
  updateGarageServiceRequest,
} from '../api/services';

function normalizeError(error) {
  if (!error) {
    return null;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (typeof error === 'object') {
    return Object.values(error).flat().join(' ');
  }
  return "Une erreur s'est produite.";
}

const emptyForm = {
  nom: '',
  categorie: 'entretien',
  description: '',
  duree_estimee: '',
  prix_indicatif: '',
  ordre_affichage: 0,
  actif: true,
};

const categoryOptions = [
  { value: 'entretien', label: 'Entretien' },
  { value: 'diagnostic', label: 'Diagnostic' },
  { value: 'reparation', label: 'Reparation' },
  { value: 'urgence', label: 'Urgence' },
];

function formatPrice(value) {
  if (value === null || value === undefined || value === '') {
    return '-';
  }

  return new Intl.NumberFormat('fr-CA', {
    style: 'currency',
    currency: 'CAD',
  }).format(Number(value));
}

function GestionServicesGarage() {
  const [services, setServices] = useState([]);
  const [formData, setFormData] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const loadServices = async () => {
    try {
      setLoading(true);
      setError(null);
      setServices(await fetchGarageServicesRequest());
    } catch (requestError) {
      setError(requestError.response?.data || requestError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  const stats = useMemo(() => ({
    total: services.length,
    active: services.filter((item) => item.actif).length,
    inactive: services.filter((item) => !item.actif).length,
  }), [services]);

  const sortedServices = useMemo(() => (
    [...services].sort((left, right) => {
      if ((left.ordre_affichage ?? 0) !== (right.ordre_affichage ?? 0)) {
        return (left.ordre_affichage ?? 0) - (right.ordre_affichage ?? 0);
      }
      return left.nom.localeCompare(right.nom);
    })
  ), [services]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!formData.duree_estimee) {
      setError({ duree_estimee: ['La duree estimee est requise.'] });
      return;
    }
    if (formData.prix_indicatif === '' || formData.prix_indicatif === null || formData.prix_indicatif === undefined) {
      setError({ prix_indicatif: ['Le prix indicatif est requis.'] });
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setMessage(null);
      if (editingId) {
        const updated = await updateGarageServiceRequest(editingId, formData);
        setServices((current) => current.map((item) => (item.id === updated.id ? updated : item)));
        setMessage('Service mis a jour.');
      } else {
        const created = await createGarageServiceRequest(formData);
        setServices((current) => [...current, created]);
        setMessage('Service ajoute.');
      }
      setFormData(emptyForm);
      setEditingId(null);
    } catch (requestError) {
      setError(requestError.response?.data || requestError);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (service) => {
    setEditingId(service.id);
    setFormData({
      nom: service.nom || '',
      categorie: service.categorie || 'entretien',
      description: service.description || '',
      duree_estimee: service.duree_estimee || '',
      prix_indicatif: service.prix_indicatif || '',
      ordre_affichage: service.ordre_affichage ?? 0,
      actif: Boolean(service.actif),
    });
  };

  const handleToggleActive = async (service) => {
    try {
      setLoading(true);
      setError(null);
      setMessage(null);
      const updated = await updateGarageServiceRequest(service.id, {
        actif: !service.actif,
      });
      setServices((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setMessage(updated.actif ? 'Service active.' : 'Service desactive.');
      if (editingId === service.id) {
        handleEdit(updated);
      }
    } catch (requestError) {
      setError(requestError.response?.data || requestError);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (serviceId) => {
    try {
      setLoading(true);
      setError(null);
      setMessage(null);
      await deleteGarageServiceRequest(serviceId);
      setServices((current) => current.filter((item) => item.id !== serviceId));
      if (editingId === serviceId) {
        setEditingId(null);
        setFormData(emptyForm);
      }
      setMessage('Service supprime.');
    } catch (requestError) {
      setError(requestError.response?.data || requestError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-5">
      <div className="d-flex justify-content-between align-items-start gap-3 mb-4">
        <div>
          <h1 className="mb-2">Services du garage</h1>
          <p className="text-muted mb-0">
            Structurez votre catalogue public avec une categorie, un ordre d affichage et une estimation claire.
          </p>
        </div>
        {loading && <Spinner animation="border" size="sm" />}
      </div>

      {message && <Alert variant="success">{message}</Alert>}
      {error && <Alert variant="danger">{normalizeError(error)}</Alert>}

      <Row className="g-4 mb-4">
        <Col md={6}>
          <Card className="shadow-sm h-100">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <Card.Title className="mb-0">{editingId ? 'Modifier un service' : 'Ajouter un service'}</Card.Title>
                <div className="d-flex gap-2">
                  <Badge bg="dark">{stats.active}/{stats.total} actifs</Badge>
                  <Badge bg="secondary">{stats.inactive} inactif(s)</Badge>
                </div>
              </div>

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Nom du service</Form.Label>
                  <Form.Control name="nom" value={formData.nom} onChange={handleChange} required />
                </Form.Group>

                <Row>
                  <Col sm={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Categorie</Form.Label>
                      <Form.Select name="categorie" value={formData.categorie} onChange={handleChange}>
                        {categoryOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col sm={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Ordre d affichage</Form.Label>
                      <Form.Control
                        type="number"
                        min="0"
                        step="1"
                        name="ordre_affichage"
                        value={formData.ordre_affichage}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Description</Form.Label>
                  <Form.Control as="textarea" rows={3} name="description" value={formData.description} onChange={handleChange} />
                </Form.Group>

                <Row>
                  <Col sm={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Duree estimee (heures)</Form.Label>
                      <Form.Control
                        type="number"
                        min="0.25"
                        max="12"
                        step="0.25"
                        name="duree_estimee"
                        value={formData.duree_estimee}
                        onChange={handleChange}
                        placeholder="1.50"
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col sm={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Prix indicatif (CAD)</Form.Label>
                      <Form.Control
                        type="number"
                        min="0"
                        step="0.01"
                        name="prix_indicatif"
                        value={formData.prix_indicatif}
                        onChange={handleChange}
                        placeholder="89.99"
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Alert variant="light" className="small">
                  Un service actif doit garder une duree estimee coherente et un prix indicatif lisible pour le client.
                </Alert>

                <Form.Check
                  type="switch"
                  id="service-actif"
                  name="actif"
                  label="Service actif"
                  checked={formData.actif}
                  onChange={handleChange}
                  className="mb-4"
                />

                <div className="d-flex gap-2">
                  <Button type="submit" disabled={loading}>
                    {editingId ? 'Enregistrer' : 'Ajouter'}
                  </Button>
                  {editingId && (
                    <Button
                      type="button"
                      variant="outline-secondary"
                      onClick={() => {
                        setEditingId(null);
                        setFormData(emptyForm);
                      }}
                    >
                      Annuler
                    </Button>
                  )}
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card className="shadow-sm h-100">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <Card.Title className="mb-0">Catalogue public</Card.Title>
                <Badge bg="dark">Trie par ordre puis nom</Badge>
              </div>
              <div className="d-grid gap-3">
                {sortedServices.map((service) => (
                  <div key={service.id} className="border rounded p-3">
                    <div className="d-flex justify-content-between align-items-start gap-3">
                      <div>
                        <div className="d-flex flex-wrap align-items-center gap-2">
                          <strong>{service.nom}</strong>
                          <Badge bg="light" text="dark">
                            {service.categorie_label || categoryOptions.find((item) => item.value === service.categorie)?.label || service.categorie}
                          </Badge>
                          <Badge bg="secondary">#{service.ordre_affichage ?? 0}</Badge>
                        </div>
                        <div className="small text-muted mt-1">{service.description || 'Sans description'}</div>
                      </div>
                      <Badge bg={service.actif ? 'success' : 'secondary'}>
                        {service.actif ? 'Actif' : 'Inactif'}
                      </Badge>
                    </div>
                    <div className="small text-muted mt-3">
                      Duree: {service.duree_estimee || '-'} h
                    </div>
                    <div className="small text-muted">
                      Prix indicatif: {formatPrice(service.prix_indicatif)}
                    </div>
                    <div className="d-flex gap-2 mt-3 flex-wrap">
                      <Button variant="outline-dark" size="sm" onClick={() => handleEdit(service)}>
                        Modifier
                      </Button>
                      <Button
                        variant={service.actif ? 'outline-secondary' : 'outline-success'}
                        size="sm"
                        onClick={() => handleToggleActive(service)}
                      >
                        {service.actif ? 'Desactiver' : 'Activer'}
                      </Button>
                      <Button variant="outline-danger" size="sm" onClick={() => handleDelete(service.id)}>
                        Supprimer
                      </Button>
                    </div>
                  </div>
                ))}
                {services.length === 0 && (
                  <div className="text-muted">Aucun service publie pour le moment.</div>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default GestionServicesGarage;
