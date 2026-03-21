import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Container,
  Form,
  ListGroup,
  Row,
  Spinner,
} from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCar, faEdit, faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import {
  createVehiculeRequest,
  deleteVehiculeRequest,
  fetchVehiculesRequest,
  updateVehiculeRequest,
} from '../api';
import { EmptyState, ErrorState, LoadingState } from '../../../shared/ui';

const EMPTY_VEHICLE_FORM = {
  marque: '',
  modele: '',
  annee: '',
  vin: '',
  body_class: '',
  vehicle_type: '',
};

function GestionVehicule() {
  const [vehicles, setVehicles] = useState([]);
  const [vin, setVin] = useState('');
  const [vehicleFromVin, setVehicleFromVin] = useState(null);
  const [manualVehicle, setManualVehicle] = useState(EMPTY_VEHICLE_FORM);
  const [editVehicle, setEditVehicle] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const [vinLoading, setVinLoading] = useState(false);

  const loadVehicles = async () => {
    try {
      setLoading(true);
      setError(null);
      setVehicles(await fetchVehiculesRequest());
    } catch (err) {
      console.error(err);
      setError("Impossible de charger vos vehicules.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVehicles();
  }, []);

  const resetForm = () => {
    setManualVehicle(EMPTY_VEHICLE_FORM);
    setEditVehicle(null);
    setVehicleFromVin(null);
    setVin('');
  };

  const handleVinSubmit = async () => {
    setError(null);
    setSuccess(null);
    setVehicleFromVin(null);

    if (!vin.trim()) {
      setError('Veuillez saisir un VIN.');
      return;
    }

    try {
      setVinLoading(true);
      const response = await axios.get(
        `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValuesExtended/${vin.trim()}?format=json`
      );
      const data = response.data.Results[0];

      if (!data.Make || !data.Model || !data.ModelYear) {
        setError('Aucune information exploitable n a ete trouvee pour ce VIN.');
        return;
      }

      setVehicleFromVin({
        marque: data.Make,
        modele: data.Model,
        annee: data.ModelYear,
        vin: vin.trim(),
        body_class: data.BodyClass || '',
        vehicle_type: data.VehicleType || '',
      });
      setSuccess('Les informations du vehicule ont ete recuperees.');
    } catch (err) {
      console.error(err);
      setError("Erreur lors de la recherche du VIN.");
    } finally {
      setVinLoading(false);
    }
  };

  const handleAddVehicleFromVin = async () => {
    if (!vehicleFromVin) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      const data = await createVehiculeRequest(vehicleFromVin);
      setVehicles((current) => [...current, data]);
      setSuccess('Le vehicule a ete ajoute a votre espace.');
      resetForm();
    } catch (err) {
      console.error(err);
      setError("Impossible d'ajouter ce vehicule.");
    } finally {
      setLoading(false);
    }
  };

  const handleManualChange = (field, value) => {
    setManualVehicle((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleManualSubmit = async () => {
    setError(null);
    setSuccess(null);

    const payload = {
      marque: manualVehicle.marque.trim(),
      modele: manualVehicle.modele.trim(),
      annee: manualVehicle.annee,
      vin: manualVehicle.vin.trim() || null,
      body_class: manualVehicle.body_class.trim() || 'Non specifie',
      vehicle_type: manualVehicle.vehicle_type.trim() || 'Non specifie',
    };

    if (!payload.marque || !payload.modele || !payload.annee) {
      setError('La marque, le modele et l annee sont obligatoires.');
      return;
    }

    try {
      setLoading(true);

      if (editVehicle) {
        const updated = await updateVehiculeRequest(editVehicle.id, {
          ...editVehicle,
          ...payload,
        });
        setVehicles((current) =>
          current.map((vehicle) => (vehicle.id === updated.id ? updated : vehicle))
        );
        setSuccess('Le vehicule a ete mis a jour.');
      } else {
        const created = await createVehiculeRequest(payload);
        setVehicles((current) => [...current, created]);
        setSuccess('Le vehicule a ete ajoute.');
      }

      resetForm();
    } catch (err) {
      console.error(err);
      setError(editVehicle ? 'Impossible de mettre a jour ce vehicule.' : 'Impossible de creer ce vehicule.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVehicle = async (vehId) => {
    if (!window.confirm('Voulez-vous vraiment supprimer ce vehicule ?')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      await deleteVehiculeRequest(vehId);
      setVehicles((current) => current.filter((vehicle) => vehicle.id !== vehId));
      setSuccess('Le vehicule a ete supprime.');
    } catch (err) {
      console.error(err);
      setError('Impossible de supprimer ce vehicule.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditVehicle = (vehicle) => {
    setEditVehicle(vehicle);
    setVehicleFromVin(null);
    setVin('');
    setSuccess(null);
    setError(null);
    setManualVehicle({
      marque: vehicle.marque || '',
      modele: vehicle.modele || '',
      annee: vehicle.annee || '',
      vin: vehicle.vin || '',
      body_class: vehicle.body_class || '',
      vehicle_type: vehicle.vehicle_type || '',
    });
  };

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-start gap-3 mb-4">
        <div>
          <h2 className="mb-2">
            <FontAwesomeIcon icon={faCar} className="me-2" />
            Mes vehicules
          </h2>
          <p className="text-muted mb-0">
            Ajoutez les vehicules que vous utilisez pour vos demandes de rendez-vous.
          </p>
        </div>
        <Badge bg="dark">{vehicles.length} vehicule(s)</Badge>
      </div>

      <ErrorState>{error}</ErrorState>
      {success && <Alert variant="success">{success}</Alert>}
      {loading && <LoadingState label="Traitement en cours..." />}

      <Row className="g-4 mb-4">
        <Col xl={5}>
          <Card className="shadow-sm border-0 h-100">
            <Card.Body>
              <Card.Title className="mb-3">Ajouter par VIN</Card.Title>
              <p className="text-muted small">
                Renseignez un VIN pour pre-remplir automatiquement la marque, le modele et certaines informations techniques.
              </p>
              <Form>
                <Form.Group controlId="formVinLookup" className="mb-3">
                  <Form.Label>VIN</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Ex.: 1HGCM82633A123456"
                    value={vin}
                    onChange={(event) => setVin(event.target.value)}
                    disabled={Boolean(editVehicle)}
                  />
                </Form.Group>
                <Button variant="primary" onClick={handleVinSubmit} disabled={vinLoading || Boolean(editVehicle)}>
                  {vinLoading ? 'Recherche...' : 'Rechercher le vehicule'}
                </Button>
              </Form>

              {vehicleFromVin && !editVehicle && (
                <Card className="mt-4 border">
                  <Card.Body>
                    <Card.Title className="h6">Resultat VIN</Card.Title>
                    <div className="small mb-1"><strong>Marque :</strong> {vehicleFromVin.marque}</div>
                    <div className="small mb-1"><strong>Modele :</strong> {vehicleFromVin.modele}</div>
                    <div className="small mb-1"><strong>Annee :</strong> {vehicleFromVin.annee}</div>
                    <div className="small mb-1"><strong>VIN :</strong> {vehicleFromVin.vin}</div>
                    <div className="small mb-1"><strong>Type :</strong> {vehicleFromVin.vehicle_type || 'Non precise'}</div>
                    <div className="small mb-3"><strong>Classe :</strong> {vehicleFromVin.body_class || 'Non precisee'}</div>
                    <Button variant="success" onClick={handleAddVehicleFromVin}>
                      <FontAwesomeIcon icon={faPlus} className="me-2" />
                      Ajouter ce vehicule
                    </Button>
                  </Card.Body>
                </Card>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col xl={7}>
          <Card className="shadow-sm border-0 h-100">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <Card.Title className="mb-0">
                  {editVehicle ? 'Modifier un vehicule' : 'Ajouter manuellement'}
                </Card.Title>
                {editVehicle && (
                  <Button variant="outline-secondary" onClick={resetForm}>
                    Annuler
                  </Button>
                )}
              </div>

              <Row className="g-3">
                <Col md={6}>
                  <Form.Group controlId="formMarque">
                    <Form.Label>Marque</Form.Label>
                    <Form.Control
                      type="text"
                      value={manualVehicle.marque}
                      onChange={(event) => handleManualChange('marque', event.target.value)}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group controlId="formModele">
                    <Form.Label>Modele</Form.Label>
                    <Form.Control
                      type="text"
                      value={manualVehicle.modele}
                      onChange={(event) => handleManualChange('modele', event.target.value)}
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group controlId="formAnnee">
                    <Form.Label>Annee</Form.Label>
                    <Form.Control
                      type="number"
                      min="1900"
                      max="2100"
                      value={manualVehicle.annee}
                      onChange={(event) => handleManualChange('annee', event.target.value)}
                    />
                  </Form.Group>
                </Col>
                <Col md={8}>
                  <Form.Group controlId="formVehicleVin">
                    <Form.Label>VIN ou identifiant</Form.Label>
                    <Form.Control
                      type="text"
                      value={manualVehicle.vin}
                      onChange={(event) => handleManualChange('vin', event.target.value)}
                      placeholder="Optionnel"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group controlId="formVehicleType">
                    <Form.Label>Type de vehicule</Form.Label>
                    <Form.Control
                      type="text"
                      value={manualVehicle.vehicle_type}
                      onChange={(event) => handleManualChange('vehicle_type', event.target.value)}
                      placeholder="Ex.: SUV, berline, camion"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group controlId="formBodyClass">
                    <Form.Label>Classe de carrosserie</Form.Label>
                    <Form.Control
                      type="text"
                      value={manualVehicle.body_class}
                      onChange={(event) => handleManualChange('body_class', event.target.value)}
                      placeholder="Optionnel"
                    />
                  </Form.Group>
                </Col>
              </Row>

              <div className="mt-4">
                <Button variant="success" onClick={handleManualSubmit}>
                  <FontAwesomeIcon icon={editVehicle ? faEdit : faPlus} className="me-2" />
                  {editVehicle ? 'Enregistrer les modifications' : 'Ajouter le vehicule'}
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="shadow-sm border-0">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <Card.Title className="mb-0">Ma flotte personnelle</Card.Title>
            <span className="text-muted small">{vehicles.length} element(s)</span>
          </div>

          {vehicles.length === 0 ? (
            <EmptyState>
              Aucun vehicule enregistre pour le moment.
            </EmptyState>
          ) : (
            <ListGroup variant="flush">
              {vehicles.map((vehicle) => (
                <ListGroup.Item key={vehicle.id} className="px-0 py-3">
                  <Row className="align-items-center g-3">
                    <Col lg={8}>
                      <div className="fw-semibold">
                        {vehicle.marque} {vehicle.modele} ({vehicle.annee})
                      </div>
                      <div className="small text-muted mt-1">
                        VIN : {vehicle.vin || 'Non renseigne'} | Type : {vehicle.vehicle_type || 'Non precise'} | Classe : {vehicle.body_class || 'Non precisee'}
                      </div>
                    </Col>
                    <Col lg={4} className="d-flex justify-content-lg-end gap-2">
                      <Button variant="outline-warning" onClick={() => handleEditVehicle(vehicle)}>
                        <FontAwesomeIcon icon={faEdit} className="me-2" />
                        Modifier
                      </Button>
                      <Button variant="outline-danger" onClick={() => handleDeleteVehicle(vehicle.id)}>
                        <FontAwesomeIcon icon={faTrash} className="me-2" />
                        Supprimer
                      </Button>
                    </Col>
                  </Row>
                </ListGroup.Item>
              ))}
            </ListGroup>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
}

export default GestionVehicule;
