import React, { useEffect } from 'react';
import { Button, Container, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../../../shared/auth';

export default function AcceuilPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      if (user.role === 'owner') {
        navigate('/pro/dashboard');
      } else if (user.role === 'client') {
        navigate('/profil/client');
      } else if (user.role === 'employe' || user.role === 'mecanicien') {
        navigate('/profil/mecanicien');
      }
    }
  }, [user, navigate]);

  return (
    <Container
      className="d-flex justify-content-center align-items-center"
      style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}
    >
      <Row>
        <Col className="text-center">
          <h1 className="mb-4">Bienvenue sur la plateforme</h1>
          <p className="mb-5">
            Créez votre établissement, connectez votre équipe et gérez vos rendez-vous.
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

