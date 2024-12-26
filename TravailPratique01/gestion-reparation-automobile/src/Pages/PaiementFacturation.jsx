// src/Pages/PaiementFacturation.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Form, Button, Container, Alert } from 'react-bootstrap';

function PaiementFacturation() {
  // États liés au paiement
  const [cardNumber, setCardNumber] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [amount, setAmount] = useState('');

  // États liés au succès de paiement / facture
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [invoice, setInvoice] = useState(null);
  const [error, setError] = useState(null);

  // Pour éventuellement sauvegarder la carte
  const [saveInfo, setSaveInfo] = useState(false);

  // Sélection du rendez-vous confirmé
  const [selectedRdvId, setSelectedRdvId] = useState('');

  // Liste de tous les rendez-vous
  const [rendezVousList, setRendezVousList] = useState([]);

  // useEffect pour récupérer la liste des RendezVous depuis l'API
  useEffect(() => {
    axios
      .get('http://127.0.0.1:8000/api/rendezvous/', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`, // si JWT
        },
      })
      .then((res) => {
        console.log('Liste RendezVous:', res.data);
        setRendezVousList(res.data);
      })
      .catch((err) => {
        console.error(err);
        setError("Impossible de récupérer la liste des rendez-vous.");
      });
  }, []);

  // Filtrer ceux qui sont confirmés
  const confirmedAppointments = rendezVousList.filter(
    (rdv) => rdv.status === 'confirmed' || rdv.status === 'confirmé'
  );

  // Trouver le rendez-vous sélectionné
  const selectedRendezVous = confirmedAppointments.find(
    (rdv) => rdv.id === parseInt(selectedRdvId, 10)
  );

  const handlePayment = async (e) => {
    e.preventDefault();
    setError(null);

    // Vérifier qu'on a bien un rendez-vous sélectionné
    if (!selectedRdvId || !selectedRendezVous) {
      setError('Veuillez sélectionner un rendez-vous confirmé.');
      return;
    }

    // Vérifier les champs
    if (!cardNumber || !expirationDate || !cvv || !amount) {
      setError('Tous les champs sont obligatoires.');
      return;
    }
    if (isNaN(amount) || parseFloat(amount) <= 0) {
      setError('Veuillez entrer un montant valide.');
      return;
    }

    // Construire l'objet pour la facture
    const factureData = {
      // Champs que votre API attend pour créer une Facture
      // Par exemple :
      rendezvous: selectedRendezVous.id,   // ID du RendezVous
      montant: parseFloat(amount),
      card_number: cardNumber,            // ou cardNumber.slice(-4), selon la logique
      expiration_date: expirationDate,
      cvv: cvv,
      // vous pouvez inclure d’autres champs selon votre modèle Facture (mode_paiement, payee, etc.)
    };

    try {
      // Envoyer la requête POST /api/factures/ pour créer la facture en base
      const response = await axios.post(
        'http://127.0.0.1:8000/api/factures/',
        factureData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
        }
      );

      // Réponse successful, on a la facture créée
      console.log('Facture créée :', response.data);
      setInvoice(response.data);      // Stocker l'info de la facture renvoyée par l'API
      setPaymentSuccess(true);

      // Réinitialiser les champs
      setSelectedRdvId('');
      setCardNumber('');
      setExpirationDate('');
      setCvv('');
      setAmount('');
    } catch (err) {
      console.error(err);
      setError("Impossible d'enregistrer la facture/paiement.");
    }
  };

  return (
    <Container className="mt-5">
      <h2>Paiement et Facturation</h2>

      {/* Si paiement réussi, afficher un récapitulatif */}
      {paymentSuccess && invoice ? (
        <div>
          <Alert variant="success">Paiement réussi !</Alert>
          <h4>Facture créée :</h4>
          <p><strong>ID facture :</strong> {invoice.id}</p>
          <p><strong>RendezVous :</strong> {invoice.rendezvous}</p>
          <p><strong>Montant :</strong> {invoice.montant} €</p>
          {/* Selon le serializer, vous aurez peut-être date_emission, payee, etc. */}
          <p>(D'autres champs si votre API les renvoie)</p>
        </div>
      ) : (
        // Sinon, le formulaire de paiement
        <Form onSubmit={handlePayment}>
          {error && <Alert variant="danger">{error}</Alert>}

          {/* Sélection du RDV confirmé */}
          <Form.Group controlId="formRdvId" className="mb-3">
            <Form.Label>Sélectionnez un rendez-vous confirmé</Form.Label>
            <Form.Control
              as="select"
              value={selectedRdvId}
              onChange={(e) => setSelectedRdvId(e.target.value)}
            >
              <option value="">-- Choisir --</option>
              {confirmedAppointments.map((rdv) => (
                <option key={rdv.id} value={rdv.id}>
                  RendezVous #{rdv.id} - Vehicule: {rdv.vehicle?.marque} {rdv.vehicle?.modele}
                </option>
              ))}
            </Form.Control>
          </Form.Group>

          {/* Affichage des infos du rdv si sélectionné */}
          {selectedRendezVous && (
            <div className="mb-3 p-2 border rounded">
              <p><strong>RendezVous #{selectedRendezVous.id}</strong></p>
              <p>Véhicule : {selectedRendezVous.vehicle?.marque} {selectedRendezVous.vehicle?.modele}</p>
              <p>Symptômes : {selectedRendezVous.symptomes}</p>
              <p>Date : {selectedRendezVous.date}</p>
            </div>
          )}

          {/* Infos de carte */}
          <Form.Group controlId="formCardNumber" className="mb-3">
            <Form.Label>Numéro de carte</Form.Label>
            <Form.Control
              type="text"
              placeholder="Numéro de carte"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
            />
          </Form.Group>

          <Form.Group controlId="formExpirationDate" className="mb-3">
            <Form.Label>Date d'expiration (MM/AA)</Form.Label>
            <Form.Control
              type="text"
              placeholder="MM/AA"
              value={expirationDate}
              onChange={(e) => setExpirationDate(e.target.value)}
            />
          </Form.Group>

          <Form.Group controlId="formCvv" className="mb-3">
            <Form.Label>CVV</Form.Label>
            <Form.Control
              type="text"
              placeholder="CVV"
              value={cvv}
              onChange={(e) => setCvv(e.target.value)}
            />
          </Form.Group>

          <Form.Group controlId="formAmount" className="mb-3">
            <Form.Label>Montant</Form.Label>
            <Form.Control
              type="text"
              placeholder="Montant à payer"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </Form.Group>

          <Form.Group controlId="formSaveInfo" className="mb-3">
            <Form.Check
              type="checkbox"
              label="Sauvegarder cette carte pour de futurs paiements"
              checked={saveInfo}
              onChange={() => setSaveInfo(!saveInfo)}
            />
          </Form.Group>

          <Button variant="primary" type="submit">
            Payer
          </Button>
        </Form>
      )}
    </Container>
  );
}

export default PaiementFacturation;
