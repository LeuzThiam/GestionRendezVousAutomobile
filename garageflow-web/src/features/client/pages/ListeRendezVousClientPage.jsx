import React, { useEffect, useMemo, useState } from 'react';
import { Badge, Button, Card, Col, Container, Form, Modal, Row } from 'react-bootstrap';
import { fetchRendezVousRequest, updateRendezVousRequest } from '../api';
import { getRendezVousStatusLabel, getRendezVousStatusVariant } from '../../rendezvous/utils/status';
import { EmptyState, ErrorState, LoadingState, PageHeader, SectionCard, StatBadgeGroup } from '../../../shared/ui';
import ClientRendezVousCard from '../components/ClientRendezVousCard';

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
        requested_date: `${newDate}T${newHeure}:00`,
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

  return (
    <Container className="py-4">
      <PageHeader
        title="Mes rendez-vous"
        description="Suivez vos demandes, vos prochains rendez-vous et votre historique avec les garages contactes."
        actions={(
          <StatBadgeGroup
            items={[
              { label: 'En attente', value: stats.pending, bg: 'warning', text: 'dark' },
              { label: 'Confirmes', value: stats.confirmed, bg: 'success' },
              { label: 'Reprogrammation', value: stats.modification, bg: 'info' },
              { label: 'Historique', value: stats.history, bg: 'dark' },
            ]}
          />
        )}
      />

      <ErrorState>{error}</ErrorState>
      {loading && <LoadingState label="Chargement en cours..." />}

      {contactGarages.length > 0 && (
        <SectionCard
          className="shadow-sm border-0 mb-4"
          title="Garages deja contactes"
          subtitle={`${contactGarages.length} garage(s)`}
        >
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
        </SectionCard>
      )}

      <SectionCard
        className="shadow-sm border-0 mb-4"
        title="Rendez-vous a venir"
        subtitle={`${upcomingRendezVous.length} element(s)`}
      >
          {upcomingRendezVous.length > 0 ? (
            <Row className="g-4">
              {upcomingRendezVous.map((rdv) => (
                <Col xs={12} lg={6} key={rdv.id}>
                  <ClientRendezVousCard
                    rdv={rdv}
                    formatCurrency={formatCurrency}
                    formatDateTime={formatDateTime}
                    getTimeRemainingLabel={getTimeRemainingLabel}
                    getRendezVousStatusLabel={getRendezVousStatusLabel}
                    getRendezVousStatusVariant={getRendezVousStatusVariant}
                    onCancel={handleCancel}
                    onRequestModification={handleRequestModification}
                  />
                </Col>
              ))}
            </Row>
          ) : (
            <EmptyState>
              Vous n'avez aucun rendez-vous en cours. Vous pouvez rechercher un garage pour envoyer une nouvelle demande.
            </EmptyState>
          )}
      </SectionCard>

      <SectionCard
        className="shadow-sm border-0"
        title="Historique"
        subtitle={`${historyRendezVous.length} element(s)`}
      >
          {historyRendezVous.length > 0 ? (
            <Row className="g-4">
              {historyRendezVous.map((rdv) => (
                <Col xs={12} lg={6} key={rdv.id}>
                  <ClientRendezVousCard
                    rdv={rdv}
                    formatCurrency={formatCurrency}
                    formatDateTime={formatDateTime}
                    getTimeRemainingLabel={getTimeRemainingLabel}
                    getRendezVousStatusLabel={getRendezVousStatusLabel}
                    getRendezVousStatusVariant={getRendezVousStatusVariant}
                    onCancel={handleCancel}
                    onRequestModification={handleRequestModification}
                  />
                </Col>
              ))}
            </Row>
          ) : (
            <EmptyState>
              Aucun rendez-vous passe pour le moment.
            </EmptyState>
          )}
      </SectionCard>

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Demander une reprogrammation</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedRdv && (
            <EmptyState>
              <strong>{selectedRdv.garage_name || 'Garage'}</strong>
              <div className="small text-muted">Creneau actuel : {formatDateTime(selectedRdv.date)}</div>
            </EmptyState>
          )}

          <ErrorState>{error}</ErrorState>

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
