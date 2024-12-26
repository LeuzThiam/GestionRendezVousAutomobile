// src/Pages/Acceuil.jsx

import React, { useEffect } from 'react';
import { Button, Container, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

function Acceuil() {
  const navigate = useNavigate();

  // On suppose que `user` (ou null) est stocké dans le state Redux
  // et que `user.role` vaut "client" ou "mecanicien".
  const { user } = useSelector((state) => state.user);

  useEffect(() => {
    // Si user existe => on redirige selon son rôle
    if (user) {
      if (user.role === 'client') {
        navigate('/profil/client');
      } else if (user.role === 'mecanicien') {
        navigate('/profil/mecanicien');
      } else {
        // Si d'autres rôles existent, gérez-les ici
        // Par exemple un 'admin' => navigate('/admin')
      }
    }
    // S'il n'y a PAS de user, on reste sur cette page (Acceuil)
  }, [user, navigate]);

  // Si on arrive ici, c’est que user est null/undefined (pas connecté).
  return (
    <Container 
      className="d-flex justify-content-center align-items-center" 
      style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}
    >
      <Row>
        <Col className="text-center">
          <h1 className="mb-4">Bienvenue sur la plateforme</h1>
          <p className="mb-5">
            Veuillez vous connecter ou créer un compte
          </p>

          <div>
            <Button 
              variant="primary" 
              className="mx-2"
              onClick={() => navigate('/connexion')}
            >
              Connexion
            </Button>

            <Button 
              variant="success" 
              className="mx-2"
              onClick={() => navigate('/inscription')}
            >
              Inscription
            </Button>
          </div>
        </Col>
      </Row>
    </Container>
  );
}

export default Acceuil;
