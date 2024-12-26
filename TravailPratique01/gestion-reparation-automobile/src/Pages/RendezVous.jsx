// src/components/RendezVous.js

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setLoading, setError, fetchMecaniciens } from '../features/mecanicienSlice'; 
import { addRendezVous } from '../features/rendezVousSlice';        
import { fetchVehicles } from '../features/vehiculeSlice'; 
import { Form, Button, Container, Row, Col, Alert, Spinner } from 'react-bootstrap';
import axios from 'axios';

function RendezVous() {
  const [date, setDate] = useState('');
  const [heure, setHeure] = useState('');
  const [symptomes, setSymptomes] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [selectedMecanicien, setSelectedMecanicien] = useState('');
  const [success, setSuccess] = useState(null);

  // Récupération depuis le slice mecaniciens
  const { mecaniciens, loading, error } = useSelector((state) => state.mecaniciens);

  // Récupération depuis le slice vehicles
  const { vehicles, loading: vehiclesLoading, error: vehiclesError } = useSelector((state) => state.vehicles);

  const dispatch = useDispatch();

  // Charger les véhicules et les mécaniciens au montage
  useEffect(() => {
    dispatch(fetchVehicles());
    dispatch(fetchMecaniciens()); // On récupère la liste dynamique des mécanos
  }, [dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess(null);

    // Vérif champs requis
    if (!selectedVehicle || !date || !heure || !symptomes || !selectedMecanicien) {
      dispatch(setError('Veuillez remplir tous les champs requis.'));
      return;
    }

    // Vérifier que le véhicule existe
    const vehicle = vehicles.find((v) => v.id === parseInt(selectedVehicle, 10));
    if (!vehicle) {
      dispatch(setError('Le véhicule sélectionné est introuvable.'));
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
      dispatch(setLoading(true));

      // POST => API
      const { data } = await axios.post('http://127.0.0.1:8000/api/rendezvous/', newRendezVousData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      // Succès
      setSuccess('Votre rendez-vous a été enregistré avec succès.');

      // Mettre à jour le slice local (optionnel) :
      dispatch(
        addRendezVous({
          id: data.id,
          date: data.date,
          heure,
          description: data.description,
          mecanicienId: data.mecanicien,
          vehicleId: data.vehicule,
          status: 'en attente', // ou data.status si l’API renvoie déjà "pending"
        })
      );

      // Réinitialiser le formulaire
      setDate('');
      setHeure('');
      setSymptomes('');
      setSelectedVehicle('');
      setSelectedMecanicien('');
    } catch (err) {
      console.error('Erreur lors de la création du rendez-vous :', err);
      if (err.response && err.response.data) {
        dispatch(setError(`Impossible d'enregistrer le rendez-vous : ${JSON.stringify(err.response.data)}`));
      } else {
        dispatch(setError('Impossible d\'enregistrer le rendez-vous.'));
      }
    } finally {
      dispatch(setLoading(false));
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
                    {/* Affichez ce que vous voulez, ex: nom/prenom */}
                    {mec.first_name} {mec.last_name} - {mec.specialite}
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
