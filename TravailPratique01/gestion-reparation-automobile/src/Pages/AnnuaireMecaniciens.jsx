import React from 'react';
import { useSelector } from 'react-redux';
import { Card, Container, Row, Col } from 'react-bootstrap';

function AnnuaireMecaniciens() {
  const mecaniciens = useSelector((state) => state.mecaniciens.mecaniciens);

  // Fonction pour extraire et afficher les disponibilités d'un mécanicien
  const getDisponibilites = (disponibilites) => {
    return disponibilites.map((disponibilite, index) => (
      <li key={index}>{disponibilite}</li>
    ));
  };

  return (
    <Container>
      <h2 className="text-center my-4">Disponibilités des mécaniciens</h2>
      <Row>
        {mecaniciens.map((mecanicien) => (
          <Col xs={12} md={6} lg={4} key={mecanicien.id}>
            <Card className="mb-4 shadow-sm">
              <Card.Body>
                <Card.Title>{mecanicien.nom} {mecanicien.prenom}</Card.Title>
                <p><strong>Spécialité :</strong> {mecanicien.specialite}</p>
                <p><strong>Disponibilités :</strong></p>
                <ul>
                  {getDisponibilites(mecanicien.disponibilites)}
                </ul>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
}

export default AnnuaireMecaniciens;
