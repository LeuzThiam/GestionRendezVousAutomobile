// src/components/RendezVous.js

import React, { useState, useEffect } from 'react';
import { Form, Button, Container, Row, Col, Alert, Spinner } from 'react-bootstrap';
import { createRendezVousRequest } from '../shared/api/rendezVousApi';
import { fetchMecaniciensRequest } from '../shared/api/mecanicienApi';
import { fetchVehiculesRequest } from '../shared/api/vehiculeApi';

function RendezVous() {
  const [date, setDate] = useState('');
  const [heure, setHeure] = useState('');
  const [symptomes, setSymptomes] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [selectedMecanicien, setSelectedMecanicien] = useState('');
  const [success, setSuccess] = useState(null);
  const [mecaniciens, setMecaniciens] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [vehiclesLoading, setVehiclesLoading] = useState(false);
  const [error, setError] = useState(null);
  const [vehiclesError, setVehiclesError] = useState(null);

  // Charger les véhicules et les mécaniciens au montage
  useEffect(() => {
    async function loadData() {
      try {
        setVehiclesLoading(true);
        setVehiclesError(null);
        const [vehiclesData, mecaniciensData] = await Promise.all([
          fetchVehiculesRequest(),
          fetchMecaniciensRequest(),
        ]);
        setVehicles(vehiclesData);
        setMecaniciens(mecaniciensData);
      } catch {
        setVehiclesError("Impossible de charger les donnees de reservation.");
      } finally {
        setVehiclesLoading(false);
      }
    }

    loadData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess(null);

    // Vérif champs requis
    if (!selectedVehicle || !date || !heure || !symptomes || !selectedMecanicien) {
      setError('Veuillez remplir tous les champs requis.');
      return;
    }

    // Vérifier que le véhicule existe
    const vehicle = vehicles.find((v) => v.id === parseInt(selectedVehicle, 10));
    if (!vehicle) {
      setError('Le vehicule selectionne est introuvable.');
      return;
    }

    // Préparer les données pour l’API
    const newRendezVousData = {
      vehicule: parseInt(selectedVehicle, 10),
      mecanicien: parseInt(selectedMecanicien, 10),
      date: `${date}T${heure}:00`,
      status: 'pending',
      description: symptomes,
    };

    try {
      setLoading(true);
      setError(null);

      const data = await createRendezVousRequest(newRendezVousData);

      setSuccess('Votre rendez-vous a été enregistré avec succès.');

      // Réinitialiser le formulaire
      setDate('');
      setHeure('');
      setSymptomes('');
      setSelectedVehicle('');
      setSelectedMecanicien('');
    } catch (err) {
      console.error('Erreur lors de la création du rendez-vous :', err);
      if (err.response && err.response.data) {
        setError(`Impossible d'enregistrer le rendez-vous : ${JSON.stringify(err.response.data)}`);
      } else {
        setError("Impossible d'enregistrer le rendez-vous.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="mt-5">
      <h2 className="text-center mb-4">Prendre un rendez-vous</h2>

      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}
      {loading && <Spinner animation="border" variant="primary" className="d-block mx-auto mb-4" />}

      {vehiclesLoading && <p>Chargement des véhicules...</p>}
      {vehiclesError && <Alert variant="danger">{vehiclesError}</Alert>}

      <Form onSubmit={handleSubmit}>
        <Row>
          <Col md={6}>
            <Form.Group controlId="formVehicle" className="mb-4">
              <Form.Label>Véhicule</Form.Label>
              <Form.Control
                as="select"
                value={selectedVehicle}
                onChange={(e) => setSelectedVehicle(e.target.value)}
                required
              >
                <option value="">Sélectionnez un véhicule</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.marque} {v.modele} ({v.annee})
                  </option>
                ))}
              </Form.Control>
            </Form.Group>
          </Col>

          <Col md={6}>
            <Form.Group controlId="formMecanicien" className="mb-4">
              <Form.Label>Mécanicien</Form.Label>
              <Form.Control
                as="select"
                value={selectedMecanicien}
                onChange={(e) => setSelectedMecanicien(e.target.value)}
                required
              >
                <option value="">Sélectionnez un mécanicien</option>
                {mecaniciens.map((mec) => (
                  <option key={mec.id} value={mec.id}>
                    {`${mec.first_name || ''} ${mec.last_name || ''}`.trim() || mec.username}
                  </option>
                ))}
              </Form.Control>
            </Form.Group>
          </Col>
        </Row>

        <Row>
          <Col md={6}>
            <Form.Group controlId="formDate" className="mb-4">
              <Form.Label>Date</Form.Label>
              <Form.Control
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group controlId="formHeure" className="mb-4">
              <Form.Label>Heure</Form.Label>
              <Form.Control
                type="time"
                value={heure}
                onChange={(e) => setHeure(e.target.value)}
                required
              />
            </Form.Group>
          </Col>
        </Row>

        <Form.Group controlId="formSymptomes" className="mb-4">
          <Form.Label>Symptômes</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            value={symptomes}
            onChange={(e) => setSymptomes(e.target.value)}
            placeholder="Décrivez les symptômes du véhicule"
            required
          />
        </Form.Group>

        <Button variant="primary" type="submit" disabled={loading} className="w-100">
          Prendre rendez-vous
        </Button>
      </Form>
    </Container>
  );
}

export default RendezVous;
