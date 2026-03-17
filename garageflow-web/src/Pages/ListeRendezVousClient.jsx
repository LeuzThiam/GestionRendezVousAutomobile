// src/components/ListeRendezVousClient.js

import React, { useState, useEffect } from 'react';
import { Card, Button, Modal, Form, Container, Row, Col, Alert } from 'react-bootstrap';
import { fetchRendezVousRequest, updateRendezVousRequest } from '../api/rendezVous';

function ListeRendezVousClient() {
  const [rendezVousList, setRendezVousList] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedRdv, setSelectedRdv] = useState(null);
  const [newDate, setNewDate] = useState('');
  const [newHeure, setNewHeure] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // 1) Charger la liste (filtrée côté back-end pour le client connecté)
  const fetchRendezVous = async () => {
    try {
      setLoading(true);
      setError(null);
      setRendezVousList(await fetchRendezVousRequest());
    } catch (err) {
      console.error('Erreur lors de la récupération de la liste (client) :', err);
      setError("Impossible de récupérer la liste de rendez-vous.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRendezVous();
  }, []);

  // 2) Annuler un RDV => PATCH status='cancelled'
  const handleCancel = async (rdv) => {
    if (!window.confirm('Voulez-vous vraiment annuler ce rendez-vous ?')) return;
    try {
      setLoading(true);
      await updateRendezVousRequest(rdv.id, { status: 'cancelled' });
      await fetchRendezVous();
    } catch (err) {
      console.error("Erreur lors de l'annulation du RDV :", err);
      setError("Impossible d'annuler ce rendez-vous.");
    } finally {
      setLoading(false);
    }
  };

  // 3) Demander une modification => ouvre le modal
  const handleRequestModification = (rdv) => {
    setSelectedRdv(rdv);
    setNewDate('');
    setNewHeure('');
    setShowModal(true);
    setError(null);
  };

  // 4) Confirmer la modification
  //    => On passe date = newDateTime, status = 'modification_requested'
  //    => Le mécanicien devra valider ou refuser cette nouvelle date
  const handleConfirmModification = async () => {
    if (!selectedRdv) return;
    if (!newDate || !newHeure) {
      setError('Veuillez indiquer la nouvelle date ET la nouvelle heure.');
      return;
    }

    const newDateTime = `${newDate}T${newHeure}:00`;
    try {
      setLoading(true);
      await updateRendezVousRequest(selectedRdv.id, {
        date: newDateTime,
        status: 'modification_requested',
      });
      await fetchRendezVous();
      setShowModal(false);
      setSelectedRdv(null);
    } catch (err) {
      console.error('Erreur lors de la modification du RDV :', err);
      setError("Impossible d'envoyer la demande de modification.");
    } finally {
      setLoading(false);
    }
  };

  // 5) Filtrage local
  const pendingRdv = rendezVousList.filter((r) => r.status === 'pending');
  const modificationRdv = rendezVousList.filter((r) => r.status === 'modification_requested');
  const confirmedRdv = rendezVousList.filter((r) => r.status === 'confirmed');
  const cancelledRdv = rendezVousList.filter(
    (r) => r.status === 'cancelled' || r.status === 'refused' || r.status === 'rejected'
  );

  return (
    <Container className="mt-5">
      <h2 className="text-center mb-4">Mes Rendez-vous (Client)</h2>
      {error && <Alert variant="danger">{error}</Alert>}
      {loading && <Alert variant="info">Chargement en cours...</Alert>}

      {/* Rendez-vous en attente */}
      <h3 className="text-warning">Rendez-vous en attente</h3>
      <Row>
        {pendingRdv.map((rdv) => (
          <Col xs={12} md={6} lg={4} key={rdv.id}>
            <Card className="mb-3">
              <Card.Header className="bg-warning text-dark">
                Rendez-vous du {rdv.date}
              </Card.Header>
              <Card.Body>
                <p><strong>Status:</strong> {rdv.status}</p>
                <p><strong>Description:</strong> {rdv.description || 'Aucune description'}</p>
                <div className="d-flex justify-content-between">
                  <Button variant="danger" onClick={() => handleCancel(rdv)}>
                    Annuler
                  </Button>
                  <Button variant="primary" onClick={() => handleRequestModification(rdv)}>
                    Modifier
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Rendez-vous en cours de modification (en attente de re-confirmation du mécanicien) */}
      <h3 className="text-info mt-4">Rendez-vous en modification</h3>
      <Row>
        {modificationRdv.map((rdv) => (
          <Col xs={12} md={6} lg={4} key={rdv.id}>
            <Card className="mb-3">
              <Card.Header className="bg-info text-dark">
                Rendez-vous du {rdv.date}
              </Card.Header>
              <Card.Body>
                <p><strong>Status:</strong> {rdv.status}</p>
                <p><strong>Description:</strong> {rdv.description || 'Aucune description'}</p>
                {/* Possibilité d'annuler quand même */}
                <Button variant="danger" onClick={() => handleCancel(rdv)}>
                  Annuler
                </Button>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Rendez-vous confirmés */}
      <h3 className="text-success mt-4">Rendez-vous confirmés</h3>
      <Row>
        {confirmedRdv.map((rdv) => (
          <Col xs={12} md={6} lg={4} key={rdv.id}>
            <Card className="mb-3">
              <Card.Header className="bg-success text-white">
                Rendez-vous du {rdv.date}
              </Card.Header>
              <Card.Body>
                <p><strong>Status:</strong> {rdv.status}</p>
                <p><strong>Description:</strong> {rdv.description || 'Aucune description'}</p>
                <p><strong>Durée estimée:</strong> {rdv.estimatedTime || '-'} h</p>
                <p><strong>Devis:</strong> {rdv.quote || '-'} €</p>
                <div className="d-flex justify-content-between">
                  <Button variant="danger" onClick={() => handleCancel(rdv)}>
                    Annuler
                  </Button>
                  {/* Même si c'est confirmé, le client peut re-demander une modif */}
                  <Button variant="primary" onClick={() => handleRequestModification(rdv)}>
                    Modifier
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Rendez-vous annulés / refusés */}
      <h3 className="text-danger mt-4">Rendez-vous annulés / refusés</h3>
      <Row>
        {cancelledRdv.map((rdv) => (
          <Col xs={12} md={6} lg={4} key={rdv.id}>
            <Card className="mb-3">
              <Card.Header className="bg-danger text-white">
                Rendez-vous {rdv.status} du {rdv.date}
              </Card.Header>
              <Card.Body>
                <p><strong>Status:</strong> {rdv.status}</p>
                <p><strong>Description:</strong> {rdv.description || 'Aucune description'}</p>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Modal de modification */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Demande de modification</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          <Form>
            <Form.Group controlId="formNewDate" className="mb-3">
              <Form.Label>Nouvelle Date</Form.Label>
              <Form.Control
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
              />
            </Form.Group>
            <Form.Group controlId="formNewHeure" className="mb-3">
              <Form.Label>Nouvelle Heure</Form.Label>
              <Form.Control
                type="time"
                value={newHeure}
                onChange={(e) => setNewHeure(e.target.value)}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Fermer
          </Button>
          <Button variant="primary" onClick={handleConfirmModification}>
            Confirmer
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default ListeRendezVousClient;
