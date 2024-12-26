import React from 'react';
import { useSelector } from 'react-redux';
import { Card, Container, Row, Col } from 'react-bootstrap';

function BilanMecanicien() {
  const factures = useSelector((state) => state.factures.factures); // Récupérer les factures depuis Redux
  const benefices = factures.reduce((total, facture) => total + (facture.amount * 0.15), 0);

  return (
    <Container className="mt-5">
      <h2 className="text-center mb-4">Mon Bilan</h2>

      {/* Total des bénéfices */}
      <Row className="justify-content-center">
        <Col md={6}>
          <Card className="shadow-sm mb-4">
            <Card.Header className="bg-success text-white text-center">
              <h4>Total des bénéfices</h4>
            </Card.Header>
            <Card.Body className="text-center">
              <h3 className="text-success">{benefices.toFixed(2)} $</h3>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Liste des factures */}
      <h3 className="mb-4">Factures des clients</h3>
      <Row>
        {factures.length > 0 ? (
          factures.map((facture, index) => (
            <Col xs={12} md={6} lg={4} key={index} className="mb-4">
              <Card className="shadow-sm">
                <Card.Header className="bg-primary text-white">
                  Facture #{facture.invoiceNumber}
                </Card.Header>
                <Card.Body>
                  <p><strong>Client :</strong> {facture.customerName}</p>
                  <p><strong>Montant total :</strong> {facture.amount.toFixed(2)} $</p>
                  <p><strong>Bénéfice (15 %) :</strong> {(facture.amount * 0.15).toFixed(2)} $</p>
                </Card.Body>
              </Card>
            </Col>
          ))
        ) : (
          <Col>
            <p className="text-center">Aucune facture disponible.</p>
          </Col>
        )}
      </Row>
    </Container>
  );
}

export default BilanMecanicien;
