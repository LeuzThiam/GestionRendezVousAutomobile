import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Button, Card, Col, Container, Form, Row, Spinner } from 'react-bootstrap';
import {
  createOrganizationDisponibiliteRequest,
  createOrganizationFermetureRequest,
  deleteOrganizationDisponibiliteRequest,
  deleteOrganizationFermetureRequest,
  fetchOrganizationDisponibilitesRequest,
  fetchOrganizationFermeturesRequest,
  updateOrganizationDisponibiliteRequest,
  updateOrganizationFermetureRequest,
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

const emptySlotForm = {
  jour_semaine: 0,
  heure_debut: '08:00',
  heure_fin: '17:00',
  actif: true,
};

const emptyClosureForm = {
  date: '',
  toute_la_journee: true,
  heure_debut: '08:00',
  heure_fin: '12:00',
  raison: '',
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

function getWeekDayLabel(value) {
  return dayOptions.find((item) => item.value === value)?.label || value;
}

function getClientVisibleSummary(disponibilites, fermetures) {
  const activeSlots = disponibilites.filter((item) => item.actif);
  const activeClosures = fermetures.filter((item) => item.actif);

  return {
    visibleSlots: activeSlots.length,
    visibleDays: new Set(activeSlots.map((item) => item.jour_semaine)).size,
    closureDays: activeClosures.filter((item) => item.toute_la_journee).length,
    partialClosures: activeClosures.filter((item) => !item.toute_la_journee).length,
  };
}

function GestionDisponibilitesPro() {
  const [disponibilites, setDisponibilites] = useState([]);
  const [fermetures, setFermetures] = useState([]);
  const [slotForm, setSlotForm] = useState(emptySlotForm);
  const [closureForm, setClosureForm] = useState(emptyClosureForm);
  const [editingSlotId, setEditingSlotId] = useState(null);
  const [editingClosureId, setEditingClosureId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [slotsData, fermeturesData] = await Promise.all([
        fetchOrganizationDisponibilitesRequest(),
        fetchOrganizationFermeturesRequest(),
      ]);
      setDisponibilites(slotsData);
      setFermetures(fermeturesData);
    } catch (requestError) {
      setError(requestError.response?.data || requestError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const groupedSlots = useMemo(() => {
    return dayOptions.map((day) => ({
      ...day,
      slots: disponibilites
        .filter((item) => Number(item.jour_semaine) === day.value)
        .sort((left, right) => left.heure_debut.localeCompare(right.heure_debut)),
    }));
  }, [disponibilites]);

  const summary = useMemo(() => getClientVisibleSummary(disponibilites, fermetures), [disponibilites, fermetures]);

  const handleSlotChange = (event) => {
    const { name, value, type, checked } = event.target;
    setSlotForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleClosureChange = (event) => {
    const { name, value, type, checked } = event.target;
    setClosureForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSlotSubmit = async (event) => {
    event.preventDefault();
    if (slotForm.heure_fin <= slotForm.heure_debut) {
      setError({ heure_fin: ["L'heure de fin doit etre apres l'heure de debut."] });
      return;
    }

    try {
      setLoading(true);
      setMessage(null);
      setError(null);
      if (editingSlotId) {
        const updated = await updateOrganizationDisponibiliteRequest(editingSlotId, slotForm);
        setDisponibilites((current) => current.map((item) => (item.id === updated.id ? updated : item)));
        setMessage('Disponibilite mise a jour.');
      } else {
        const created = await createOrganizationDisponibiliteRequest(slotForm);
        setDisponibilites((current) => [...current, created]);
        setMessage('Disponibilite ajoutee.');
      }
      setEditingSlotId(null);
      setSlotForm(emptySlotForm);
    } catch (requestError) {
      setError(requestError.response?.data || requestError);
    } finally {
      setLoading(false);
    }
  };

  const handleClosureSubmit = async (event) => {
    event.preventDefault();
    if (!closureForm.toute_la_journee && closureForm.heure_fin <= closureForm.heure_debut) {
      setError({ heure_fin: ["L'heure de fin doit etre apres l'heure de debut."] });
      return;
    }

    try {
      setLoading(true);
      setMessage(null);
      setError(null);
      if (editingClosureId) {
        const updated = await updateOrganizationFermetureRequest(editingClosureId, closureForm);
        setFermetures((current) => current.map((item) => (item.id === updated.id ? updated : item)));
        setMessage('Fermeture exceptionnelle mise a jour.');
      } else {
        const created = await createOrganizationFermetureRequest(closureForm);
        setFermetures((current) => [...current, created]);
        setMessage('Fermeture exceptionnelle ajoutee.');
      }
      setEditingClosureId(null);
      setClosureForm(emptyClosureForm);
    } catch (requestError) {
      setError(requestError.response?.data || requestError);
    } finally {
      setLoading(false);
    }
  };

  const handleEditSlot = (item) => {
    setEditingSlotId(item.id);
    setSlotForm({
      jour_semaine: item.jour_semaine,
      heure_debut: item.heure_debut,
      heure_fin: item.heure_fin,
      actif: Boolean(item.actif),
    });
  };

  const handleEditClosure = (item) => {
    setEditingClosureId(item.id);
    setClosureForm({
      date: item.date,
      toute_la_journee: Boolean(item.toute_la_journee),
      heure_debut: item.heure_debut || '08:00',
      heure_fin: item.heure_fin || '12:00',
      raison: item.raison || '',
      actif: Boolean(item.actif),
    });
  };

  const handleDeleteSlot = async (id) => {
    try {
      setLoading(true);
      setMessage(null);
      setError(null);
      await deleteOrganizationDisponibiliteRequest(id);
      setDisponibilites((current) => current.filter((item) => item.id !== id));
      setMessage('Disponibilite supprimee.');
    } catch (requestError) {
      setError(requestError.response?.data || requestError);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClosure = async (id) => {
    try {
      setLoading(true);
      setMessage(null);
      setError(null);
      await deleteOrganizationFermetureRequest(id);
      setFermetures((current) => current.filter((item) => item.id !== id));
      setMessage('Fermeture exceptionnelle supprimee.');
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
            Definissez plusieurs creneaux par jour, anticipez les fermetures exceptionnelles et voyez ce qui reste visible cote client.
          </p>
        </div>
        {loading && <Spinner animation="border" size="sm" />}
      </div>

      {message && <Alert variant="success">{message}</Alert>}
      {error && <Alert variant="danger">{normalizeError(error)}</Alert>}

      <Alert variant="info" className="mb-4">
        <div className="fw-semibold mb-2">Creneaux visibles pour reservation</div>
        <div className="small">
          {summary.visibleSlots} creneau(x) actif(s) sur {summary.visibleDays} jour(s). {summary.closureDays} fermeture(s) toute la journee et {summary.partialClosures} fermeture(s) partielle(s) viendront limiter ce qui est effectivement reservable.
        </div>
      </Alert>

      <Row className="g-4 mb-4">
        <Col lg={5}>
          <Card className="shadow-sm h-100">
            <Card.Body>
              <Card.Title className="mb-4">{editingSlotId ? 'Modifier un creneau' : 'Ajouter un creneau'}</Card.Title>
              <Form onSubmit={handleSlotSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Jour</Form.Label>
                  <Form.Select name="jour_semaine" value={slotForm.jour_semaine} onChange={handleSlotChange}>
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
                      <Form.Control type="time" name="heure_debut" value={slotForm.heure_debut} onChange={handleSlotChange} />
                    </Form.Group>
                  </Col>
                  <Col sm={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Heure de fin</Form.Label>
                      <Form.Control type="time" name="heure_fin" value={slotForm.heure_fin} onChange={handleSlotChange} />
                    </Form.Group>
                  </Col>
                </Row>

                <Alert variant="light" className="small">
                  Les creneaux actifs d un meme jour ne doivent pas se chevaucher. Vous pouvez definir plusieurs blocs distincts sur une meme journee.
                </Alert>

                <Form.Check
                  className="mb-4"
                  type="switch"
                  id="dispo-actif"
                  name="actif"
                  label="Creneau actif"
                  checked={slotForm.actif}
                  onChange={handleSlotChange}
                />

                <div className="d-flex gap-2">
                  <Button type="submit" disabled={loading}>
                    {editingSlotId ? 'Enregistrer' : 'Ajouter'}
                  </Button>
                  {editingSlotId && (
                    <Button type="button" variant="outline-secondary" onClick={() => {
                      setEditingSlotId(null);
                      setSlotForm(emptySlotForm);
                    }}>
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
                <Card.Title className="mb-0">Planning hebdomadaire visible</Card.Title>
                <Badge bg="dark">{disponibilites.length} creneau(x)</Badge>
              </div>

              <div className="d-grid gap-3">
                {groupedSlots.map((day) => (
                  <div key={day.value} className="border rounded p-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <div className="fw-semibold">{day.label}</div>
                      <Badge bg={day.slots.some((item) => item.actif) ? 'success' : 'secondary'}>
                        {day.slots.filter((item) => item.actif).length} visible(s)
                      </Badge>
                    </div>
                    {day.slots.length > 0 ? (
                      <div className="d-grid gap-2">
                        {day.slots.map((item) => (
                          <div key={item.id} className="d-flex justify-content-between align-items-center gap-3">
                            <div>
                              {item.heure_debut} - {item.heure_fin}
                              <span className="small text-muted ms-2">
                                {item.actif ? 'Visible pour reservation' : 'Masque au client'}
                              </span>
                            </div>
                            <div className="d-flex gap-2">
                              <Button size="sm" variant="outline-dark" onClick={() => handleEditSlot(item)}>
                                Modifier
                              </Button>
                              <Button size="sm" variant="outline-danger" onClick={() => handleDeleteSlot(item.id)}>
                                Supprimer
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="small text-muted">Aucun creneau defini.</div>
                    )}
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="g-4">
        <Col lg={5}>
          <Card className="shadow-sm h-100">
            <Card.Body>
              <Card.Title className="mb-4">{editingClosureId ? 'Modifier une fermeture' : 'Ajouter une fermeture exceptionnelle'}</Card.Title>
              <Form onSubmit={handleClosureSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Date</Form.Label>
                  <Form.Control type="date" name="date" value={closureForm.date} onChange={handleClosureChange} required />
                </Form.Group>

                <Form.Check
                  className="mb-3"
                  type="switch"
                  id="closure-day"
                  name="toute_la_journee"
                  label="Fermee toute la journee"
                  checked={closureForm.toute_la_journee}
                  onChange={handleClosureChange}
                />

                {!closureForm.toute_la_journee && (
                  <Row>
                    <Col sm={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Heure de debut</Form.Label>
                        <Form.Control type="time" name="heure_debut" value={closureForm.heure_debut} onChange={handleClosureChange} />
                      </Form.Group>
                    </Col>
                    <Col sm={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Heure de fin</Form.Label>
                        <Form.Control type="time" name="heure_fin" value={closureForm.heure_fin} onChange={handleClosureChange} />
                      </Form.Group>
                    </Col>
                  </Row>
                )}

                <Form.Group className="mb-3">
                  <Form.Label>Raison</Form.Label>
                  <Form.Control
                    type="text"
                    name="raison"
                    value={closureForm.raison}
                    onChange={handleClosureChange}
                    placeholder="Jour ferie, conge, inventaire..."
                  />
                </Form.Group>

                <Form.Check
                  className="mb-4"
                  type="switch"
                  id="closure-actif"
                  name="actif"
                  label="Fermeture active"
                  checked={closureForm.actif}
                  onChange={handleClosureChange}
                />

                <div className="d-flex gap-2">
                  <Button type="submit" disabled={loading}>
                    {editingClosureId ? 'Enregistrer' : 'Ajouter'}
                  </Button>
                  {editingClosureId && (
                    <Button type="button" variant="outline-secondary" onClick={() => {
                      setEditingClosureId(null);
                      setClosureForm(emptyClosureForm);
                    }}>
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
                <Card.Title className="mb-0">Fermetures exceptionnelles</Card.Title>
                <Badge bg="dark">{fermetures.length} fermeture(s)</Badge>
              </div>

              <div className="d-grid gap-3">
                {fermetures.map((item) => (
                  <div key={item.id} className="border rounded p-3">
                    <div className="d-flex justify-content-between align-items-start gap-3">
                      <div>
                        <div className="fw-semibold">{item.date}</div>
                        <div className="small text-muted">
                          {item.toute_la_journee ? 'Fermeture toute la journee' : `Fermeture de ${item.heure_debut} a ${item.heure_fin}`}
                        </div>
                        <div className="small text-muted">{item.raison || 'Sans motif precise'}</div>
                      </div>
                      <Badge bg={item.actif ? 'warning' : 'secondary'}>
                        {item.actif ? 'Impacte la reservation' : 'Inactive'}
                      </Badge>
                    </div>
                    <div className="d-flex gap-2 mt-3">
                      <Button size="sm" variant="outline-dark" onClick={() => handleEditClosure(item)}>
                        Modifier
                      </Button>
                      <Button size="sm" variant="outline-danger" onClick={() => handleDeleteClosure(item.id)}>
                        Supprimer
                      </Button>
                    </div>
                  </div>
                ))}
                {fermetures.length === 0 && (
                  <div className="text-muted">Aucune fermeture exceptionnelle configuree pour le moment.</div>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default GestionDisponibilitesPro;
