import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Button, Card, Col, Container, Form, Row, Spinner } from 'react-bootstrap';
import {
  createMecanicienDisponibiliteRequest,
  deleteMecanicienDisponibiliteRequest,
  fetchGarageMecaniciensRequest,
  fetchMecanicienDisponibilitesRequest,
} from '../api/mecaniciens';

const JOURS = [
  { value: 0, label: 'Lundi' },
  { value: 1, label: 'Mardi' },
  { value: 2, label: 'Mercredi' },
  { value: 3, label: 'Jeudi' },
  { value: 4, label: 'Vendredi' },
  { value: 5, label: 'Samedi' },
  { value: 6, label: 'Dimanche' },
];

function GestionDisponibilitesMecaniciensGarage() {
  const [mecaniciens, setMecaniciens] = useState([]);
  const [disponibilites, setDisponibilites] = useState([]);
  const [selectedMecanicien, setSelectedMecanicien] = useState('');
  const [formData, setFormData] = useState({
    mecanicien: '',
    jour_semaine: '0',
    heure_debut: '08:00',
    heure_fin: '17:00',
    actif: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const loadData = async (mecanicienId = '') => {
    try {
      setLoading(true);
      setError(null);
      const [mecaniciensData, disponibilitesData] = await Promise.all([
        fetchGarageMecaniciensRequest(),
        fetchMecanicienDisponibilitesRequest(mecanicienId),
      ]);
      setMecaniciens(mecaniciensData);
      setDisponibilites(disponibilitesData);
    } catch (requestError) {
      const payload = requestError.response?.data;
      if (typeof payload === 'string') {
        setError(payload);
      } else if (payload && typeof payload === 'object') {
        setError(Object.values(payload).flat().join(' '));
      } else {
        setError("Impossible de charger les disponibilites des mecaniciens.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const groupedDisponibilites = useMemo(() => {
    return mecaniciens.map((mecanicien) => ({
      mecanicien,
      disponibilites: disponibilites.filter((item) => item.mecanicien === mecanicien.id),
    }));
  }, [disponibilites, mecaniciens]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      setLoading(true);
      setError(null);
      setMessage(null);
      await createMecanicienDisponibiliteRequest({
        mecanicien: Number(formData.mecanicien),
        jour_semaine: Number(formData.jour_semaine),
        heure_debut: formData.heure_debut,
        heure_fin: formData.heure_fin,
        actif: formData.actif,
      });
      setMessage('Disponibilite mecanicien ajoutee.');
      setFormData((current) => ({
        ...current,
        jour_semaine: '0',
        heure_debut: '08:00',
        heure_fin: '17:00',
      }));
      await loadData(selectedMecanicien);
    } catch (requestError) {
      const payload = requestError.response?.data;
      if (typeof payload === 'string') {
        setError(payload);
      } else if (payload && typeof payload === 'object') {
        setError(Object.values(payload).flat().join(' '));
      } else {
        setError("Impossible d'ajouter cette disponibilite.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      setLoading(true);
      setError(null);
      setMessage(null);
      await deleteMecanicienDisponibiliteRequest(id);
      setMessage('Disponibilite supprimee.');
      await loadData(selectedMecanicien);
    } catch (requestError) {
      const payload = requestError.response?.data;
      if (typeof payload === 'string') {
        setError(payload);
      } else if (payload && typeof payload === 'object') {
        setError(Object.values(payload).flat().join(' '));
      } else {
        setError("Impossible de supprimer cette disponibilite.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = async (event) => {
    const value = event.target.value;
    setSelectedMecanicien(value);
    await loadData(value);
  };

  return (
    <Container className="py-5">
      <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-end gap-3 mb-4">
        <div>
          <h1 className="mb-2">Disponibilites des mecaniciens</h1>
          <p className="text-muted mb-0">
            Definissez les plages horaires internes de votre equipe pour mieux organiser le planning.
          </p>
        </div>
        <Badge bg="dark">{disponibilites.length} disponibilite(s)</Badge>
      </div>

      {loading && (
        <div className="d-flex align-items-center gap-2 mb-4">
          <Spinner animation="border" size="sm" />
          <span>Chargement en cours...</span>
        </div>
      )}
      {message && <Alert variant="success">{message}</Alert>}
      {error && <Alert variant="danger">{error}</Alert>}

      <Row className="g-4">
        <Col lg={4}>
          <Card className="shadow-sm border-0">
            <Card.Body>
              <Card.Title className="mb-4">Ajouter une disponibilite</Card.Title>
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Mecanicien</Form.Label>
                  <Form.Select
                    value={formData.mecanicien}
                    onChange={(event) => setFormData((current) => ({ ...current, mecanicien: event.target.value }))}
                    required
                  >
                    <option value="">Selectionnez un mecanicien</option>
                    {mecaniciens.map((mecanicien) => (
                      <option key={mecanicien.id} value={mecanicien.id}>
                        {`${mecanicien.first_name || ''} ${mecanicien.last_name || ''}`.trim() || mecanicien.username}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Jour</Form.Label>
                  <Form.Select
                    value={formData.jour_semaine}
                    onChange={(event) => setFormData((current) => ({ ...current, jour_semaine: event.target.value }))}
                  >
                    {JOURS.map((jour) => (
                      <option key={jour.value} value={jour.value}>{jour.label}</option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <Row>
                  <Col sm={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Heure debut</Form.Label>
                      <Form.Control
                        type="time"
                        value={formData.heure_debut}
                        onChange={(event) => setFormData((current) => ({ ...current, heure_debut: event.target.value }))}
                      />
                    </Form.Group>
                  </Col>
                  <Col sm={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Heure fin</Form.Label>
                      <Form.Control
                        type="time"
                        value={formData.heure_fin}
                        onChange={(event) => setFormData((current) => ({ ...current, heure_fin: event.target.value }))}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Button type="submit" variant="dark" disabled={loading} className="w-100">
                  Enregistrer
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={8}>
          <Card className="shadow-sm border-0 mb-4">
            <Card.Body>
              <Form.Group>
                <Form.Label>Filtrer par mecanicien</Form.Label>
                <Form.Select value={selectedMecanicien} onChange={handleFilterChange}>
                  <option value="">Tous les mecaniciens</option>
                  {mecaniciens.map((mecanicien) => (
                    <option key={mecanicien.id} value={mecanicien.id}>
                      {`${mecanicien.first_name || ''} ${mecanicien.last_name || ''}`.trim() || mecanicien.username}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Card.Body>
          </Card>

          <Row className="g-4">
            {groupedDisponibilites.map(({ mecanicien, disponibilites: items }) => (
              <Col md={6} key={mecanicien.id}>
                <Card className="shadow-sm border-0 h-100">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
                      <div>
                        <Card.Title className="mb-1">
                          {`${mecanicien.first_name || ''} ${mecanicien.last_name || ''}`.trim() || mecanicien.username}
                        </Card.Title>
                        <div className="text-muted small">{mecanicien.email || 'Courriel non renseigne'}</div>
                      </div>
                      <Badge bg={items.length > 0 ? 'success' : 'secondary'}>
                        {items.length} creneau(x)
                      </Badge>
                    </div>

                    {items.length > 0 ? (
                      <div className="d-flex flex-column gap-3">
                        {items.map((item) => (
                          <div key={item.id} className="border rounded p-3">
                            <div className="fw-semibold">{item.jour_label}</div>
                            <div className="small text-muted mb-3">{item.heure_debut} - {item.heure_fin}</div>
                            <Button variant="outline-danger" size="sm" onClick={() => handleDelete(item.id)}>
                              Supprimer
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <Alert variant="light" className="mb-0">
                        Aucune disponibilite definie pour ce mecanicien.
                      </Alert>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Col>
      </Row>
    </Container>
  );
}

export default GestionDisponibilitesMecaniciensGarage;
