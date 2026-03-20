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
  description: '',
  duree_estimee: '',
  prix_indicatif: '',
  actif: true,
};

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
  }), [services]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
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
        setServices((current) => [...current, created].sort((a, b) => a.nom.localeCompare(b.nom)));
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
      description: service.description || '',
      duree_estimee: service.duree_estimee || '',
      prix_indicatif: service.prix_indicatif || '',
      actif: Boolean(service.actif),
    });
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
            Publiez les prestations que vos clients peuvent selectionner lors de leur demande.
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
                <Badge bg="dark">{stats.active}/{stats.total} actifs</Badge>
              </div>

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Nom du service</Form.Label>
                  <Form.Control name="nom" value={formData.nom} onChange={handleChange} required />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Description</Form.Label>
                  <Form.Control as="textarea" rows={3} name="description" value={formData.description} onChange={handleChange} />
                </Form.Group>

                <Row>
                  <Col sm={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Duree estimee</Form.Label>
                      <Form.Control name="duree_estimee" value={formData.duree_estimee} onChange={handleChange} placeholder="1.50" />
                    </Form.Group>
                  </Col>
                  <Col sm={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Prix indicatif</Form.Label>
                      <Form.Control name="prix_indicatif" value={formData.prix_indicatif} onChange={handleChange} placeholder="89.99" />
                    </Form.Group>
                  </Col>
                </Row>

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
              <Card.Title className="mb-4">Catalogue public</Card.Title>
              <div className="d-grid gap-3">
                {services.map((service) => (
                  <div key={service.id} className="border rounded p-3">
                    <div className="d-flex justify-content-between align-items-start gap-3">
                      <div>
                        <strong>{service.nom}</strong>
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
                      Prix indicatif: {service.prix_indicatif || '-'}
                    </div>
                    <div className="d-flex gap-2 mt-3">
                      <Button variant="outline-dark" size="sm" onClick={() => handleEdit(service)}>
                        Modifier
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
