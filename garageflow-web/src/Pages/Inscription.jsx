import React from 'react';
import { Formik } from 'formik';
import { useNavigate } from 'react-router-dom';
import { Alert, Form, Button, Container, Row, Col } from 'react-bootstrap';

import { registerClientRequest, registerGarageOwnerRequest } from '../api/auth';

const OWNER_ROLE = 'owner';
const CLIENT_ROLE = 'client';

const initialValues = {
  account_type: OWNER_ROLE,
  garage_name: '',
  garage_slug: '',
  phone: '',
  address: '',
  description: '',
  username: '',
  first_name: '',
  last_name: '',
  email: '',
  password: '',
  password2: '',
  error: '',
};

function normalizeApiError(payload) {
  if (typeof payload === 'string') {
    return payload;
  }

  if (payload && typeof payload === 'object') {
    return Object.values(payload).flat().join(' ') || "Erreur d'inscription.";
  }

  return "Erreur d'inscription.";
}

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
            <h2 className="text-center mb-2">Créer un compte</h2>
            <p className="text-center text-muted mb-4">
              Choisissez votre profil pour rejoindre la plateforme.
            </p>

            <Formik
              initialValues={initialValues}
              validate={(values) => {
                const errors = {};
                const isOwner = values.account_type === OWNER_ROLE;

                if (!values.account_type) {
                  errors.account_type = 'Requis';
                }

                if (isOwner && !values.garage_name) {
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

                if (values.password && values.password.length < 8) {
                  errors.password = 'Le mot de passe doit contenir au moins 8 caracteres.';
                }

                if (values.password !== values.password2) {
                  errors.password2 = 'Les mots de passe ne correspondent pas.';
                }

                return errors;
              }}
              onSubmit={(values, { setSubmitting, setStatus }) => {
                const isOwner = values.account_type === OWNER_ROLE;
                const request = isOwner
                  ? registerGarageOwnerRequest({
                      garage_name: values.garage_name,
                      garage_slug: values.garage_slug,
                      phone: values.phone,
                      address: values.address,
                      description: values.description,
                      username: values.username,
                      first_name: values.first_name,
                      last_name: values.last_name,
                      email: values.email,
                      password: values.password,
                      password2: values.password2,
                    })
                  : registerClientRequest({
                      username: values.username,
                      first_name: values.first_name,
                      last_name: values.last_name,
                      email: values.email,
                      password: values.password,
                      password2: values.password2,
                    });

                setStatus(null);
                request
                  .then(() => {
                    navigate('/connexion');
                  })
                  .catch((error) => {
                    setStatus(normalizeApiError(error.response?.data));
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
              }) => {
                const isOwner = values.account_type === OWNER_ROLE;

                return (
                  <Form onSubmit={handleSubmit}>
                    {status && (
                      <Alert variant="danger" className="mb-3">
                        {status}
                      </Alert>
                    )}

                    <Form.Group controlId="formAccountType" className="mb-3">
                      <Form.Label>Type de profil</Form.Label>
                      <Form.Select
                        name="account_type"
                        value={values.account_type}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        isInvalid={touched.account_type && errors.account_type}
                      >
                        <option value={OWNER_ROLE}>Proprietaire de garage</option>
                        <option value={CLIENT_ROLE}>Client</option>
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">
                        {errors.account_type}
                      </Form.Control.Feedback>
                    </Form.Group>

                    {isOwner ? (
                      <>
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

                        <Form.Group controlId="formGarageSlugOwner" className="mb-3">
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
                          <Form.Label>Telephone</Form.Label>
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

                        <Form.Group controlId="formGarageDescription" className="mb-3">
                          <Form.Label>Description du garage</Form.Label>
                          <Form.Control
                            as="textarea"
                            rows={3}
                            name="description"
                            placeholder="Presentez votre garage, vos specialites ou votre approche client"
                            value={values.description}
                            onChange={handleChange}
                            onBlur={handleBlur}
                          />
                        </Form.Group>
                      </>
                    ) : (
                      <Alert variant="info" className="mb-3">
                        Le compte client est autonome. Vous pourrez chercher un garage et prendre
                        rendez-vous plus tard depuis votre espace.
                      </Alert>
                    )}

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

                    <Form.Group controlId="formFirstName" className="mb-3">
                      <Form.Label>Prenom</Form.Label>
                      <Form.Control
                        type="text"
                        name="first_name"
                        placeholder="Prenom"
                        value={values.first_name}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        isInvalid={touched.first_name && errors.first_name}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.first_name}
                      </Form.Control.Feedback>
                    </Form.Group>

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

                    <Form.Group controlId="formConfirmPassword" className="mb-4">
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
                      {isOwner ? 'Creer mon garage' : 'Creer mon compte client'}
                    </Button>
                  </Form>
                );
              }}
            </Formik>
          </div>
        </Col>
      </Row>
    </Container>
  );
}

export default Inscription;
