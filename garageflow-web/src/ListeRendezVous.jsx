import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchAppointments } from '../features/rendezVousSlice';
import { Card, ListGroup, Container, Row, Col } from 'react-bootstrap';

function ListeRendezVous() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.user);
  const { appointments } = useSelector((state) => state.rendezVous);

  useEffect(() => {
    dispatch(fetchAppointments(user.id)); // Récupérer les rendez-vous pour ce mécanicien
  }, [dispatch, user.id]);

  return (
    <Container className="mt-5">
      <h2 className="text-center mb-4">Mes Rendez-vous</h2>
      <Row>
        {appointments.length > 0 ? (
          appointments.map((rdv) => (
            <Col key={rdv.id} xs={12} md={6} lg={4} className="mb-4">
              <Card className="shadow-sm">
                <Card.Header className="bg-primary text-white">
                  Rendez-vous du {rdv.date}
                </Card.Header>
                <Card.Body>
                  <ListGroup variant="flush">
                    <ListGroup.Item>
                      <strong>Client :</strong> {rdv.clientName}
                    </ListGroup.Item>
                    <ListGroup.Item>
                      <strong>Véhicule :</strong> {rdv.vehicleDetails}
                    </ListGroup.Item>
                    <ListGroup.Item>
                      <strong>Symptômes :</strong> {rdv.symptomes}
                    </ListGroup.Item>
                  </ListGroup>
                </Card.Body>
              </Card>
            </Col>
          ))
        ) : (
          <Col>
            <p className="text-center">Aucun rendez-vous pour l'instant.</p>
          </Col>
        )}
      </Row>
    </Container>
  );
}

export default ListeRendezVous;
