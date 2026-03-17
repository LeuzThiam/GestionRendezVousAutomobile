import React from 'react';
import { Formik } from 'formik';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Alert, Form, Button, Container, Row, Col } from 'react-bootstrap';
import { API_BASE_URL } from '../config/api';

function Inscription() {
  const navigate = useNavigate();

  return (
    <Container
      className="d-flex justify-content-center align-items-center"
      style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}
    >
      <Row className="w-100">
        <Col xs={12} md={8} lg={6} className="mx-auto">
          <div className="p-5 border rounded bg-white shadow-lg">
            <h2 className="text-center mb-4">Créer un compte</h2>

            <Formik
              initialValues={{
                garage_name: '',
                garage_slug: '',
                phone: '',
                address: '',
                username: '',
                first_name: '',
                last_name: '',
                email: '',
                password: '',
                password2: '',
                error: '',
              }}
              validate={(values) => {
                const errors = {};

                if (!values.garage_name) {
                  errors.garage_name = 'Requis';
                }

                if (!values.username) {
                  errors.username = 'Requis';
                }

                if (!values.first_name) {
                  errors.first_name = 'Requis';
                }

                if (!values.last_name) {
                  errors.last_name = 'Requis';
                }

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

                if (!values.password2) {
                  errors.password2 = 'Requis';
                }

                if (values.password !== values.password2) {
                  errors.password2 = 'Les mots de passe ne correspondent pas.';
                }

                return errors;
              }}
              onSubmit={(values, { setSubmitting, setStatus }) => {
                setStatus(null);
                axios
                  .post(`${API_BASE_URL}/api/garages/register/`, {
                    garage_name: values.garage_name,
                    garage_slug: values.garage_slug,
                    phone: values.phone,
                    address: values.address,
                    username: values.username,
                    first_name: values.first_name,
                    last_name: values.last_name,
                    email: values.email,
                    password: values.password,
                    password2: values.password2,
                  })
                  .then(() => {
                    navigate('/connexion');
                  })
                  .catch((error) => {
                    const payload = error.response?.data;
                    if (typeof payload === 'string') {
                      setStatus(payload);
                    } else if (payload && typeof payload === 'object') {
                      const firstError = Object.values(payload).flat().join(' ');
                      setStatus(firstError || "Erreur d'inscription.");
                    } else {
                      setStatus("Erreur d'inscription.");
                    }
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
                errors,
                status,
              }) => (
                <Form onSubmit={handleSubmit}>
                  {status && (
                    <Alert variant="danger" className="mb-3">
                      {status}
                    </Alert>
                  )}

                  <Form.Group controlId="formGarageName" className="mb-3">
                    <Form.Label>Nom du garage</Form.Label>
                    <Form.Control
                      type="text"
                      name="garage_name"
                      placeholder="Garage Flow Montreal"
                      value={values.garage_name}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      isInvalid={touched.garage_name && errors.garage_name}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.garage_name}
                    </Form.Control.Feedback>
                  </Form.Group>

                  <Form.Group controlId="formGarageSlug" className="mb-3">
                    <Form.Label>Slug public du garage</Form.Label>
                    <Form.Control
                      type="text"
                      name="garage_slug"
                      placeholder="garage-flow-montreal"
                      value={values.garage_slug}
                      onChange={handleChange}
                      onBlur={handleBlur}
                    />
                  </Form.Group>

                  <Form.Group controlId="formPhone" className="mb-3">
                    <Form.Label>Téléphone</Form.Label>
                    <Form.Control
                      type="text"
                      name="phone"
                      placeholder="5140000000"
                      value={values.phone}
                      onChange={handleChange}
                      onBlur={handleBlur}
                    />
                  </Form.Group>

                  <Form.Group controlId="formAddress" className="mb-3">
                    <Form.Label>Adresse</Form.Label>
                    <Form.Control
                      type="text"
                      name="address"
                      placeholder="123 Rue du Test, Montreal"
                      value={values.address}
                      onChange={handleChange}
                      onBlur={handleBlur}
                    />
                  </Form.Group>

                  {/* CHAMP USERNAME */}
                  <Form.Group controlId="formUsername" className="mb-3">
                    <Form.Label>Nom d'utilisateur</Form.Label>
                    <Form.Control
                      type="text"
                      name="username"
                      placeholder="Nom d'utilisateur"
                      value={values.username}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      isInvalid={touched.username && errors.username}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.username}
                    </Form.Control.Feedback>
                  </Form.Group>

                  {/* CHAMP PRENOM (first_name) */}
                  <Form.Group controlId="formFirstName" className="mb-3">
                    <Form.Label>Prénom</Form.Label>
                    <Form.Control
                      type="text"
                      name="first_name"
                      placeholder="Prénom"
                      value={values.first_name}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      isInvalid={touched.first_name && errors.first_name}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.first_name}
                    </Form.Control.Feedback>
                  </Form.Group>

                  {/* CHAMP NOM (last_name) */}
                  <Form.Group controlId="formLastName" className="mb-3">
                    <Form.Label>Nom</Form.Label>
                    <Form.Control
                      type="text"
                      name="last_name"
                      placeholder="Nom"
                      value={values.last_name}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      isInvalid={touched.last_name && errors.last_name}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.last_name}
                    </Form.Control.Feedback>
                  </Form.Group>

                  {/* CHAMP EMAIL */}
                  <Form.Group controlId="formEmail" className="mb-3">
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                      type="email"
                      name="email"
                      placeholder="Votre email"
                      value={values.email}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      isInvalid={touched.email && errors.email}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.email}
                    </Form.Control.Feedback>
                  </Form.Group>

                  {/* CHAMP MOT DE PASSE */}
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

                  {/* CHAMP CONFIRMATION MOT DE PASSE (password2) */}
                  <Form.Group controlId="formConfirmPassword" className="mb-3">
                    <Form.Label>Confirmer le mot de passe</Form.Label>
                    <Form.Control
                      type="password"
                      name="password2"
                      placeholder="Confirmez le mot de passe"
                      value={values.password2}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      isInvalid={touched.password2 && errors.password2}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.password2}
                    </Form.Control.Feedback>
                  </Form.Group>

                  <Button
                    variant="primary"
                    type="submit"
                    disabled={isSubmitting}
                    className="w-100 py-2"
                  >
                    Créer mon garage
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

export default Inscription;
