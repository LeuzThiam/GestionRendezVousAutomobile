// src/Pages/MecanicienLayout.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import { Nav, Card, Col, Container, Row } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import {
  faCar,
  faTools,
  faFileInvoiceDollar,
  faCalendarAlt
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

function MecanicienLayout() {
  return (
    <Container fluid className="py-5">
      <Row>
        {/* Menu à gauche */}
        <Col xs={12} md={4} lg={3} className="mb-4">
          <Card className="shadow-sm border-0 bg-light">
            <Card.Body>
              <h4 className="text-center mb-4">Mon Profil Mécanicien</h4>
              <Nav className="flex-column">
                {/* Exemple de liens */}
                <Nav.Link as={Link} to="/profil/mecanicien">
                  <FontAwesomeIcon icon={faCalendarAlt} /> Modifier mes informations
                </Nav.Link>
                <Nav.Link as={Link} to="/profil/mecanicien/vehicules">
                  <FontAwesomeIcon icon={faCar} /> Gestion des véhicules
                </Nav.Link>
                <Nav.Link as={Link} to="/profil/mecanicien/rendez-vous-mecanicien">
                  <FontAwesomeIcon icon={faTools} /> Rendez-vous Mécanicien
                </Nav.Link>
                <Nav.Link as={Link} to="/profil/mecanicien/bilan-mecanicien">
                  <FontAwesomeIcon icon={faFileInvoiceDollar} /> Bilan Mécanicien
                </Nav.Link>
              </Nav>
            </Card.Body>
          </Card>
        </Col>

        {/* Contenu principal */}
        <Col xs={12} md={8} lg={9}>
          <Outlet />
        </Col>
      </Row>
    </Container>
  );
}

export default MecanicienLayout;
