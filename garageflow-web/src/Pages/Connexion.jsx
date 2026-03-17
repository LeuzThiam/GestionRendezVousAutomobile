// src/Pages/Connexion.jsx
import React, { useState } from 'react';
import { Formik } from 'formik';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { login } from '../features/userSlice';
import { Form, Button, Container, Row, Col, Alert } from 'react-bootstrap';
import { API_BASE_URL } from '../config/api';

function Connexion() {
  const [errorMessage, setErrorMessage] = useState(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();

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

                axios
                  .post(`${API_BASE_URL}/api/users/token/`, {
                    username: values.username,
                    password: values.password
                  })
                  .then((response) => {
                    /*
                      Réponse attendue :
                      {
                        "refresh": "...",
                        "access": "...",
                        "role": "client" ou "mecanicien"
                      }
                    */
                    const data = response.data;

                    // Vérifier qu'on a un token d'accès
                    if (!data.access) {
                      throw new Error("Le serveur n'a pas renvoyé de token d'accès ('access').");
                    }

                    // Stocker le token
                    localStorage.setItem('token', data.access);

                    // Optionnel : stocker le refresh si fourni
                    if (data.refresh) {
                      localStorage.setItem('refresh', data.refresh);
                    }

                    // Vérifier le rôle
                    if (!data.role) {
                      throw new Error("Le serveur n'a pas renvoyé de rôle. Vérifiez votre API.");
                    }

                    // Créer un objet user, le stocker dans Redux
                    const user = { ...data, role: data.role };
                    localStorage.setItem('user', JSON.stringify(user));
                    dispatch(login(user));

                    // Redirection selon le rôle
                    if (data.role === 'client') {
                      navigate('/profil/client'); // par défaut
                    } else if (data.role === 'mecanicien') {
                      navigate('/profil/mecanicien'); // par défaut
                    } else {
                      setErrorMessage("Rôle inconnu. Impossible de rediriger.");
                    }
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
