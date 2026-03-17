import React, { useEffect } from 'react';
import { Alert, Card, Col, Container, Row, Spinner } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchCurrentGarage } from '../features/userSlice';

function DashboardGarage() {
  const dispatch = useDispatch();
  const { currentGarage, loading, error, user } = useSelector((state) => state.user);

  useEffect(() => {
    if (!currentGarage) {
      dispatch(fetchCurrentGarage());
    }
  }, [currentGarage, dispatch]);

  return (
    <Container className="py-5">
      <Row className="mb-4">
        <Col>
          <h1 className="mb-2">Tableau de bord garage</h1>
          <p className="text-muted mb-0">
            Vue MVP pour le proprietaire du garage.
          </p>
        </Col>
      </Row>

      {loading && (
        <div className="d-flex align-items-center gap-2 mb-4">
          <Spinner animation="border" size="sm" />
          <span>Chargement du garage...</span>
        </div>
      )}

      {error && (
        <Alert variant="warning">
          {typeof error === 'string' ? error : "Impossible de charger les informations du garage."}
        </Alert>
      )}

      <Row className="g-4">
        <Col md={6}>
          <Card className="shadow-sm h-100">
            <Card.Body>
              <Card.Title>Garage</Card.Title>
              <Card.Text className="mb-2">
                <strong>Nom :</strong> {currentGarage?.name || 'Non charge'}
              </Card.Text>
              <Card.Text className="mb-2">
                <strong>Slug :</strong> {currentGarage?.slug || 'Non charge'}
              </Card.Text>
              <Card.Text className="mb-0">
                <strong>Adresse :</strong> {currentGarage?.address || 'A renseigner'}
              </Card.Text>
              {currentGarage?.slug && (
                <Card.Text className="mt-3 mb-0">
                  <strong>Lien public :</strong>{' '}
                  <Link to={`/garage/${currentGarage.slug}/reservation`}>
                    {`/garage/${currentGarage.slug}/reservation`}
                  </Link>
                </Card.Text>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card className="shadow-sm h-100">
            <Card.Body>
              <Card.Title>Proprietaire</Card.Title>
              <Card.Text className="mb-2">
                <strong>Utilisateur :</strong> {user?.username || '-'}
              </Card.Text>
              <Card.Text className="mb-2">
                <strong>Role :</strong> {user?.role || '-'}
              </Card.Text>
              <Card.Text className="mb-0">
                <strong>Garage ID :</strong> {user?.garage_id || currentGarage?.id || '-'}
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="shadow-sm h-100">
            <Card.Body>
              <Card.Title>Etape suivante</Card.Title>
              <Card.Text>
                Ajouter l'ecran de gestion des mecaniciens du garage.
              </Card.Text>
              <Link to="/garage/mecaniciens">Ouvrir la gestion de l'equipe</Link>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="shadow-sm h-100">
            <Card.Body>
              <Card.Title>Reservation</Card.Title>
              <Card.Text>
                Brancher une page publique de reservation par garage.
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="shadow-sm h-100">
            <Card.Body>
              <Card.Title>Operations</Card.Title>
              <Card.Text>
                Ajouter les services, disponibilites et rendez-vous du garage.
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default DashboardGarage;
