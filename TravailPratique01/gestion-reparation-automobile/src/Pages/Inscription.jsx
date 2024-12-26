import React from 'react';
import { Formik } from 'formik';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Form, Button, Container, Row, Col } from 'react-bootstrap';

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
                username: '',
                first_name: '',
                last_name: '',
                email: '',
                password: '',
                password2: '',
                date_naissance: '',  // correspond à votre serializer
                role: 'client',      // valeur par défaut si vous voulez
              }}
              validate={(values) => {
                const errors = {};

                // 1) Username
                if (!values.username) {
                  errors.username = 'Requis';
                }

                // 2) Prénom (first_name)
                if (!values.first_name) {
                  errors.first_name = 'Requis';
                }

                // 3) Nom (last_name)
                if (!values.last_name) {
                  errors.last_name = 'Requis';
                }

                // 4) Email
                if (!values.email) {
                  errors.email = 'Requis';
                } else if (
                  !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(values.email)
                ) {
                  errors.email = 'Adresse email invalide';
                }

                // 5) Mot de passe
                if (!values.password) {
                  errors.password = 'Requis';
                }

                // 6) Confirmation mot de passe
                if (values.password !== values.password2) {
                  errors.password2 = 'Les mots de passe ne correspondent pas.';
                }

                // 7) Date de naissance
                if (!values.date_naissance) {
                  errors.date_naissance = 'Requis';
                }

                return errors;
              }}
              onSubmit={(values, { setSubmitting }) => {
                // Pour débogage
                console.log("Soumission du formulaire d'inscription:", values);

                axios
                  .post('http://127.0.0.1:8000/api/users/register/', {
                    username: values.username,
                    first_name: values.first_name,
                    last_name: values.last_name,
                    email: values.email,
                    password: values.password,
                    password2: values.password2,
                    date_naissance: values.date_naissance,
                    role: values.role,
                  })
                  .then((response) => {
                    console.log('Inscription réussie:', response.data);
                    // Après succès, rediriger l'utilisateur vers la page de connexion, par ex:
                    navigate('/connexion');
                  })
                  .catch((error) => {
                    console.error("Erreur d'inscription:", error.response?.data || error);
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
              }) => (
                <Form onSubmit={handleSubmit}>
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

                  {/* CHAMP DATE NAISSANCE */}
                  <Form.Group controlId="formDateNaissance" className="mb-3">
                    <Form.Label>Date de naissance</Form.Label>
                    <Form.Control
                      type="date"
                      name="date_naissance"
                      value={values.date_naissance}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      isInvalid={touched.date_naissance && errors.date_naissance}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.date_naissance}
                    </Form.Control.Feedback>
                  </Form.Group>

                  {/* CHAMP ROLE (client / mecanicien) */}
                  <Form.Group controlId="formRole" className="mb-4">
                    <Form.Label>Rôle</Form.Label>
                    <Form.Control
                      as="select"
                      name="role"
                      value={values.role}
                      onChange={handleChange}
                      onBlur={handleBlur}
                    >
                      <option value="client">Client</option>
                      <option value="mecanicien">Mécanicien</option>
                    </Form.Control>
                  </Form.Group>

                  <Button
                    variant="primary"
                    type="submit"
                    disabled={isSubmitting}
                    className="w-100 py-2"
                  >
                    S'inscrire
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
