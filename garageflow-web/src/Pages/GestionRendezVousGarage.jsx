import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Button, Card, Col, Container, Form, Row, Spinner } from 'react-bootstrap';
import { fetchGarageMecaniciensRequest } from '../api/mecaniciens';
import { fetchRendezVousRequest, updateRendezVousRequest } from '../api/rendezVous';

function flattenError(error) {
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

function formatDateTime(value) {
  if (!value) {
    return '-';
  }

  return new Intl.DateTimeFormat('fr-CA', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function statusLabel(status) {
  const labels = {
    pending: 'En attente',
    confirmed: 'Confirme',
    modification_requested: 'Reprogrammation demandee',
    rejected: 'Refuse',
    cancelled: 'Annule',
    done: 'Termine',
  };
  return labels[status] || status;
}

function GestionRendezVousGarage() {
  const [rendezVous, setRendezVous] = useState([]);
  const [mecaniciens, setMecaniciens] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [forms, setForms] = useState({});

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [rendezVousData, mecaniciensData] = await Promise.all([
        fetchRendezVousRequest(),
        fetchGarageMecaniciensRequest(),
      ]);
      setRendezVous(rendezVousData);
      setMecaniciens(mecaniciensData);
      setForms((current) => {
        const next = { ...current };
        rendezVousData.forEach((item) => {
          next[item.id] ??= {
            mecanicien: item.mecanicien || '',
            estimatedTime: item.estimatedTime || '',
            quote: item.quote || '',
            reason: item.reason || '',
            date: item.date ? item.date.slice(0, 10) : '',
            heure: item.date ? item.date.slice(11, 16) : '',
          };
        });
        return next;
      });
    } catch (requestError) {
      setError(requestError.response?.data || requestError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const pendingRendezVous = useMemo(
    () => rendezVous.filter((item) => item.status === 'pending' || item.status === 'modification_requested'),
    [rendezVous]
  );
  const confirmedRendezVous = useMemo(
    () => rendezVous.filter((item) => item.status === 'confirmed'),
    [rendezVous]
  );
  const closedRendezVous = useMemo(
    () => rendezVous.filter((item) => ['rejected', 'cancelled', 'done'].includes(item.status)),
    [rendezVous]
  );

  const handleFieldChange = (id, field, value) => {
    setForms((current) => ({
      ...current,
      [id]: {
        ...(current[id] || {}),
        [field]: value,
      },
    }));
  };

  const handleConfirm = async (rdv) => {
    const currentForm = forms[rdv.id] || {};
    try {
      setLoading(true);
      setError(null);
      setMessage(null);
      const updated = await updateRendezVousRequest(rdv.id, {
        status: 'confirmed',
        mecanicien: Number(currentForm.mecanicien),
        estimatedTime: currentForm.estimatedTime,
        quote: currentForm.quote,
        date: currentForm.date && currentForm.heure ? `${currentForm.date}T${currentForm.heure}:00` : rdv.date,
      });
      setRendezVous((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setMessage('Rendez-vous confirme et affecte.');
    } catch (requestError) {
      setError(requestError.response?.data || requestError);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (rdv) => {
    const currentForm = forms[rdv.id] || {};
    try {
      setLoading(true);
      setError(null);
      setMessage(null);
      const updated = await updateRendezVousRequest(rdv.id, {
        status: 'rejected',
        reason: currentForm.reason,
      });
      setRendezVous((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setMessage('Demande refusee.');
    } catch (requestError) {
      setError(requestError.response?.data || requestError);
    } finally {
      setLoading(false);
    }
  };

  const handleDone = async (rdv) => {
    try {
      setLoading(true);
      setError(null);
      setMessage(null);
      const updated = await updateRendezVousRequest(rdv.id, { status: 'done' });
      setRendezVous((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setMessage('Rendez-vous marque comme termine.');
    } catch (requestError) {
      setError(requestError.response?.data || requestError);
    } finally {
      setLoading(false);
    }
  };

  const renderCard = (rdv, showActions) => {
    const currentForm = forms[rdv.id] || {};

    return (
      <Col md={6} xl={4} key={rdv.id}>
        <Card className="shadow-sm h-100">
          <Card.Body>
            <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
              <div>
                <Card.Title className="mb-1">{formatDateTime(rdv.date)}</Card.Title>
                <div className="text-muted small">{statusLabel(rdv.status)}</div>
              </div>
              <Badge bg={rdv.status === 'confirmed' ? 'success' : rdv.status === 'pending' ? 'warning' : 'secondary'}>
                {statusLabel(rdv.status)}
              </Badge>
            </div>

            <p className="mb-2"><strong>Client :</strong> {rdv.client_name || rdv.client}</p>
            <p className="mb-2"><strong>Courriel :</strong> {rdv.client_email || '-'}</p>
            <p className="mb-2"><strong>Garage :</strong> {rdv.garage_name || '-'}</p>
            <p className="mb-2"><strong>Service :</strong> {rdv.service_details?.nom || '-'}</p>
            <p className="mb-2"><strong>Vehicule :</strong> {rdv.vehicle ? `${rdv.vehicle.marque} ${rdv.vehicle.modele}` : '-'}</p>
            <p className="mb-3"><strong>Demande :</strong> {rdv.description || 'Sans description'}</p>

            {rdv.mecanicien && (
              <p className="mb-2"><strong>Mecanicien affecte :</strong> #{rdv.mecanicien}</p>
            )}
            {rdv.estimatedTime && (
              <p className="mb-2"><strong>Duree estimee :</strong> {rdv.estimatedTime} h</p>
            )}
            {rdv.quote && (
              <p className="mb-3"><strong>Devis :</strong> {rdv.quote}</p>
            )}
            {rdv.reason && (
              <p className="mb-3"><strong>Raison :</strong> {rdv.reason}</p>
            )}

            {showActions && (
              <>
                <Form.Group className="mb-3">
                  <Form.Label>Mecanicien</Form.Label>
                  <Form.Select
                    value={currentForm.mecanicien || ''}
                    onChange={(event) => handleFieldChange(rdv.id, 'mecanicien', event.target.value)}
                  >
                    <option value="">Selectionnez un mecanicien</option>
                    {mecaniciens.map((mecanicien) => (
                      <option key={mecanicien.id} value={mecanicien.id}>
                        {`${mecanicien.first_name || ''} ${mecanicien.last_name || ''}`.trim() || mecanicien.username}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <Row>
                  <Col sm={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Date planifiee</Form.Label>
                      <Form.Control
                        type="date"
                        value={currentForm.date || ''}
                        onChange={(event) => handleFieldChange(rdv.id, 'date', event.target.value)}
                      />
                    </Form.Group>
                  </Col>

                  <Col sm={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Heure planifiee</Form.Label>
                      <Form.Control
                        type="time"
                        value={currentForm.heure || ''}
                        onChange={(event) => handleFieldChange(rdv.id, 'heure', event.target.value)}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col sm={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Duree estimee</Form.Label>
                      <Form.Control
                        value={currentForm.estimatedTime || ''}
                        onChange={(event) => handleFieldChange(rdv.id, 'estimatedTime', event.target.value)}
                        placeholder="1.50"
                      />
                    </Form.Group>
                  </Col>

                  <Col sm={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Devis</Form.Label>
                      <Form.Control
                        value={currentForm.quote || ''}
                        onChange={(event) => handleFieldChange(rdv.id, 'quote', event.target.value)}
                        placeholder="120.00"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Raison du refus</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={currentForm.reason || ''}
                    onChange={(event) => handleFieldChange(rdv.id, 'reason', event.target.value)}
                    placeholder="Precisez la raison si vous refusez la demande"
                  />
                </Form.Group>

                <div className="d-flex flex-wrap gap-2">
                  <Button variant="success" onClick={() => handleConfirm(rdv)} disabled={loading}>
                    Confirmer
                  </Button>
                  <Button variant="outline-danger" onClick={() => handleReject(rdv)} disabled={loading}>
                    Refuser
                  </Button>
                  {rdv.status === 'confirmed' && (
                    <Button variant="outline-dark" onClick={() => handleDone(rdv)} disabled={loading}>
                      Marquer termine
                    </Button>
                  )}
                </div>
              </>
            )}

            {!showActions && rdv.status === 'confirmed' && (
              <Button variant="outline-dark" onClick={() => handleDone(rdv)} disabled={loading}>
                Marquer termine
              </Button>
            )}
          </Card.Body>
        </Card>
      </Col>
    );
  };

  return (
    <Container className="py-5">
      <div className="d-flex justify-content-between align-items-start gap-3 mb-4">
        <div>
          <h1 className="mb-2">Gestion des rendez-vous</h1>
          <p className="text-muted mb-0">
            Traitez les demandes clients, affectez un mecanicien et suivez l'avancement du garage.
          </p>
        </div>
        {loading && <Spinner animation="border" size="sm" />}
      </div>

      {message && <Alert variant="success">{message}</Alert>}
      {error && <Alert variant="danger">{flattenError(error)}</Alert>}

      <section className="mb-5">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2 className="h4 mb-0">Demandes a traiter</h2>
          <Badge bg="warning" text="dark">{pendingRendezVous.length}</Badge>
        </div>
        <Row className="g-4">
          {pendingRendezVous.map((rdv) => renderCard(rdv, true))}
        </Row>
        {pendingRendezVous.length === 0 && (
          <Card className="shadow-sm">
            <Card.Body>Aucune demande en attente pour le moment.</Card.Body>
          </Card>
        )}
      </section>

      <section className="mb-5">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2 className="h4 mb-0">Rendez-vous confirmes</h2>
          <Badge bg="success">{confirmedRendezVous.length}</Badge>
        </div>
        <Row className="g-4">
          {confirmedRendezVous.map((rdv) => renderCard(rdv, false))}
        </Row>
        {confirmedRendezVous.length === 0 && (
          <Card className="shadow-sm">
            <Card.Body>Aucun rendez-vous confirme.</Card.Body>
          </Card>
        )}
      </section>

      <section>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2 className="h4 mb-0">Historique recent</h2>
          <Badge bg="secondary">{closedRendezVous.length}</Badge>
        </div>
        <Row className="g-4">
          {closedRendezVous.map((rdv) => renderCard(rdv, false))}
        </Row>
        {closedRendezVous.length === 0 && (
          <Card className="shadow-sm">
            <Card.Body>Aucun rendez-vous clos pour le moment.</Card.Body>
          </Card>
        )}
      </section>
    </Container>
  );
}

export default GestionRendezVousGarage;
