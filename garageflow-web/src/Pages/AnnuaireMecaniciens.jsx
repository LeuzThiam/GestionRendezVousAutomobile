import React, { useEffect, useState } from 'react';
import { Alert, Card, Container, Row, Col } from 'react-bootstrap';
import { fetchMecaniciensRequest } from '../shared/api/mecanicienApi';

function AnnuaireMecaniciens() {
  const [mecaniciens, setMecaniciens] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadMecaniciens() {
      try {
        setError(null);
        setMecaniciens(await fetchMecaniciensRequest());
      } catch {
        setError("Impossible de charger l'annuaire des mecaniciens.");
      }
    }

    loadMecaniciens();
  }, []);


  return (
    <Container>
      <h2 className="text-center my-4">Disponibilités des mécaniciens</h2>
      {error && <Alert variant="danger">{error}</Alert>}
      <Row>
        {mecaniciens.map((mecanicien) => (
          <Col xs={12} md={6} lg={4} key={mecanicien.id}>
            <Card className="mb-4 shadow-sm">
              <Card.Body>
                <Card.Title>{`${mecanicien.first_name || ''} ${mecanicien.last_name || ''}`.trim() || mecanicien.username}</Card.Title>
                <p><strong>Courriel :</strong> {mecanicien.email || 'Non renseigne'}</p>
                <p className="mb-0"><strong>Role :</strong> {mecanicien.role}</p>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
}

export default AnnuaireMecaniciens;
