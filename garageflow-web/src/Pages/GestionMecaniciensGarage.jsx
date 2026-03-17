import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Col, Container, Form, Row, Spinner, Table } from 'react-bootstrap';
import {
  createMecanicienRequest,
  deleteMecanicienRequest,
  fetchGarageMecaniciensRequest,
} from '../shared/api/mecanicienApi';

function flattenError(error) {
  if (!error) {
    return null;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (typeof error === 'object') {
    return Object.values(error).flat().join(' ');
  }
  return "Une erreur s'est produite.";
}

function GestionMecaniciensGarage() {
  const [mecaniciens, setMecaniciens] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    password2: '',
  });
  const [localMessage, setLocalMessage] = useState(null);

  const loadMecaniciens = async () => {
    try {
      setLoading(true);
      setError(null);
      setMecaniciens(await fetchGarageMecaniciensRequest());
    } catch (requestError) {
      setError(requestError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMecaniciens();
  }, []);

  const errorMessage = useMemo(() => flattenError(error), [error]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLocalMessage(null);
    try {
      setLoading(true);
      setError(null);
      const mecanicien = await createMecanicienRequest(formData);
      setMecaniciens((current) => [mecanicien, ...current]);
      setFormData({
        username: '',
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        password2: '',
      });
      setLocalMessage('Mecanicien ajoute au garage.');
    } catch (requestError) {
      setError(requestError);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (mecanicienId) => {
    setLocalMessage(null);
    try {
      setLoading(true);
      setError(null);
      await deleteMecanicienRequest(mecanicienId);
      setMecaniciens((current) => current.filter((mecanicien) => mecanicien.id !== mecanicienId));
    } catch (requestError) {
      setError(requestError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-5">
      <Row className="g-4">
        <Col lg={5}>
          <Card className="shadow-sm">
            <Card.Body>
              <Card.Title className="mb-3">Ajouter un mecanicien</Card.Title>

              {localMessage && <Alert variant="success">{localMessage}</Alert>}
              {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Nom d'utilisateur</Form.Label>
                  <Form.Control
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Prenom</Form.Label>
                      <Form.Control
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleChange}
                        required
                      />
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Nom</Form.Label>
                      <Form.Control
                        name="last_name"
                        value={formData.last_name}
                        onChange={handleChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Courriel</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Mot de passe</Form.Label>
                  <Form.Control
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Confirmation du mot de passe</Form.Label>
                  <Form.Control
                    type="password"
                    name="password2"
                    value={formData.password2}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>

                <Button type="submit" disabled={loading} className="w-100">
                  Ajouter au garage
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={7}>
          <Card className="shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <Card.Title className="mb-0">Equipe mecanique</Card.Title>
                {loading && <Spinner animation="border" size="sm" />}
              </div>

              <Table responsive hover>
                <thead>
                  <tr>
                    <th>Utilisateur</th>
                    <th>Nom</th>
                    <th>Courriel</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {mecaniciens.length === 0 && (
                    <tr>
                      <td colSpan="4" className="text-center text-muted">
                        Aucun mecanicien ajoute pour le moment.
                      </td>
                    </tr>
                  )}
                  {mecaniciens.map((mecanicien) => (
                    <tr key={mecanicien.id}>
                      <td>{mecanicien.username}</td>
                      <td>{`${mecanicien.first_name || ''} ${mecanicien.last_name || ''}`.trim() || '-'}</td>
                      <td>{mecanicien.email}</td>
                      <td className="text-end">
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDelete(mecanicien.id)}
                        >
                          Supprimer
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default GestionMecaniciensGarage;
