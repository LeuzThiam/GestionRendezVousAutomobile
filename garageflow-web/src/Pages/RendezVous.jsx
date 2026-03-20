import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Button, Card, Col, Container, Form, Row, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { fetchPublicGaragesRequest } from '../api/garages';
import { fetchVehiculesRequest } from '../api/vehicules';

function RendezVous() {
  const [query, setQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [serviceFilter, setServiceFilter] = useState('');
  const [garages, setGarages] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [vehiclesLoading, setVehiclesLoading] = useState(false);

  useEffect(() => {
    async function loadGarages() {
      try {
        setLoading(true);
        setError(null);
        setGarages(await fetchPublicGaragesRequest());
      } catch {
        setError("Impossible de charger les garages.");
      } finally {
        setLoading(false);
      }
    }

    loadGarages();
  }, []);

  useEffect(() => {
    try {
      setVehiclesLoading(true);
      fetchVehiculesRequest()
        .then((data) => setVehicles(data))
        .catch(() => {})
        .finally(() => setVehiclesLoading(false));
    } catch {
      setVehiclesLoading(false);
    }
  }, []);

  const availableServices = useMemo(() => {
    return Array.from(
      new Set(garages.flatMap((garage) => garage.services || []))
    ).sort((left, right) => left.localeCompare(right));
  }, [garages]);

  const filteredGarages = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const normalizedLocation = locationFilter.trim().toLowerCase();
    const normalizedService = serviceFilter.trim().toLowerCase();

    return garages.filter((garage) => {
      const searchableText = [
        garage.name,
        garage.address,
        garage.slug,
        garage.phone,
        garage.description,
        ...(garage.services || []),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const matchesQuery = !normalizedQuery || searchableText.includes(normalizedQuery);
      const matchesLocation =
        !normalizedLocation || (garage.address || '').toLowerCase().includes(normalizedLocation);
      const matchesService =
        !normalizedService ||
        (garage.services || []).some((service) => service.toLowerCase() === normalizedService);

      return matchesQuery && matchesLocation && matchesService;
    });
  }, [garages, locationFilter, query, serviceFilter]);

  return (
    <Container className="py-5">
      <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-end gap-3 mb-4">
        <div>
          <h2 className="mb-2">Trouver un garage</h2>
          <p className="text-muted mb-0">
            Recherchez un garage par nom, localisation ou service, puis ouvrez sa fiche pour envoyer une demande.
          </p>
        </div>
        <div className="d-flex flex-wrap gap-2">
          <Badge bg="dark">Garages: {garages.length}</Badge>
          <Badge bg="secondary">Vehicules: {vehicles.length}</Badge>
          <Badge bg="info">Services: {availableServices.length}</Badge>
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {loading && <Spinner animation="border" variant="primary" className="d-block mx-auto mb-4" />}
      {vehiclesLoading && <Alert variant="info">Verification de vos vehicules...</Alert>}
      {!vehiclesLoading && vehicles.length === 0 && (
        <Alert variant="warning">
          Vous n'avez encore aucun vehicule. Ajoutez-en un avant de reserver.
          <div className="mt-2">
            <Link to="/profil/client/vehicules">Gerer mes vehicules</Link>
          </div>
        </Alert>
      )}

      <Card className="shadow-sm border-0 mb-4">
        <Card.Body>
          <Row className="g-3">
            <Col lg={5}>
              <Form.Group controlId="formGarageSearch">
                <Form.Label>Recherche generale</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Nom, adresse, service ou slug"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={6} lg={4}>
              <Form.Group controlId="formGarageLocation">
                <Form.Label>Localisation</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Ville, quartier ou adresse"
                  value={locationFilter}
                  onChange={(event) => setLocationFilter(event.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={6} lg={3}>
              <Form.Group controlId="formGarageService">
                <Form.Label>Service</Form.Label>
                <Form.Select
                  value={serviceFilter}
                  onChange={(event) => setServiceFilter(event.target.value)}
                >
                  <option value="">Tous les services</option>
                  {availableServices.map((service) => (
                    <option key={service} value={service}>
                      {service}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Row className="g-4">
        {filteredGarages.map((garage) => (
          <Col md={6} xl={4} key={garage.id}>
            <Card className="shadow-sm border-0 h-100">
              <Card.Body className="d-flex flex-column">
                <div className="d-flex justify-content-between align-items-start gap-3 mb-2">
                  <Card.Title className="mb-0">{garage.name}</Card.Title>
                  <Badge bg="light" text="dark">{garage.mecaniciens_count || 0} mec.</Badge>
                </div>
                <Card.Text className="text-muted small mb-2">{garage.slug}</Card.Text>
                <Card.Text className="mb-2">
                  <strong>Adresse :</strong> {garage.address || 'A renseigner'}
                </Card.Text>
                <Card.Text className="mb-3">
                  <strong>Telephone :</strong> {garage.phone || 'A renseigner'}
                </Card.Text>
                <Card.Text className="text-muted small mb-3">
                  {garage.description || 'Description du garage non renseignee.'}
                </Card.Text>

                <div className="mb-3">
                  <div className="small text-muted mb-2">Services</div>
                  <div className="d-flex flex-wrap gap-2">
                    {garage.services?.length ? (
                      garage.services.map((service) => (
                        <Badge bg="secondary" key={`${garage.id}-${service}`}>
                          {service}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-muted small">Aucun service affiche</span>
                    )}
                  </div>
                </div>

                <div className="small text-muted mb-3">
                  Disponibilites affichees : {garage.disponibilites_count || 0}
                </div>

                <Card.Text className="text-muted mt-auto">
                  Envoyez votre demande directement au garage depuis sa fiche publique.
                </Card.Text>
                <Button as={Link} to={`/garage/${garage.slug}/reservation`} variant="dark">
                  Voir la fiche du garage
                </Button>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {!loading && filteredGarages.length === 0 && (
        <Alert variant="secondary" className="mt-4">
          Aucun garage ne correspond aux filtres actuels.
        </Alert>
      )}
    </Container>
  );
}

export default RendezVous;
