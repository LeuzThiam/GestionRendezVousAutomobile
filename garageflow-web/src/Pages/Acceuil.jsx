// src/Pages/Acceuil.jsx

import React, { useEffect } from 'react';
import { Button, Container, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../shared/auth';

function Acceuil() {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    // Si user existe => on redirige selon son rôle
    if (user) {
      if (user.role === 'owner') {
        navigate('/garage/dashboard');
      } else if (user.role === 'client') {
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
            Creez votre garage, connectez votre equipe et gerez vos rendez-vous.
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
