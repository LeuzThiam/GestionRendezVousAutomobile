import React from 'react';
import { Formik } from 'formik';
import { useNavigate } from 'react-router-dom';
import { Alert, Form, Button, Container, Row, Col } from 'react-bootstrap';

import { registerClientRequest, registerOrganizationOwnerRequest } from '../../../api/auth';

const OWNER_ROLE = 'owner';
const CLIENT_ROLE = 'client';

const FORMIK_FIELD_KEYS = new Set([
  'account_type',
  'organization_name',
  'username',
  'first_name',
  'last_name',
  'email',
  'password',
  'password2',
]);

const initialValues = {
  account_type: OWNER_ROLE,
  organization_name: '',
  username: '',
  first_name: '',
  last_name: '',
  email: '',
  password: '',
  password2: '',
};

function mapApiErrorsToFormik(payload) {
  const fieldErrors = {};
  const generalParts = [];

  if (!payload || typeof payload !== 'object') {
    return { fieldErrors, general: null };
  }

  for (const [key, value] of Object.entries(payload)) {
    const raw = Array.isArray(value) ? value[0] : value;
    const text = typeof raw === 'string' ? raw : String(raw);

    if (key === 'non_field_errors') {
      const list = Array.isArray(value) ? value : [value];
      list.forEach((item) => {
        const m = typeof item === 'string' ? item : String(item);
        if (m) generalParts.push(m);
      });
      continue;
    }

    if (key === 'detail') {
      generalParts.push(text);
      continue;
    }

    if (FORMIK_FIELD_KEYS.has(key)) {
      fieldErrors[key] = text;
      continue;
    }

    if (key === 'organization_slug' || key === 'garage_slug') {
      fieldErrors.organization_name = text;
      continue;
    }

    generalParts.push(`${key}: ${text}`);
  }

  return {
    fieldErrors,
    general: generalParts.length ? generalParts.join(' ') : null,
  };
}

export default function InscriptionPage() {
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
              Quelques informations suffisent. Vous pourrez compléter votre fiche (adresse, téléphone,
              présentation) depuis votre espace après connexion.
            </p>

            <Formik
              initialValues={initialValues}
              validate={(values) => {
                const errors = {};
                const isOwner = values.account_type === OWNER_ROLE;

                if (!values.account_type) {
                  errors.account_type = 'Requis';
                }

                if (isOwner && !values.organization_name?.trim()) {
                  errors.organization_name = 'Requis';
                }

                if (!values.username?.trim()) {
                  errors.username = 'Requis';
                }

                if (!values.first_name?.trim()) {
                  errors.first_name = 'Requis';
                }

                if (!values.last_name?.trim()) {
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
                  errors.password = 'Le mot de passe doit contenir au moins 8 caractères.';
                }

                if (values.password !== values.password2) {
                  errors.password2 = 'Les mots de passe ne correspondent pas.';
                }

                return errors;
              }}
              onSubmit={(values, { setSubmitting, setStatus, setErrors, setFieldTouched }) => {
                const isOwner = values.account_type === OWNER_ROLE;
                const request = isOwner
                  ? registerOrganizationOwnerRequest({
                      organization_name: values.organization_name.trim(),
                      username: values.username.trim(),
                      first_name: values.first_name.trim(),
                      last_name: values.last_name.trim(),
                      email: values.email.trim(),
                      password: values.password,
                      password2: values.password2,
                    })
                  : registerClientRequest({
                      username: values.username.trim(),
                      first_name: values.first_name.trim(),
                      last_name: values.last_name.trim(),
                      email: values.email.trim(),
                      password: values.password,
                      password2: values.password2,
                    });

                setStatus(null);
                request
                  .then(() => {
                    navigate('/connexion');
                  })
                  .catch((error) => {
                    const { fieldErrors, general } = mapApiErrorsToFormik(error.response?.data);
                    setErrors(fieldErrors);
                    Object.keys(fieldErrors).forEach((k) => setFieldTouched(k, true, false));
                    setStatus(general);
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
                        isInvalid={touched.account_type && !!errors.account_type}
                      >
                        <option value={OWNER_ROLE}>Propriétaire d&apos;organisation</option>
                        <option value={CLIENT_ROLE}>Client</option>
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">
                        {errors.account_type}
                      </Form.Control.Feedback>
                    </Form.Group>

                    {isOwner ? (
                      <Form.Group controlId="formOrganizationName" className="mb-3">
                        <Form.Label>Nom de l&apos;organisation</Form.Label>
                        <Form.Control
                          type="text"
                          name="organization_name"
                          placeholder="Ex. Salon Dupont"
                          value={values.organization_name}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          isInvalid={touched.organization_name && !!errors.organization_name}
                        />
                        <Form.Text className="text-muted">
                          L&apos;identifiant public de votre page sera généré automatiquement à partir de ce nom.
                        </Form.Text>
                        <Form.Control.Feedback type="invalid">
                          {errors.organization_name}
                        </Form.Control.Feedback>
                      </Form.Group>
                    ) : (
                      <Alert variant="info" className="mb-3">
                        Le compte client est autonome. Vous pourrez chercher un établissement et prendre
                        rendez-vous depuis votre espace.
                      </Alert>
                    )}

                    <Form.Group controlId="formUsername" className="mb-3">
                      <Form.Label>Nom d&apos;utilisateur</Form.Label>
                      <Form.Control
                        type="text"
                        name="username"
                        placeholder="Lettres, chiffres et _"
                        value={values.username}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        isInvalid={touched.username && !!errors.username}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.username}
                      </Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group controlId="formFirstName" className="mb-3">
                      <Form.Label>Prénom</Form.Label>
                      <Form.Control
                        type="text"
                        name="first_name"
                        placeholder="Prénom"
                        value={values.first_name}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        isInvalid={touched.first_name && !!errors.first_name}
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
                        isInvalid={touched.last_name && !!errors.last_name}
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
                        isInvalid={touched.email && !!errors.email}
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
                        placeholder="Au moins 8 caractères"
                        value={values.password}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        isInvalid={touched.password && !!errors.password}
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
                        isInvalid={touched.password2 && !!errors.password2}
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
                      {isOwner ? 'Créer mon compte établissement' : 'Créer mon compte client'}
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

