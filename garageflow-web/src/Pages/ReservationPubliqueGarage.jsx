import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Button, Card, Col, Container, Form, Row, Spinner } from 'react-bootstrap';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { fetchPublicGarageRequest } from '../api/garages';
import { createRendezVousRequest } from '../api/rendezVous';
import { fetchVehiculesRequest } from '../api/vehicules';
import { useAuth } from '../shared/auth/AuthContext';

function formatCurrency(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  return new Intl.NumberFormat('fr-CA', {
    style: 'currency',
    currency: 'CAD',
  }).format(Number(value));
}

function ReservationPubliqueGarage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(false);
  const [vehiclesError, setVehiclesError] = useState(null);

  const [garage, setGarage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [formData, setFormData] = useState({
    vehicule: '',
    service: '',
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
      async function loadVehicles() {
        try {
          setVehiclesLoading(true);
          setVehiclesError(null);
          setVehicles(await fetchVehiculesRequest());
        } catch {
          setVehiclesError('Impossible de charger les vehicules.');
        } finally {
          setVehiclesLoading(false);
        }
      }

      loadVehicles();
    }
  }, [isAuthenticated, user]);

  const canBook = useMemo(() => {
    return isAuthenticated && user?.role === 'client' && garage;
  }, [garage, isAuthenticated, user]);

  const garageHighlights = useMemo(() => {
    if (!garage) {
      return [];
    }

    const activeServices = garage.services?.length || 0;
    const activeSlots = garage.disponibilites?.length || 0;
    const teamCount = garage.mecaniciens?.length || 0;

    return [
      { label: 'Services actifs', value: activeServices },
      { label: 'Creneaux affiches', value: activeSlots },
      { label: 'Equipe atelier', value: teamCount },
    ];
  }, [garage]);

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
        garage: garage.id,
        vehicule: Number(formData.vehicule),
        service: Number(formData.service),
        date: `${formData.date}T${formData.heure}:00`,
        description: formData.description,
      });

      setSuccess('Votre rendez-vous a ete envoye au garage.');
      setFormData({
        vehicule: '',
        service: '',
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
        <>
          <Card className="shadow-sm border-0 mb-4">
            <Card.Body className="p-4">
              <Row className="g-4 align-items-start">
                <Col lg={8}>
                  <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
                    <Badge bg="dark">Garage</Badge>
                    {garage.services?.length > 0 && <Badge bg="success">Reservation disponible</Badge>}
                  </div>
                  <h1 className="h3 mb-2">{garage.name}</h1>
                  <p className="text-muted mb-3">
                    Consultez la fiche du garage, les services proposes et ses horaires avant d'envoyer votre demande.
                  </p>
                  <div className="d-flex flex-column gap-2">
                    <div>
                      <strong>Adresse :</strong> {garage.address || 'A renseigner'}
                    </div>
                    <div>
                      <strong>Telephone :</strong> {garage.phone || 'A renseigner'}
                    </div>
                    <div>
                      <strong>Slug public :</strong> {garage.slug}
                    </div>
                  </div>
                </Col>
                <Col lg={4}>
                  <Row className="g-3">
                    {garageHighlights.map((item) => (
                      <Col xs={12} sm={4} lg={12} key={item.label}>
                        <Card className="border h-100">
                          <Card.Body>
                            <div className="text-muted small">{item.label}</div>
                            <div className="fs-4 fw-semibold">{item.value}</div>
                          </Card.Body>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          <Row className="g-4">
            <Col lg={5}>
            <Card className="shadow-sm h-100 border-0">
              <Card.Body>
                <Card.Title className="mb-4">Informations du garage</Card.Title>

                <div className="mb-4">
                  <h5 className="mb-3">Resume</h5>
                  <p className="text-muted mb-2">
                    Ce garage recoit vos demandes de rendez-vous en ligne et organise ensuite l'intervention en interne.
                  </p>
                  <p className="text-muted mb-0">
                    Vous choisissez un service, un vehicule et un creneau souhaite. Le garage confirme ensuite la prise en charge.
                  </p>
                </div>

                <div className="mb-4">
                  <h5 className="mb-3">Horaires affiches</h5>
                  {garage.disponibilites?.length ? (
                    <div className="d-flex flex-column gap-2">
                      {garage.disponibilites.map((dispo) => (
                        <div key={dispo.id} className="border rounded p-3">
                          <div className="fw-semibold">{dispo.jour_label}</div>
                          <div className="small text-muted">
                            {dispo.heure_debut} - {dispo.heure_fin}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted mb-0">Horaires non renseignes.</p>
                  )}
                </div>

                <Alert variant="light" className="mb-4">
                  Votre demande sera envoyee au garage. L'affectation du mecanicien est geree en
                  interne par l'equipe du garage.
                </Alert>

                <div className="mt-4">
                  <h5 className="mb-3">Services proposes</h5>
                  {garage.services?.length ? (
                    <div className="d-flex flex-column gap-3">
                      {garage.services.map((service) => (
                        <div key={service.id} className="border rounded p-3">
                          <div className="d-flex justify-content-between align-items-start gap-3">
                            <div>
                              <div className="fw-semibold">{service.nom}</div>
                              <div className="small text-muted">
                                {service.description || 'Sans description'}
                              </div>
                            </div>
                            <Badge bg="light" text="dark">Service</Badge>
                          </div>
                          <div className="d-flex flex-wrap gap-3 mt-3 small">
                            <div>
                              <strong>Duree estimee :</strong>{' '}
                              {service.duree_estimee ? `${service.duree_estimee} h` : 'Non precisee'}
                            </div>
                            <div>
                              <strong>Prix indicatif :</strong>{' '}
                              {formatCurrency(service.prix_indicatif) || 'Non precise'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted mb-0">Aucun service publie pour le moment.</p>
                  )}
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={7}>
            <Card className="shadow-sm border-0">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
                  <div>
                    <Card.Title className="mb-1">Demander un rendez-vous</Card.Title>
                    <p className="text-muted mb-0">
                      Remplissez ce formulaire pour envoyer votre demande directement au garage.
                    </p>
                  </div>
                  <Badge bg="primary">Client</Badge>
                </div>

                {!isAuthenticated && (
                  <Alert variant="info">
                    Connectez-vous avec un compte client pour reserver avec ce garage.
                    <div className="mt-2">
                      <Link to="/connexion">Aller a la connexion</Link>
                    </div>
                    <div className="mt-2">
                      <Link to="/inscription">Creer un compte client</Link>
                    </div>
                  </Alert>
                )}

                {isAuthenticated && user?.role !== 'client' && (
                  <Alert variant="warning">
                    Seul un client peut reserver un rendez-vous public.
                  </Alert>
                )}

                {canBook && (
                  <>
                    {success && <Alert variant="success">{success}</Alert>}
                    {vehiclesLoading && <p>Chargement des vehicules...</p>}
                    {vehiclesError && <Alert variant="danger">{vehiclesError}</Alert>}
                    {!vehiclesLoading && vehicles.length === 0 && (
                      <Alert variant="warning">
                        Ajoutez d'abord un vehicule dans votre espace client avant de reserver.
                        <div className="mt-2">
                          <Link to="/profil/client/vehicules">Gerer mes vehicules</Link>
                        </div>
                      </Alert>
                    )}
                    <Form onSubmit={handleSubmit}>
                      <Form.Group className="mb-3">
                        <Form.Label>Service demande</Form.Label>
                        <Form.Select
                          name="service"
                          value={formData.service}
                          onChange={handleChange}
                          required
                          disabled={!garage.services?.length}
                        >
                          <option value="">Selectionnez un service</option>
                          {garage.services?.map((service) => (
                            <option key={service.id} value={service.id}>
                              {service.nom}
                            </option>
                          ))}
                        </Form.Select>
                        <Form.Text className="text-muted">
                          Le service choisi permet au garage de mieux preparer votre prise en charge.
                        </Form.Text>
                      </Form.Group>

                      <Form.Group className="mb-3">
                        <Form.Label>Vehicule</Form.Label>
                        <Form.Select
                          name="vehicule"
                          value={formData.vehicule}
                          onChange={handleChange}
                          required
                          disabled={vehicles.length === 0}
                        >
                          <option value="">Selectionnez un vehicule</option>
                          {vehicles.map((vehicle) => (
                            <option key={vehicle.id} value={vehicle.id}>
                              {vehicle.marque} {vehicle.modele} ({vehicle.annee})
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
                            <Form.Text className="text-muted">
                              Choisissez la date souhaitee.
                            </Form.Text>
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
                            <Form.Text className="text-muted">
                              L'heure sera validee par le garage selon ses disponibilites.
                            </Form.Text>
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

                      <Button
                        type="submit"
                        disabled={vehicles.length === 0 || !garage.services?.length}
                      >
                        Envoyer ma demande
                      </Button>
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
        </>
      )}
    </Container>
  );
}

export default ReservationPubliqueGarage;
