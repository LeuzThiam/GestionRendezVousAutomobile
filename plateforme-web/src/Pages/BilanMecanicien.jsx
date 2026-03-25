import React from 'react';
import { Alert, Container } from 'react-bootstrap';

function BilanMecanicien() {
  return (
    <Container className="mt-5">
      <h2 className="text-center mb-4">Mon Bilan</h2>
      <Alert variant="info">
        Le bilan mecanicien est retire du MVP actuel. Il sera remis quand une vraie couche
        de facturation ou de statistiques sera ajoutee.
      </Alert>
    </Container>
  );
}

export default BilanMecanicien;
