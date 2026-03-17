// src/GestionVehicules.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Card,
  Button,
  Form,
  Container,
  Row,
  Col,
  ListGroup,
  Alert
} from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCar, faTrash, faPlus, faEdit } from '@fortawesome/free-solid-svg-icons';
import {
  createVehiculeRequest,
  deleteVehiculeRequest,
  fetchVehiculesRequest,
  updateVehiculeRequest,
} from '../shared/api/vehiculeApi';

// 1. Import Redux
import { useDispatch, useSelector } from 'react-redux';
import {
  setVehicles,
  addVehicle,
  removeVehicle,
  updateVehicle,
} from '../features/vehiculeSlice.js';

function GestionVehicule() {
  // On NE stocke plus la liste de véhicules en local state
  // const [vehicles, setVehicles] = useState([]);   // => supprimé

  // On utilise Redux
  const dispatch = useDispatch();
  const vehicles = useSelector((state) => state.vehicles.vehicles);

  // Saisie pour VIN
  const [vin, setVin] = useState('');
  // Résultat renvoyé par l’API NHTSA
  const [vehicleFromVin, setVehicleFromVin] = useState(null);
  // Formulaire manuel ou édition
  const [manualVehicle, setManualVehicle] = useState({
    marque: '',
    modele: '',
    annee: ''
  });
  // Véhicule en cours d’édition (ou null si on est en mode ajout)
  const [editVehicle, setEditVehicle] = useState(null);
  // Gestion d’erreur / message
  const [error, setError] = useState(null);

  // ------------- 1) Charger la liste depuis l’API au montage -------------
  useEffect(() => {
    fetchVehiculesRequest()
      .then((data) => {
        dispatch(setVehicles(data));
      })
      .catch((err) => {
        console.error(err);
        setError(
          "Impossible de charger les véhicules depuis l’API (erreur d’auth ?)."
        );
      });
  }, [dispatch]);

  // ------------- 2) Rechercher un véhicule via VIN (API NHTSA) -------------
  const handleVinSubmit = () => {
    setError(null);
    setVehicleFromVin(null);

    if (!vin) {
      setError('Veuillez saisir un VIN');
      return;
    }

    axios
      .get(
        `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValuesExtended/${vin}?format=json`
      )
      .then((response) => {
        const data = response.data.Results[0];
        if (data.Make && data.Model && data.ModelYear) {
          const foundVehicle = {
            marque: data.Make,
            modele: data.Model,
            annee: data.ModelYear,
            body_class: data.BodyClass || 'N/A',
            vehicle_type: data.VehicleType || 'N/A'
          };
          setVehicleFromVin(foundVehicle);
          setVin(''); // on vide le champ VIN
        } else {
          setError('Aucune information valide trouvée pour ce VIN.');
        }
      })
      .catch((err) => {
        console.error(err);
        setError("Erreur lors de l'appel à l'API NHTSA.");
      });
  };

  // ------------- 3) Ajouter le véhicule récupéré via VIN -------------
  const handleAddVehicleFromVin = () => {
    if (!vehicleFromVin) return;

    const newVehicle = {
      marque: vehicleFromVin.marque,
      modele: vehicleFromVin.modele,
      annee: vehicleFromVin.annee,
      body_class: vehicleFromVin.body_class,
      vehicle_type: vehicleFromVin.vehicle_type
    };

    createVehiculeRequest(newVehicle)
      .then((data) => {
        dispatch(addVehicle(data));
        setVehicleFromVin(null);
      })
      .catch((err) => {
        console.error(err);
        setError("Impossible d'ajouter ce véhicule via l'API locale.");
      });
  };

  // ------------- 4) Ajouter / Mettre à jour un véhicule manuellement -------------
  const handleManualSubmit = () => {
    setError(null);
    const { marque, modele, annee } = manualVehicle;
    if (!marque || !modele || !annee) {
      setError('Tous les champs sont obligatoires.');
      return;
    }

    if (editVehicle) {
      // On fait un PUT pour mettre à jour
      const updatedData = { ...editVehicle, ...manualVehicle };

      updateVehiculeRequest(editVehicle.id, updatedData)
        .then((data) => {
          dispatch(updateVehicle(data));

          // Reset
          setEditVehicle(null);
          setManualVehicle({ marque: '', modele: '', annee: '' });
        })
        .catch((err) => {
          console.error(err);
          setError('Impossible de mettre à jour ce véhicule.');
        });
    } else {
      // POST pour créer un nouveau véhicule
      const newVehicle = {
        marque,
        modele,
        annee,
        body_class: 'Non spécifié',
        vehicle_type: 'Non spécifié'
      };

      createVehiculeRequest(newVehicle)
        .then((data) => {
          dispatch(addVehicle(data));
          setManualVehicle({ marque: '', modele: '', annee: '' });
        })
        .catch((err) => {
          console.error(err);
          setError('Impossible de créer ce véhicule.');
        });
    }
  };

  // ------------- 5) Supprimer un véhicule -------------
  const handleDeleteVehicle = (vehId) => {
    deleteVehiculeRequest(vehId)
      .then(() => {
        dispatch(removeVehicle(vehId));
      })
      .catch((err) => {
        console.error(err);
        setError('Impossible de supprimer ce véhicule.');
      });
  };

  // ------------- 6) Passer en mode édition -------------
  const handleEditVehicle = (vehicle) => {
    setEditVehicle(vehicle);
    setManualVehicle({
      marque: vehicle.marque,
      modele: vehicle.modele,
      annee: vehicle.annee
    });
  };

  // ------------- 7) Annuler l’édition -------------
  const handleCancelEdit = () => {
    setEditVehicle(null);
    setManualVehicle({ marque: '', modele: '', annee: '' });
  };

  return (
    <Container className="mt-5">
      <h2 className="mb-4">
        <FontAwesomeIcon icon={faCar} /> Gestion des Véhicules
      </h2>

      {/* Erreur globale */}
      {error && <Alert variant="danger">{error}</Alert>}

      <Row>
        <Col md={6}>
          <Card className="mb-4">
            <Card.Header>
              {editVehicle
                ? 'Modifier un véhicule'
                : 'Ajouter un véhicule (VIN ou manuel)'}
            </Card.Header>
            <Card.Body>
              {/* --- Formulaire VIN (uniquement si on n'est pas en mode édition) --- */}
              {!editVehicle && (
                <Form>
                  <Form.Group controlId="formVin">
                    <Form.Label>Numéro VIN</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Numéro VIN"
                      value={vin}
                      onChange={(e) => setVin(e.target.value)}
                    />
                  </Form.Group>
                  <Button variant="primary" onClick={handleVinSubmit} className="mt-2">
                    Rechercher via NHTSA
                  </Button>
                </Form>
              )}

              {/* --- Affichage du résultat VIN (si existant) --- */}
              {vehicleFromVin && !editVehicle && (
                <div className="mt-3">
                  <h5>Résultat VIN :</h5>
                  <p>
                    <strong>Marque : </strong> {vehicleFromVin.marque} <br />
                    <strong>Modèle : </strong> {vehicleFromVin.modele} <br />
                    <strong>Année : </strong> {vehicleFromVin.annee} <br />
                    <strong>Type : </strong> {vehicleFromVin.vehicle_type} <br />
                    <strong>Classe : </strong> {vehicleFromVin.body_class}
                  </p>
                  <Button variant="success" onClick={handleAddVehicleFromVin}>
                    <FontAwesomeIcon icon={faPlus} /> Ajouter ce véhicule
                  </Button>
                </div>
              )}

              {/* --- Formulaire manuel ou édition --- */}
              <Form className="mt-3">
                <Form.Group controlId="formMarque">
                  <Form.Label>Marque</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Marque"
                    value={manualVehicle.marque}
                    onChange={(e) =>
                      setManualVehicle({ ...manualVehicle, marque: e.target.value })
                    }
                  />
                </Form.Group>
                <Form.Group controlId="formModele">
                  <Form.Label>Modèle</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Modèle"
                    value={manualVehicle.modele}
                    onChange={(e) =>
                      setManualVehicle({ ...manualVehicle, modele: e.target.value })
                    }
                  />
                </Form.Group>
                <Form.Group controlId="formAnnee">
                  <Form.Label>Année</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Année"
                    value={manualVehicle.annee}
                    onChange={(e) =>
                      setManualVehicle({ ...manualVehicle, annee: e.target.value })
                    }
                  />
                </Form.Group>

                {editVehicle ? (
                  <>
                    <Button
                      variant="success"
                      onClick={handleManualSubmit}
                      className="mt-2 me-2"
                    >
                      <FontAwesomeIcon icon={faEdit} /> Mettre à jour
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={handleCancelEdit}
                      className="mt-2"
                    >
                      Annuler
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="success"
                    onClick={handleManualSubmit}
                    className="mt-2"
                  >
                    <FontAwesomeIcon icon={faPlus} /> Ajouter manuellement
                  </Button>
                )}
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* --- Liste des véhicules existants --- */}
      <Card>
        <Card.Header>Liste des véhicules</Card.Header>
        <ListGroup variant="flush">
          {vehicles.map((vehicle) => (
            <ListGroup.Item key={vehicle.id}>
              <Row>
                <Col md={8}>
                  <strong>
                    {vehicle.marque} {vehicle.modele} ({vehicle.annee})
                  </strong>
                  <p>
                    Type:&nbsp;{vehicle.vehicle_type || 'N/A'} 
                    {' - '} 
                    Classe:&nbsp;{vehicle.body_class || 'N/A'}
                  </p>
                </Col>
                <Col
                  md={4}
                  className="text-right d-flex align-items-center justify-content-end"
                >
                  <Button
                    variant="warning"
                    onClick={() => handleEditVehicle(vehicle)}
                    className="me-2"
                  >
                    <FontAwesomeIcon icon={faEdit} /> Modifier
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => handleDeleteVehicle(vehicle.id)}
                  >
                    <FontAwesomeIcon icon={faTrash} /> Supprimer
                  </Button>
                </Col>
              </Row>
            </ListGroup.Item>
          ))}
        </ListGroup>
      </Card>
    </Container>
  );
}

export default GestionVehicule;
