// src/components/RendezVous.js
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Col, Container, Form, Row, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { fetchPublicGaragesRequest } from '../api/garages';
import { fetchVehiculesRequest } from '../api/vehicules';

function RendezVous() {
  const [query, setQuery] = useState('');
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

  const filteredGarages = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return garages;
    }
    return garages.filter((garage) =>
      [garage.name, garage.address, garage.slug]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(normalizedQuery))
    );
  }, [garages, query]);

  return (
    <Container className="mt-5">
      <div className="d-flex justify-content-between align-items-start gap-3 mb-4">
        <div>
          <h2 className="mb-2">Trouver un garage</h2>
          <p className="text-muted mb-0">
            Recherchez un garage, ouvrez sa page publique et demandez un rendez-vous.
          </p>
        </div>
        <div className="text-end">
          <div className="small text-muted">Vehicules disponibles</div>
          <strong>{vehicles.length}</strong>
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

      <Form className="mb-4">
        <Form.Group controlId="formGarageSearch">
          <Form.Label>Recherche</Form.Label>
          <Form.Control
            type="text"
            placeholder="Nom, adresse ou slug du garage"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </Form.Group>
      </Form>

      <Row className="g-4">
        {filteredGarages.map((garage) => (
          <Col md={6} lg={4} key={garage.id}>
            <Card className="shadow-sm h-100">
              <Card.Body className="d-flex flex-column">
                <Card.Title>{garage.name}</Card.Title>
                <Card.Text className="text-muted small mb-2">{garage.slug}</Card.Text>
                <Card.Text className="mb-2">
                  <strong>Adresse :</strong> {garage.address || 'A renseigner'}
                </Card.Text>
                <Card.Text className="mb-3">
                  <strong>Telephone :</strong> {garage.phone || 'A renseigner'}
                </Card.Text>
                <Card.Text className="text-muted mt-auto">
                  Envoyez votre demande directement au garage.
                </Card.Text>
                <Button as={Link} to={`/garage/${garage.slug}/reservation`} variant="dark">
                  Voir la page de reservation
                </Button>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {!loading && filteredGarages.length === 0 && (
        <Alert variant="secondary" className="mt-4">
          Aucun garage ne correspond a votre recherche.
        </Alert>
      )}
    </Container>
  );
}

export default RendezVous;
