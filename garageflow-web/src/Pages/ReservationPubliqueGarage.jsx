import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Col, Container, Form, Row, Spinner } from 'react-bootstrap';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchVehicles } from '../features/vehiculeSlice';
import { fetchPublicGarageRequest } from '../shared/api/garageApi';
import { createRendezVousRequest } from '../shared/api/rendezVousApi';

function ReservationPubliqueGarage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state) => state.user);
  const { vehicles, loading: vehiclesLoading, error: vehiclesError } = useSelector((state) => state.vehicles);

  const [garage, setGarage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [formData, setFormData] = useState({
    vehicule: '',
    mecanicien: '',
    date: '',
    heure: '',
    description: '',
  });

  useEffect(() => {
    let mounted = true;

    async function loadGarage() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetchPublicGarageRequest(slug);
        if (mounted) {
          setGarage(response);
        }
      } catch (err) {
        if (mounted) {
          setError("Impossible de charger la page publique du garage.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadGarage();
    return () => {
      mounted = false;
    };
  }, [slug]);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'client') {
      dispatch(fetchVehicles());
    }
  }, [dispatch, isAuthenticated, user]);

  const canBook = useMemo(() => {
    return isAuthenticated && user?.role === 'client' && garage && user.garage_id === garage.id;
  }, [garage, isAuthenticated, user]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSuccess(null);
    setError(null);

    try {
      await createRendezVousRequest({
        vehicule: Number(formData.vehicule),
        mecanicien: Number(formData.mecanicien),
        date: `${formData.date}T${formData.heure}:00`,
        description: formData.description,
      });

      setSuccess('Votre rendez-vous a ete envoye au garage.');
      setFormData({
        vehicule: '',
        mecanicien: '',
        date: '',
        heure: '',
        description: '',
      });
    } catch (err) {
      const payload = err.response?.data;
      if (payload && typeof payload === 'object') {
        setError(Object.values(payload).flat().join(' '));
      } else {
        setError("Impossible d'envoyer le rendez-vous.");
      }
    }
  };

  return (
    <Container className="py-5">
      {loading && (
        <div className="d-flex align-items-center gap-2">
          <Spinner animation="border" size="sm" />
          <span>Chargement de la page publique...</span>
        </div>
      )}

      {error && <Alert variant="danger">{error}</Alert>}

      {garage && (
        <Row className="g-4">
          <Col lg={5}>
            <Card className="shadow-sm h-100">
              <Card.Body>
                <Card.Title>{garage.name}</Card.Title>
                <Card.Text className="mb-2">
                  <strong>Adresse :</strong> {garage.address || 'A renseigner'}
                </Card.Text>
                <Card.Text className="mb-4">
                  <strong>Telephone :</strong> {garage.phone || 'A renseigner'}
                </Card.Text>

                <h5 className="mb-3">Mecaniciens disponibles</h5>
                {garage.mecaniciens.length === 0 && (
                  <p className="text-muted mb-0">Aucun mecanicien n'est encore publie pour ce garage.</p>
                )}
                {garage.mecaniciens.map((mecanicien) => (
                  <div key={mecanicien.id} className="border rounded p-2 mb-2">
                    {`${mecanicien.first_name} ${mecanicien.last_name}`.trim() || 'Mecanicien'}
                  </div>
                ))}
              </Card.Body>
            </Card>
          </Col>

          <Col lg={7}>
            <Card className="shadow-sm">
              <Card.Body>
                <Card.Title className="mb-3">Reserver un rendez-vous</Card.Title>

                {!isAuthenticated && (
                  <Alert variant="info">
                    Connectez-vous d'abord avec un compte client rattache a ce garage pour reserver.
                    <div className="mt-2">
                      <Link to="/connexion">Aller a la connexion</Link>
                    </div>
                  </Alert>
                )}

                {isAuthenticated && user?.role !== 'client' && (
                  <Alert variant="warning">
                    Seul un client peut reserver un rendez-vous public.
                  </Alert>
                )}

                {isAuthenticated && user?.role === 'client' && garage && user.garage_id !== garage.id && (
                  <Alert variant="warning">
                    Ce compte client n'appartient pas a ce garage. Utilisez un compte client du meme garage.
                  </Alert>
                )}

                {canBook && (
                  <>
                    {success && <Alert variant="success">{success}</Alert>}
                    {vehiclesLoading && <p>Chargement des vehicules...</p>}
                    {vehiclesError && <Alert variant="danger">{vehiclesError}</Alert>}

                    <Form onSubmit={handleSubmit}>
                      <Form.Group className="mb-3">
                        <Form.Label>Vehicule</Form.Label>
                        <Form.Select
                          name="vehicule"
                          value={formData.vehicule}
                          onChange={handleChange}
                          required
                        >
                          <option value="">Selectionnez un vehicule</option>
                          {vehicles.map((vehicle) => (
                            <option key={vehicle.id} value={vehicle.id}>
                              {vehicle.marque} {vehicle.modele} ({vehicle.annee})
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>

                      <Form.Group className="mb-3">
                        <Form.Label>Mecanicien</Form.Label>
                        <Form.Select
                          name="mecanicien"
                          value={formData.mecanicien}
                          onChange={handleChange}
                          required
                        >
                          <option value="">Selectionnez un mecanicien</option>
                          {garage.mecaniciens.map((mecanicien) => (
                            <option key={mecanicien.id} value={mecanicien.id}>
                              {`${mecanicien.first_name} ${mecanicien.last_name}`.trim() || `Mecanicien #${mecanicien.id}`}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>

                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Date</Form.Label>
                            <Form.Control
                              type="date"
                              name="date"
                              value={formData.date}
                              onChange={handleChange}
                              required
                            />
                          </Form.Group>
                        </Col>

                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Heure</Form.Label>
                            <Form.Control
                              type="time"
                              name="heure"
                              value={formData.heure}
                              onChange={handleChange}
                              required
                            />
                          </Form.Group>
                        </Col>
                      </Row>

                      <Form.Group className="mb-4">
                        <Form.Label>Description</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={4}
                          name="description"
                          value={formData.description}
                          onChange={handleChange}
                          placeholder="Decrivez votre besoin ou le probleme du vehicule"
                          required
                        />
                      </Form.Group>

                      <Button type="submit">Envoyer la reservation</Button>
                    </Form>
                  </>
                )}

                {garage && (
                  <div className="mt-4">
                    <Button
                      variant="outline-secondary"
                      onClick={() => navigate('/acceuil')}
                    >
                      Retour a l'accueil
                    </Button>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </Container>
  );
}

export default ReservationPubliqueGarage;
