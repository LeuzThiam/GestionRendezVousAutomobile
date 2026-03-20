import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Button, Card, Col, Container, Form, Modal, Row, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { fetchRendezVousRequest, updateRendezVousRequest } from '../api/rendezVous';
import { getRendezVousStatusLabel, getRendezVousStatusVariant } from '../utils/rendezVousStatus';

function formatDateTime(value) {
  if (!value) {
    return '-';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString('fr-CA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatCurrency(value) {
  if (value === null || value === undefined || value === '') {
    return '-';
  }

  return new Intl.NumberFormat('fr-CA', {
    style: 'currency',
    currency: 'CAD',
  }).format(Number(value));
}

function getTimeRemainingLabel(value) {
  if (!value) {
    return null;
  }

  const rendezVousDate = new Date(value);
  if (Number.isNaN(rendezVousDate.getTime())) {
    return null;
  }

  const diffMs = rendezVousDate.getTime() - Date.now();
  if (diffMs <= 0) {
    return null;
  }

  const totalMinutes = Math.floor(diffMs / 60000);
  const totalHours = Math.floor(totalMinutes / 60);
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  const minutes = totalMinutes % 60;

  if (days > 0) {
    return `Dans ${days} j ${hours} h`;
  }
  if (hours > 0) {
    return `Dans ${hours} h ${minutes} min`;
  }
  return `Dans ${minutes} min`;
}

function isPastRendezVous(rdv) {
  return ['done', 'cancelled', 'rejected'].includes(rdv.status);
}

function ListeRendezVousClient() {
  const [rendezVousList, setRendezVousList] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedRdv, setSelectedRdv] = useState(null);
  const [newDate, setNewDate] = useState('');
  const [newHeure, setNewHeure] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchRendezVous = async () => {
    try {
      setLoading(true);
      setError(null);
      setRendezVousList(await fetchRendezVousRequest());
    } catch (err) {
      console.error('Erreur lors de la récupération des rendez-vous client :', err);
      setError("Impossible de recuperer vos rendez-vous.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRendezVous();
  }, []);

  const handleCancel = async (rdv) => {
    if (!window.confirm('Voulez-vous vraiment annuler ce rendez-vous ?')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await updateRendezVousRequest(rdv.id, { status: 'cancelled' });
      await fetchRendezVous();
    } catch (err) {
      console.error("Erreur lors de l'annulation du rendez-vous :", err);
      setError("Impossible d'annuler ce rendez-vous.");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestModification = (rdv) => {
    setSelectedRdv(rdv);
    setNewDate('');
    setNewHeure('');
    setError(null);
    setShowModal(true);
  };

  const handleConfirmModification = async () => {
    if (!selectedRdv) {
      return;
    }

    if (!newDate || !newHeure) {
      setError('Veuillez indiquer une nouvelle date et une nouvelle heure.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await updateRendezVousRequest(selectedRdv.id, {
        date: `${newDate}T${newHeure}:00`,
        status: 'modification_requested',
      });
      await fetchRendezVous();
      setShowModal(false);
      setSelectedRdv(null);
    } catch (err) {
      console.error('Erreur lors de la demande de modification :', err);
      setError("Impossible d'envoyer la demande de reprogrammation.");
    } finally {
      setLoading(false);
    }
  };

  const sortedRendezVous = useMemo(() => {
    return [...rendezVousList].sort((left, right) => new Date(right.date) - new Date(left.date));
  }, [rendezVousList]);

  const upcomingRendezVous = useMemo(() => {
    return sortedRendezVous.filter((rdv) => !isPastRendezVous(rdv));
  }, [sortedRendezVous]);

  const historyRendezVous = useMemo(() => {
    return sortedRendezVous.filter((rdv) => isPastRendezVous(rdv));
  }, [sortedRendezVous]);

  const contactGarages = useMemo(() => {
    return Array.from(
      new Map(
        sortedRendezVous
          .filter((rdv) => rdv.garage && rdv.garage_name)
          .map((rdv) => [
            rdv.garage,
            {
              id: rdv.garage,
              name: rdv.garage_name,
              slug: rdv.garage_slug,
            },
          ])
      ).values()
    );
  }, [sortedRendezVous]);

  const stats = useMemo(() => {
    return {
      pending: upcomingRendezVous.filter((rdv) => rdv.status === 'pending').length,
      confirmed: upcomingRendezVous.filter((rdv) => rdv.status === 'confirmed').length,
      modification: upcomingRendezVous.filter((rdv) => rdv.status === 'modification_requested').length,
      history: historyRendezVous.length,
    };
  }, [historyRendezVous, upcomingRendezVous]);

  const renderRendezVousCard = (rdv) => {
    const statusLabel = getRendezVousStatusLabel(rdv.status);
    const remainingLabel = rdv.status === 'confirmed' ? getTimeRemainingLabel(rdv.date) : null;
    const canEdit = ['pending', 'confirmed'].includes(rdv.status);
    const canCancel = ['pending', 'confirmed', 'modification_requested'].includes(rdv.status);

    return (
      <Col xs={12} lg={6} key={rdv.id}>
        <Card className="shadow-sm border-0 h-100">
          <Card.Body>
            <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
              <div>
                <Card.Title className="mb-1">{rdv.garage_name || 'Garage'}</Card.Title>
                <div className="text-muted small">{formatDateTime(rdv.date)}</div>
              </div>
              <Badge bg={getRendezVousStatusVariant(rdv.status)}>{statusLabel}</Badge>
            </div>

            {remainingLabel && (
              <Alert variant="light" className="py-2 px-3 mb-3">
                <strong>Prochain rendez-vous :</strong> {remainingLabel}
              </Alert>
            )}

            <Row className="g-3">
              <Col md={6}>
                <div className="small text-muted">Service</div>
                <div>{rdv.service_details?.nom || 'Non precise'}</div>
              </Col>
              <Col md={6}>
                <div className="small text-muted">Vehicule</div>
                <div>
                  {rdv.vehicle
                    ? `${rdv.vehicle.marque} ${rdv.vehicle.modele} (${rdv.vehicle.annee})`
                    : 'Non precise'}
                </div>
              </Col>
              <Col md={6}>
                <div className="small text-muted">Devis</div>
                <div>{formatCurrency(rdv.quote)}</div>
              </Col>
              <Col md={6}>
                <div className="small text-muted">Duree estimee</div>
                <div>{rdv.estimatedTime ? `${rdv.estimatedTime} h` : '-'}</div>
              </Col>
            </Row>

            <div className="mt-3">
              <div className="small text-muted">Description</div>
              <div>{rdv.description || 'Aucune description fournie.'}</div>
            </div>

            {rdv.reason && (
              <div className="mt-3">
                <div className="small text-muted">Motif</div>
                <div>{rdv.reason}</div>
              </div>
            )}

            <div className="d-flex flex-wrap gap-2 mt-4">
              {rdv.garage_slug && (
                <Button as={Link} to={`/garage/${rdv.garage_slug}/reservation`} variant="outline-dark">
                  Voir le garage
                </Button>
              )}
              {canEdit && (
                <Button variant="primary" onClick={() => handleRequestModification(rdv)}>
                  Demander une reprogrammation
                </Button>
              )}
              {canCancel && (
                <Button variant="outline-danger" onClick={() => handleCancel(rdv)}>
                  Annuler
                </Button>
              )}
            </div>
          </Card.Body>
        </Card>
      </Col>
    );
  };

  return (
    <Container className="py-4">
      <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-end gap-3 mb-4">
        <div>
          <h2 className="mb-2">Mes rendez-vous</h2>
          <p className="text-muted mb-0">
            Suivez vos demandes, vos prochains rendez-vous et votre historique avec les garages contactes.
          </p>
        </div>
        <div className="d-flex flex-wrap gap-2">
          <Badge bg="warning" text="dark">En attente: {stats.pending}</Badge>
          <Badge bg="success">Confirmes: {stats.confirmed}</Badge>
          <Badge bg="info">Reprogrammation: {stats.modification}</Badge>
          <Badge bg="dark">Historique: {stats.history}</Badge>
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {loading && (
        <div className="d-flex align-items-center gap-2 mb-4">
          <Spinner animation="border" size="sm" />
          <span>Chargement en cours...</span>
        </div>
      )}

      {contactGarages.length > 0 && (
        <Card className="shadow-sm border-0 mb-4">
          <Card.Body>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h3 className="h5 mb-0">Garages deja contactes</h3>
              <span className="text-muted small">{contactGarages.length} garage(s)</span>
            </div>
            <Row className="g-3">
              {contactGarages.map((garage) => (
                <Col xs={12} md={6} lg={4} key={garage.id}>
                  <Card className="h-100 border">
                    <Card.Body>
                      <Card.Title className="h6">{garage.name}</Card.Title>
                      <div className="text-muted small mb-3">{garage.slug || 'Identifiant indisponible'}</div>
                      {garage.slug && (
                        <Button as={Link} to={`/garage/${garage.slug}/reservation`} variant="outline-primary">
                          Ouvrir la fiche
                        </Button>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card.Body>
        </Card>
      )}

      <Card className="shadow-sm border-0 mb-4">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h3 className="h5 mb-0">Rendez-vous a venir</h3>
            <span className="text-muted small">{upcomingRendezVous.length} element(s)</span>
          </div>

          {upcomingRendezVous.length > 0 ? (
            <Row className="g-4">
              {upcomingRendezVous.map((rdv) => renderRendezVousCard(rdv))}
            </Row>
          ) : (
            <Alert variant="light" className="mb-0">
              Vous n'avez aucun rendez-vous en cours. Vous pouvez rechercher un garage pour envoyer une nouvelle demande.
            </Alert>
          )}
        </Card.Body>
      </Card>

      <Card className="shadow-sm border-0">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h3 className="h5 mb-0">Historique</h3>
            <span className="text-muted small">{historyRendezVous.length} element(s)</span>
          </div>

          {historyRendezVous.length > 0 ? (
            <Row className="g-4">
              {historyRendezVous.map((rdv) => renderRendezVousCard(rdv))}
            </Row>
          ) : (
            <Alert variant="light" className="mb-0">
              Aucun rendez-vous passe pour le moment.
            </Alert>
          )}
        </Card.Body>
      </Card>

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Demander une reprogrammation</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedRdv && (
            <Alert variant="light">
              <strong>{selectedRdv.garage_name || 'Garage'}</strong>
              <div className="small text-muted">{formatDateTime(selectedRdv.date)}</div>
            </Alert>
          )}

          {error && <Alert variant="danger">{error}</Alert>}

          <Form>
            <Form.Group controlId="formNewDate" className="mb-3">
              <Form.Label>Nouvelle date</Form.Label>
              <Form.Control
                type="date"
                value={newDate}
                onChange={(event) => setNewDate(event.target.value)}
              />
            </Form.Group>
            <Form.Group controlId="formNewHeure">
              <Form.Label>Nouvelle heure</Form.Label>
              <Form.Control
                type="time"
                value={newHeure}
                onChange={(event) => setNewHeure(event.target.value)}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Fermer
          </Button>
          <Button variant="primary" onClick={handleConfirmModification}>
            Envoyer la demande
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default ListeRendezVousClient;
