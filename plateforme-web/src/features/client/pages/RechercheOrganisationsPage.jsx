import React, { useEffect, useMemo, useState } from 'react';
import { Col, Container, Form, Row } from 'react-bootstrap';
import { fetchPublicOrganizationsRequest } from '../api';
import { EmptyState, ErrorState, LoadingState, PageHeader, SectionCard, StatBadgeGroup } from '../../../shared/ui';
import OrganizationPublicCard from '../../organizations/components/OrganizationPublicCard';

function RechercheOrganisations() {
  const [query, setQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [serviceFilter, setServiceFilter] = useState('');
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadOrganizations() {
      try {
        setLoading(true);
        setError(null);
        setOrganizations(await fetchPublicOrganizationsRequest());
      } catch {
        setError("Impossible de charger les etablissements.");
      } finally {
        setLoading(false);
      }
    }

    loadOrganizations();
  }, []);

  const availableServices = useMemo(() => {
    return Array.from(
      new Set(organizations.flatMap((org) => org.services || []))
    ).sort((left, right) => left.localeCompare(right));
  }, [organizations]);

  const filteredOrganizations = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const normalizedLocation = locationFilter.trim().toLowerCase();
    const normalizedService = serviceFilter.trim().toLowerCase();

    return organizations.filter((org) => {
      const searchableText = [
        org.name,
        org.address,
        org.slug,
        org.phone,
        org.description,
        ...(org.services || []),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const matchesQuery = !normalizedQuery || searchableText.includes(normalizedQuery);
      const matchesLocation =
        !normalizedLocation || (org.address || '').toLowerCase().includes(normalizedLocation);
      const matchesService =
        !normalizedService ||
        (org.services || []).some((service) => service.toLowerCase() === normalizedService);

      return matchesQuery && matchesLocation && matchesService;
    });
  }, [organizations, locationFilter, query, serviceFilter]);

  return (
    <Container className="py-5 client-search-page">
      <PageHeader
        title="Trouver un etablissement"
        description="Recherchez par nom, localisation ou service, puis ouvrez la fiche pour envoyer une demande de rendez-vous."
        actions={(
          <StatBadgeGroup
            items={[
              { label: 'Etablissements', value: organizations.length, bg: 'dark' },
              { label: 'Services', value: availableServices.length, bg: 'info' },
            ]}
          />
        )}
      />

      <ErrorState>{error}</ErrorState>
      {loading && <LoadingState className="d-flex justify-content-center mb-4" label="Chargement..." />}

      <Row className="g-3 mb-4">
        <Col md={6} xl={4}>
          <div className="client-search-kpi">
            <span>Résultats visibles</span>
            <strong>{filteredOrganizations.length}</strong>
            <small>Correspondant a vos filtres</small>
          </div>
        </Col>
        <Col md={6} xl={4}>
          <div className="client-search-kpi">
            <span>Services filtrables</span>
            <strong>{availableServices.length}</strong>
            <small>Catalogue public actuellement visible</small>
          </div>
        </Col>
        <Col md={6} xl={4}>
          <div className="client-search-kpi">
            <span>Lecture active</span>
            <strong>{serviceFilter ? 'Service ciblé' : 'Vue large'}</strong>
            <small>{locationFilter ? 'Avec filtre de localisation' : 'Sans filtre de lieu'}</small>
          </div>
        </Col>
      </Row>

      <SectionCard className="shadow-sm border-0 mb-4" title="Affiner la recherche">
          <Row className="g-3">
            <Col lg={5}>
              <Form.Group controlId="formOrganizationSearch">
                <Form.Label>Recherche générale</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Nom, adresse, service ou identifiant"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={6} lg={4}>
              <Form.Group controlId="formOrganizationLocation">
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
              <Form.Group controlId="formOrganizationService">
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
        {filteredOrganizations.map((org) => (
          <Col md={6} xl={4} key={org.id}>
            <OrganizationPublicCard organization={org} />
          </Col>
        ))}
      </Row>

      {!loading && filteredOrganizations.length === 0 && (
        <EmptyState className="mt-4" variant="secondary">
          Aucun etablissement ne correspond aux filtres actuels.
        </EmptyState>
      )}
    </Container>
  );
}

export default RechercheOrganisations;
