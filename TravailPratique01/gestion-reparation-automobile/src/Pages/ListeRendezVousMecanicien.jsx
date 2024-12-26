import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, Button, Modal, Form, Container, Row, Col, Alert } from 'react-bootstrap';

function ListeRendezVousMecanicien() {
  const [rendezVousList, setRendezVousList] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Pour gérer l'approbation de la modification
  const [showModal, setShowModal] = useState(false);
  const [selectedRdv, setSelectedRdv] = useState(null);

  /**
   * 1) Charger les RDV du mécanicien
   */
  const fetchRendezVous = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get('http://127.0.0.1:8000/api/rendezvous/', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setRendezVousList(res.data);
    } catch (err) {
      console.error('Erreur lors du fetch (mécanicien) :', err);
      setError("Impossible de récupérer la liste des rendez-vous (Mécanicien).");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRendezVous();
  }, []);

  /**
   * 2) Filtrer localement
   */
  const pendingRdv = rendezVousList.filter((rdv) => rdv.status === 'pending');
  const modifRequestedRdv = rendezVousList.filter((rdv) => rdv.status === 'modification_requested');
  const confirmedRdv = rendezVousList.filter((rdv) => rdv.status === 'confirmed');
  const rejectedRdv = rendezVousList.filter((rdv) => rdv.status === 'rejected');
  const cancelledRdv = rendezVousList.filter((rdv) => rdv.status === 'cancelled');

  /**
   * 3) Refuser un RDV => status='rejected'
   */
  const handleRefuse = async (rdv) => {
    const reason = prompt('Veuillez spécifier la raison du refus :', rdv.reason || '');
    if (reason === null) return; // L'utilisateur a cliqué sur "Annuler" dans le prompt

    try {
      setLoading(true);
      await axios.patch(
        `http://127.0.0.1:8000/api/rendezvous/${rdv.id}/`,
        { status: 'rejected', reason },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      // Actualiser localement
      setRendezVousList((prev) =>
        prev.map((r) => (r.id === rdv.id ? { ...r, status: 'rejected', reason } : r))
      );
    } catch (err) {
      console.error('Erreur lors du refus du RDV :', err);
      setError("Impossible de refuser ce rendez-vous.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * 4) Accepter un RDV => status='confirmed' + estimatedTime + quote
   */
  const handleAccept = async (rdv) => {
    // Valeur par défaut dans le prompt
    const defTime = rdv.estimatedTime ? String(rdv.estimatedTime) : '';
    const defQuote = rdv.quote ? String(rdv.quote) : '';

    const timeStr = prompt('Durée estimée (h) :', defTime);
    if (timeStr === null) return; // Si l'utilisateur annule le prompt

    const quoteStr = prompt('Devis (€) :', defQuote);
    if (quoteStr === null) return; // Annule le prompt

    // Convertir en nombre (ou laisser en string si l'API attend un string)
    const estimatedTime = parseFloat(timeStr);
    const quote = parseFloat(quoteStr);

    // Vérifier si c'est un nombre valide
    if (isNaN(estimatedTime) || isNaN(quote)) {
      alert('Veuillez saisir des valeurs numériques valides pour la durée et le devis.');
      return;
    }

    try {
      setLoading(true);
      await axios.patch(
        `http://127.0.0.1:8000/api/rendezvous/${rdv.id}/`,
        {
          status: 'confirmed',
          estimatedTime,
          quote,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      // Actualiser localement dans l'état
      setRendezVousList((prev) =>
        prev.map((r) =>
          r.id === rdv.id
            ? { ...r, status: 'confirmed', estimatedTime, quote }
            : r
        )
      );
    } catch (err) {
      console.error("Erreur lors de l'acceptation :", err);
      setError("Impossible d'accepter ce rendez-vous.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * 5) Gérer la "demande de modification" => status='modification_requested'
   */
  const handleCheckModification = (rdv) => {
    setSelectedRdv(rdv);
    setShowModal(true);
  };

  /**
   * 6) Accepter la nouvelle date => PATCH => { date, status='confirmed' }
   */
  const handleAcceptModification = async () => {
    if (!selectedRdv) return;

    try {
      setLoading(true);
      // On repasse le statut à "confirmed" (et on garde la date modifiée par le client)
      await axios.patch(
        `http://127.0.0.1:8000/api/rendezvous/${selectedRdv.id}/`,
        {
          date: selectedRdv.date,
          status: 'confirmed',
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      // Mise à jour local
      setRendezVousList((prev) =>
        prev.map((r) =>
          r.id === selectedRdv.id
            ? { ...r, status: 'confirmed' } // On garde la date déjà modifiée côté API
            : r
        )
      );
      setShowModal(false);
      setSelectedRdv(null);
    } catch (err) {
      console.error("Erreur lors de l'acceptation de la modif :", err);
      setError("Impossible d'accepter la modification.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * 7) Refuser la nouvelle date => on repasse 'confirmed' sans toucher la date
   */
  const handleRefuseModification = async () => {
    if (!selectedRdv) return;

    try {
      setLoading(true);
      // Annuler la modif => re-statut 'confirmed'
      await axios.patch(
        `http://127.0.0.1:8000/api/rendezvous/${selectedRdv.id}/`,
        {
          // date: oldDate si vous voulez la restaurer,
          status: 'confirmed',
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      setRendezVousList((prev) =>
        prev.map((r) =>
          r.id === selectedRdv.id
            ? { ...r, status: 'confirmed' }
            : r
        )
      );
      setShowModal(false);
      setSelectedRdv(null);
    } catch (err) {
      console.error('Erreur lors du refus de la modif :', err);
      setError("Impossible de refuser la modification.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="mt-5">
      <h2 className="text-center mb-4">Gestion des Rendez-vous (Mécanicien)</h2>
      {error && <Alert variant="danger">{error}</Alert>}
      {loading && <Alert variant="info">Chargement en cours...</Alert>}

      {/* RDV en attente */}
      <h3 className="text-warning">Rendez-vous en attente</h3>
      <Row>
        {pendingRdv.map((rdv) => (
          <Col xs={12} md={6} lg={4} key={rdv.id}>
            <Card className="mb-3">
              <Card.Header className="bg-warning text-dark">
                Rendez-vous du {rdv.date}
              </Card.Header>
              <Card.Body>
                <p><strong>Symptômes :</strong> {rdv.description || 'Aucune description'}</p>
                <div className="d-flex justify-content-between">
                  <Button variant="success" onClick={() => handleAccept(rdv)}>
                    Accepter
                  </Button>
                  <Button variant="danger" onClick={() => handleRefuse(rdv)}>
                    Refuser
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* RDV en demande de modification */}
      <h3 className="text-info mt-4">Rendez-vous à valider (modification demandée)</h3>
      <Row>
        {modifRequestedRdv.map((rdv) => (
          <Col xs={12} md={6} lg={4} key={rdv.id}>
            <Card className="mb-3">
              <Card.Header className="bg-info text-dark">
                Rendez-vous du {rdv.date}
              </Card.Header>
              <Card.Body>
                <p><strong>Status:</strong> {rdv.status}</p>
                <p><strong>Symptômes:</strong> {rdv.description || 'Aucune description'}</p>
                <p><em>Le client propose une nouvelle date/heure</em></p>
                <div className="d-flex justify-content-between">
                  <Button variant="success" onClick={() => handleCheckModification(rdv)}>
                    Voir détails
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* RDV confirmés */}
      <h3 className="text-success mt-4">Rendez-vous confirmés</h3>
      <Row>
        {confirmedRdv.map((rdv) => (
          <Col xs={12} md={6} lg={4} key={rdv.id}>
            <Card className="mb-3">
              <Card.Header className="bg-success text-white">
                Rendez-vous confirmé du {rdv.date}
              </Card.Header>
              <Card.Body>
                <p><strong>Symptômes:</strong> {rdv.description || 'N/A'}</p>
                <p><strong>Durée estimée:</strong> {rdv.estimatedTime || '-'} h</p>
                <p><strong>Devis:</strong> {rdv.quote || '-'} €</p>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* RDV refusés */}
      <h3 className="text-danger mt-4">Rendez-vous refusés</h3>
      <Row>
        {rejectedRdv.map((rdv) => (
          <Col xs={12} md={6} lg={4} key={rdv.id}>
            <Card className="mb-3">
              <Card.Header className="bg-danger text-white">
                Rendez-vous refusé du {rdv.date}
              </Card.Header>
              <Card.Body>
                <p><strong>Symptômes:</strong> {rdv.description || 'N/A'}</p>
                {rdv.reason && <p><strong>Raison du refus:</strong> {rdv.reason}</p>}
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* RDV annulés */}
      <h3 className="text-secondary mt-4">Rendez-vous annulés</h3>
      <Row>
        {cancelledRdv.map((rdv) => (
          <Col xs={12} md={6} lg={4} key={rdv.id}>
            <Card className="mb-3">
              <Card.Header className="bg-secondary text-white">
                Rendez-vous annulé du {rdv.date}
              </Card.Header>
              <Card.Body>
                <p><strong>Symptômes:</strong> {rdv.description || 'N/A'}</p>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Modal pour approuver/refuser la nouvelle date */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Valider la demande de modification ?</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          {selectedRdv && (
            <>
              <p>
                <strong>Nouvelle Date/Heure proposée :</strong> {selectedRdv.date}
              </p>
              <p>
                <em>Si vous acceptez, la date du RDV passera à ce nouveau créneau.</em>
              </p>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Fermer
          </Button>
          <Button variant="danger" onClick={handleRefuseModification}>
            Refuser la modif
          </Button>
          <Button variant="success" onClick={handleAcceptModification}>
            Accepter la modif
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default ListeRendezVousMecanicien;
