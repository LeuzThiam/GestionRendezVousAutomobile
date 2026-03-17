// src/Pages/Connexion.jsx
import React, { useState } from 'react';
import { Formik } from 'formik';
import { useNavigate } from 'react-router-dom';
import { Form, Button, Container, Row, Col, Alert } from 'react-bootstrap';
import { loginRequest } from '../api/auth';
import { useAuth } from '../shared/auth/AuthContext';

function Connexion() {
  const [errorMessage, setErrorMessage] = useState(null);
  const navigate = useNavigate();
  const { login } = useAuth();

  return (
    <Container
      className="d-flex justify-content-center align-items-center"
      style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}
    >
      <Row className="w-100">
        <Col xs={12} md={6} lg={4} className="mx-auto">
          <div className="p-4 border rounded bg-white shadow-sm">
            <h2 className="text-center mb-4">Connexion</h2>

            {/* Affichage d'une alerte si une erreur survient */}
            {errorMessage && (
              <Alert
                variant="danger"
                onClose={() => setErrorMessage(null)}
                dismissible
              >
                {errorMessage}
              </Alert>
            )}

            <Formik
              initialValues={{
                username: '',
                password: ''
              }}
              validate={(values) => {
                const errors = {};

                // Vérifier username
                if (!values.username) {
                  errors.username = 'Requis';
                }

                // Vérifier password
                if (!values.password) {
                  errors.password = 'Requis';
                }

                return errors;
              }}
              onSubmit={(values, { setSubmitting }) => {
                setErrorMessage(null);
                setSubmitting(true);

                loginRequest({
                    username: values.username,
                    password: values.password
                  })
                  .then((data) => {
                    /*
                      Réponse attendue :
                      {
                        "refresh": "...",
                        "access": "...",
                        "role": "client" ou "mecanicien"
                      }
                    */
                    // Vérifier qu'on a un token d'accès
                    if (!data.access) {
                      throw new Error("Le serveur n'a pas renvoyé de token d'accès ('access').");
                    }

                    // Vérifier le rôle
                    if (!data.role) {
                      throw new Error("Le serveur n'a pas renvoyé de rôle. Vérifiez votre API.");
                    }

                    // Créer un objet user, le stocker dans Redux
                    const user = { ...data, role: data.role };
                    login(user, { access: data.access, refresh: data.refresh });

                    // Redirection selon le rôle
                    if (data.role === 'owner') {
                      navigate('/garage/dashboard');
                      return;
                    }
                    if (data.role === 'client') {
                      navigate('/profil/client');
                      return;
                    }
                    if (data.role === 'mecanicien') {
                      navigate('/profil/mecanicien');
                      return;
                    }
                    setErrorMessage("Rôle inconnu. Impossible de rediriger.");
                  })
                  .catch((error) => {
                    // Échec de la connexion
                    setErrorMessage(
                      "Informations de connexion invalides ou serveur indisponible."
                    );
                    console.error('Erreur de connexion :', error.message);
                  })
                  .finally(() => {
                    setSubmitting(false);
                  });
              }}
            >
              {({
                isSubmitting,
                handleChange,
                handleBlur,
                handleSubmit,
                values,
                touched,
                errors
              }) => (
                <Form onSubmit={handleSubmit}>
                  <Form.Group controlId="formUsername" className="mb-3">
                    <Form.Label>Nom d'utilisateur</Form.Label>
                    <Form.Control
                      type="text"
                      name="username"
                      placeholder="Votre nom d'utilisateur"
                      value={values.username}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      isInvalid={touched.username && errors.username}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.username}
                    </Form.Control.Feedback>
                  </Form.Group>

                  <Form.Group controlId="formPassword" className="mb-3">
                    <Form.Label>Mot de passe</Form.Label>
                    <Form.Control
                      type="password"
                      name="password"
                      placeholder="Mot de passe"
                      value={values.password}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      isInvalid={touched.password && errors.password}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.password}
                    </Form.Control.Feedback>
                  </Form.Group>

                  <Button
                    variant="primary"
                    type="submit"
                    disabled={isSubmitting}
                    className="w-100"
                  >
                    Se connecter
                  </Button>
                </Form>
              )}
            </Formik>
          </div>
        </Col>
      </Row>
    </Container>
  );
}

export default Connexion;
