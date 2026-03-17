import React from 'react';
import { useSelector } from 'react-redux';
import { Card, ListGroup, Container, Row, Col, Badge } from 'react-bootstrap';

function ListeRendezVous() {
  const { rendezVous } = useSelector((state) => state.rendezVous);

  return (
    <Container className="mt-5">
      <h2 className="text-center mb-4">Mes Rendez-vous</h2>
      {rendezVous.length > 0 ? (
        <Row className="g-4">
          {rendezVous.map((rdv, index) => (
            <Col xs={12} md={6} lg={4} key={index}>
              <Card className="shadow-sm border-0 h-100">
                <Card.Header className="bg-primary text-white">
                  Rendez-vous du {rdv.date} à {rdv.heure}
                </Card.Header>
                <Card.Body>
                  <Card.Title className="text-center text-secondary mb-4">
                    Détails du véhicule
                  </Card.Title>
                  <ListGroup variant="flush">
                    <ListGroup.Item><strong>Marque :</strong> {rdv.vehicle.marque}</ListGroup.Item>
                    <ListGroup.Item><strong>Modèle :</strong> {rdv.vehicle.modele}</ListGroup.Item>
                    <ListGroup.Item><strong>Année :</strong> {rdv.vehicle.annee}</ListGroup.Item>
                  </ListGroup>

                  <Card.Title className="mt-4 text-center text-secondary">
                    Symptômes
                  </Card.Title>
                  <p className="text-center">{rdv.symptomes}</p>

                  {/* Badge de statut */}
                  <div className="text-center mt-4">
                    <Badge bg={rdv.status === 'confirmé' ? 'success' : 'warning'}>
                      {rdv.status === 'confirmé' ? 'Confirmé' : 'En attente'}
                    </Badge>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      ) : (
        <div className="text-center mt-5">
          <p className="lead">Aucun rendez-vous pour l'instant.</p>
        </div>
      )}
    </Container>
  );
}

export default ListeRendezVous;
