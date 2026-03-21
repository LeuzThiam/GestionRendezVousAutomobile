import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Col, Container, Form, Row } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { fetchPublicGaragesRequest, fetchVehiculesRequest } from '../api';
import { EmptyState, ErrorState, LoadingState, PageHeader, SectionCard, StatBadgeGroup } from '../../../shared/ui';
import GaragePublicCard from '../../garages/components/GaragePublicCard';

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
      <PageHeader
        title="Trouver un garage"
        description="Recherchez un garage par nom, localisation ou service, puis ouvrez sa fiche pour envoyer une demande."
        actions={(
          <StatBadgeGroup
            items={[
              { label: 'Garages', value: garages.length, bg: 'dark' },
              { label: 'Vehicules', value: vehicles.length, bg: 'secondary' },
              { label: 'Services', value: availableServices.length, bg: 'info' },
            ]}
          />
        )}
      />

      <ErrorState>{error}</ErrorState>
      {loading && <LoadingState className="d-flex justify-content-center mb-4" label="Chargement des garages..." />}
      {vehiclesLoading && <Alert variant="info">Verification de vos vehicules...</Alert>}
      {!vehiclesLoading && vehicles.length === 0 && (
        <Alert variant="warning">
          Vous n'avez encore aucun vehicule. Ajoutez-en un avant de reserver.
          <div className="mt-2">
            <Link to="/profil/client/vehicules">Gerer mes vehicules</Link>
          </div>
        </Alert>
      )}

      <SectionCard className="shadow-sm border-0 mb-4">
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
      </SectionCard>

      <Row className="g-4">
        {filteredGarages.map((garage) => (
          <Col md={6} xl={4} key={garage.id}>
            <GaragePublicCard garage={garage} />
          </Col>
        ))}
      </Row>

      {!loading && filteredGarages.length === 0 && (
        <EmptyState className="mt-4" variant="secondary">
          Aucun garage ne correspond aux filtres actuels.
        </EmptyState>
      )}
    </Container>
  );
}

export default RendezVous;
