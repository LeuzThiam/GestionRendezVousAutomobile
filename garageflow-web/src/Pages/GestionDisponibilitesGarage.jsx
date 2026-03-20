import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Button, Card, Col, Container, Form, Row, Spinner } from 'react-bootstrap';
import {
  createGarageDisponibiliteRequest,
  deleteGarageDisponibiliteRequest,
  fetchGarageDisponibilitesRequest,
  updateGarageDisponibiliteRequest,
} from '../api/disponibilites';

const dayOptions = [
  { value: 0, label: 'Lundi' },
  { value: 1, label: 'Mardi' },
  { value: 2, label: 'Mercredi' },
  { value: 3, label: 'Jeudi' },
  { value: 4, label: 'Vendredi' },
  { value: 5, label: 'Samedi' },
  { value: 6, label: 'Dimanche' },
];

const emptyForm = {
  jour_semaine: 0,
  heure_debut: '08:00',
  heure_fin: '17:00',
  actif: true,
};

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

function GestionDisponibilitesGarage() {
  const [disponibilites, setDisponibilites] = useState([]);
  const [formData, setFormData] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const loadDisponibilites = async () => {
    try {
      setLoading(true);
      setError(null);
      setDisponibilites(await fetchGarageDisponibilitesRequest());
    } catch (requestError) {
      setError(requestError.response?.data || requestError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDisponibilites();
  }, []);

  const grouped = useMemo(() => {
    const map = new Map();
    disponibilites.forEach((item) => {
      const key = item.jour_label || item.jour_semaine;
      map.set(key, [...(map.get(key) || []), item]);
    });
    return Array.from(map.entries());
  }, [disponibilites]);

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
      setMessage(null);
      setError(null);
      if (editingId) {
        const updated = await updateGarageDisponibiliteRequest(editingId, formData);
        setDisponibilites((current) => current.map((item) => (item.id === updated.id ? updated : item)));
        setMessage('Disponibilite mise a jour.');
      } else {
        const created = await createGarageDisponibiliteRequest(formData);
        setDisponibilites((current) => [...current, created]);
        setMessage('Disponibilite ajoutee.');
      }
      setEditingId(null);
      setFormData(emptyForm);
    } catch (requestError) {
      setError(requestError.response?.data || requestError);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setFormData({
      jour_semaine: item.jour_semaine,
      heure_debut: item.heure_debut,
      heure_fin: item.heure_fin,
      actif: Boolean(item.actif),
    });
  };

  const handleDelete = async (id) => {
    try {
      setLoading(true);
      setMessage(null);
      setError(null);
      await deleteGarageDisponibiliteRequest(id);
      setDisponibilites((current) => current.filter((item) => item.id !== id));
      setMessage('Disponibilite supprimee.');
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
          <h1 className="mb-2">Disponibilites du garage</h1>
          <p className="text-muted mb-0">
            Definissez les horaires generaux affiches aux clients et utilisez-les comme base de planification.
          </p>
        </div>
        {loading && <Spinner animation="border" size="sm" />}
      </div>

      {message && <Alert variant="success">{message}</Alert>}
      {error && <Alert variant="danger">{normalizeError(error)}</Alert>}

      <Row className="g-4">
        <Col lg={5}>
          <Card className="shadow-sm h-100">
            <Card.Body>
              <Card.Title className="mb-4">{editingId ? 'Modifier un creneau' : 'Ajouter un creneau'}</Card.Title>
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Jour</Form.Label>
                  <Form.Select name="jour_semaine" value={formData.jour_semaine} onChange={handleChange}>
                    {dayOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <Row>
                  <Col sm={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Heure de debut</Form.Label>
                      <Form.Control type="time" name="heure_debut" value={formData.heure_debut} onChange={handleChange} />
                    </Form.Group>
                  </Col>
                  <Col sm={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Heure de fin</Form.Label>
                      <Form.Control type="time" name="heure_fin" value={formData.heure_fin} onChange={handleChange} />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Check
                  className="mb-4"
                  type="switch"
                  id="dispo-actif"
                  name="actif"
                  label="Creneau actif"
                  checked={formData.actif}
                  onChange={handleChange}
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

        <Col lg={7}>
          <Card className="shadow-sm h-100">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <Card.Title className="mb-0">Planning hebdomadaire public</Card.Title>
                <Badge bg="dark">{disponibilites.length} creneau(x)</Badge>
              </div>

              <div className="d-grid gap-3">
                {grouped.map(([jour, items]) => (
                  <div key={jour} className="border rounded p-3">
                    <div className="fw-semibold mb-2">{jour}</div>
                    <div className="d-grid gap-2">
                      {items.map((item) => (
                        <div key={item.id} className="d-flex justify-content-between align-items-center gap-3">
                          <div>
                            {item.heure_debut} - {item.heure_fin}
                            <span className="small text-muted ms-2">
                              {item.actif ? 'Actif' : 'Inactif'}
                            </span>
                          </div>
                          <div className="d-flex gap-2">
                            <Button size="sm" variant="outline-dark" onClick={() => handleEdit(item)}>
                              Modifier
                            </Button>
                            <Button size="sm" variant="outline-danger" onClick={() => handleDelete(item.id)}>
                              Supprimer
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {grouped.length === 0 && (
                  <div className="text-muted">Aucune disponibilite configuree pour le moment.</div>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default GestionDisponibilitesGarage;
