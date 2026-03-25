// src/Pages/Menu.jsx

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar, Nav, Container, Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSignOutAlt,
  faHome,
  faSignInAlt,
  faUserPlus,
  faCalendarCheck,
  faScrewdriverWrench,
  faWarehouse,
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../shared/auth';

function Menu() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/acceuil');
  };

  return (
    <Navbar expand="lg" className="app-navbar">
      <Container className="app-shell">
        <Navbar.Brand as={Link} to="/acceuil" className="app-brand">
          <span className="app-brand-mark">GF</span>
          <span>
            <strong>Plateforme RDV</strong>
            <small>Gestion de rendez-vous pour l’atelier</small>
          </span>
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto app-nav-links">

            <Nav.Link as={Link} to="/acceuil" className="menu-link">
              <FontAwesomeIcon icon={faHome} /> Accueil
            </Nav.Link>

            {!isAuthenticated && (
              <>
                <Nav.Link as={Link} to="/connexion" className="menu-link">
                  <FontAwesomeIcon icon={faSignInAlt} /> Connexion
                </Nav.Link>

                <Nav.Link as={Link} to="/inscription" className="menu-link">
                  <FontAwesomeIcon icon={faUserPlus} /> Inscription
                </Nav.Link>
              </>
            )}

            {isAuthenticated && (
              <>
                {user?.role === 'owner' && (
                  <>
                    <Nav.Link as={Link} to="/pro/dashboard" className="menu-link">
                      <FontAwesomeIcon icon={faWarehouse} /> Tableau de bord
                    </Nav.Link>
                    <Nav.Link as={Link} to="/pro/rendez-vous" className="menu-link">
                      <FontAwesomeIcon icon={faCalendarCheck} /> Rendez-vous
                    </Nav.Link>
                    <Nav.Link as={Link} to="/pro/mecaniciens" className="menu-link">
                      <FontAwesomeIcon icon={faScrewdriverWrench} /> Employés
                    </Nav.Link>
                  </>
                )}
                <Button variant="dark" className="app-logout-btn ms-lg-3 mt-3 mt-lg-0" onClick={handleLogout}>
                  <FontAwesomeIcon icon={faSignOutAlt} /> Déconnexion
                </Button>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default Menu;
