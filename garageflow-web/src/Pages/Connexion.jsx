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
                email: '',
                password: ''
              }}
              validate={(values) => {
                const errors = {};

                if (!values.email) {
                  errors.email = 'Requis';
                } else if (
                  !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(values.email)
                ) {
                  errors.email = 'Adresse email invalide';
                }

                if (!values.password) {
                  errors.password = 'Requis';
                }

                return errors;
              }}
              onSubmit={(values, { setSubmitting }) => {
                setErrorMessage(null);
                setSubmitting(true);

                loginRequest({
                    email: values.email,
                    password: values.password
                  })
                  .then((data) => {
                    if (!data.access) {
                      throw new Error("Le serveur n'a pas renvoyé de token d'accès ('access').");
                    }

                    if (!data.user?.role) {
                      throw new Error("Le serveur n'a pas renvoyé d'utilisateur valide.");
                    }

                    login(data.user, { access: data.access, refresh: data.refresh });

                    if (data.user.role === 'owner') {
                      navigate('/garage/dashboard');
                      return;
                    }
                    if (data.user.role === 'client') {
                      navigate('/profil/client');
                      return;
                    }
                    if (data.user.role === 'mecanicien') {
                      navigate('/profil/mecanicien');
                      return;
                    }
                    setErrorMessage("Role inconnu. Impossible de rediriger.");
                  })
                  .catch((error) => {
                    const payload = error.response?.data;
                    if (payload?.non_field_errors?.length) {
                      setErrorMessage(payload.non_field_errors[0]);
                    } else {
                      setErrorMessage(
                        "Identifiants invalides."
                      );
                    }
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
                  <Form.Group controlId="formEmail" className="mb-3">
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                      type="email"
                      name="email"
                      placeholder="Votre adresse email"
                      value={values.email}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      isInvalid={touched.email && errors.email}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.email}
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
