// src/Pages/Menu.jsx

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Navbar, Nav, Container, Button } from 'react-bootstrap';
import { logout } from '../features/userSlice';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSignOutAlt,
  faHome,
  faSignInAlt,
  faUserPlus,
} from '@fortawesome/free-solid-svg-icons';

function Menu() {
  // On suppose que vous gérez l'état de l'authentification dans Redux
  const isAuthenticated = useSelector((state) => state.user.isAuthenticated);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    // Supprimez les infos du localStorage (si vous les stockez)
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Dispatch l'action de déconnexion
    dispatch(logout());
    // Redirige vers la page d'accueil/connexion (Acceuil) en mode 'login'
    navigate('/acceuil?mode=login');
  };

  return (
    <Navbar bg="dark" variant="dark" expand="lg" className="shadow-sm">
      <Container>
        {/* Nom ou logo de votre application */}
        <Navbar.Brand as={Link} to="/acceuil" className="fw-bold text-light">
          MonGarage
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">

            {/* Lien Accueil (pointe vers /acceuil) */}
            <Nav.Link as={Link} to="/acceuil" className="menu-link">
              <FontAwesomeIcon icon={faHome} /> Accueil
            </Nav.Link>

            {/* Si l'utilisateur n'est pas connecté */}
            {!isAuthenticated && (
              <>
                {/* Lien Connexion => /acceuil?mode=login */}
                <Nav.Link as={Link} to="/acceuil?mode=login" className="menu-link">
                  <FontAwesomeIcon icon={faSignInAlt} /> Connexion
                </Nav.Link>

                {/* Lien Inscription => /acceuil?mode=register */}
                <Nav.Link as={Link} to="/acceuil?mode=register" className="menu-link">
                  <FontAwesomeIcon icon={faUserPlus} /> Inscription
                </Nav.Link>
              </>
            )}

            {/* Si l'utilisateur est déjà connecté */}
            {isAuthenticated && (
              <>
                <Button variant="outline-light" className="ms-2" onClick={handleLogout}>
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
