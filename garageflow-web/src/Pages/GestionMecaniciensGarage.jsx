import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Button, Card, Col, Container, Form, Row, Spinner } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faEnvelope,
  faKey,
  faPlus,
  faScrewdriverWrench,
  faTrash,
  faUserGear,
  faUsers,
} from '@fortawesome/free-solid-svg-icons';
import {
  createMecanicienRequest,
  deleteMecanicienRequest,
  fetchGarageMecaniciensRequest,
} from '../api/mecaniciens';

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

function buildInitials(mecanicien) {
  const first = mecanicien.first_name?.[0] || '';
  const last = mecanicien.last_name?.[0] || '';
  return (first + last).toUpperCase() || 'MG';
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

  const stats = useMemo(() => {
    return {
      total: mecaniciens.length,
      withEmail: mecaniciens.filter((item) => Boolean(item.email)).length,
    };
  }, [mecaniciens]);

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
    <Container className="py-5 mecaniciens-page">
      <Row className="g-4 mb-4">
        <Col xl={8}>
          <Card className="mecaniciens-hero border-0 shadow-sm h-100">
            <Card.Body className="p-4 p-lg-5">
              <div className="d-flex flex-wrap justify-content-between align-items-start gap-3">
                <div>
                  <p className="mecaniciens-eyebrow mb-2">Equipe garage</p>
                  <h1 className="mb-3 d-flex align-items-center gap-3">
                    <span className="mecaniciens-orb">
                      <FontAwesomeIcon icon={faScrewdriverWrench} />
                    </span>
                    Gerer les mecaniciens
                  </h1>
                  <p className="mecaniciens-hero-text mb-0">
                    Creez les comptes de votre equipe et gardez une vision claire des mecaniciens
                    actifs dans votre garage.
                  </p>
                </div>

                <div className="mecaniciens-summary">
                  <div>
                    <span>Total equipe</span>
                    <strong>{stats.total}</strong>
                  </div>
                  <div>
                    <span>Courriels renseignes</span>
                    <strong>{stats.withEmail}</strong>
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col xl={4}>
          <Card className="mecaniciens-side-card border-0 shadow-sm h-100">
            <Card.Body className="p-4">
              <div className="mecaniciens-panel-head mb-3">
                <span className="mecaniciens-panel-icon">
                  <FontAwesomeIcon icon={faUsers} />
                </span>
                <div>
                  <Card.Title className="mb-1">Organisation</Card.Title>
                  <p className="small text-muted mb-0">
                    Structure minimale pour un garage bien pilote.
                  </p>
                </div>
              </div>

              <div className="mecaniciens-checklist">
                <div>Ajouter chaque mecanicien avec un compte individuel.</div>
                <div>Renseigner un courriel professionnel pour la connexion.</div>
                <div>Supprimer les comptes inutiles pour garder un espace propre.</div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {localMessage && <Alert variant="success">{localMessage}</Alert>}
      {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}

      <Row className="g-4 align-items-start">
        <Col lg={5}>
          <Card className="border-0 shadow-sm mecaniciens-form-card">
            <Card.Body className="p-4">
              <div className="mecaniciens-panel-head mb-4">
                <span className="mecaniciens-panel-icon">
                  <FontAwesomeIcon icon={faPlus} />
                </span>
                <div>
                  <Card.Title className="mb-1">Ajouter un mecanicien</Card.Title>
                  <p className="small text-muted mb-0">
                    Creez un acces individuel rattache au garage.
                  </p>
                </div>
              </div>

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Nom d utilisateur</Form.Label>
                  <Form.Control
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="meca.thiam"
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
                        placeholder="Moussa"
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
                        placeholder="Thiam"
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
                    placeholder="mecanicien@garage.com"
                    required
                  />
                </Form.Group>

                <Row>
                  <Col md={6}>
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
                  </Col>

                  <Col md={6}>
                    <Form.Group className="mb-4">
                      <Form.Label>Confirmation</Form.Label>
                      <Form.Control
                        type="password"
                        name="password2"
                        value={formData.password2}
                        onChange={handleChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Button type="submit" disabled={loading} className="w-100 mecaniciens-submit">
                  {loading ? 'Enregistrement...' : 'Ajouter au garage'}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={7}>
          <Card className="border-0 shadow-sm mecaniciens-list-card">
            <Card.Body className="p-4">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                  <Card.Title className="mb-1">Equipe mecanique</Card.Title>
                  <p className="small text-muted mb-0">
                    Vue d ensemble des mecaniciens rattaches au garage.
                  </p>
                </div>
                {loading && <Spinner animation="border" size="sm" />}
              </div>

              {mecaniciens.length === 0 ? (
                <div className="mecaniciens-empty-state">
                  Aucun mecanicien ajoute pour le moment.
                </div>
              ) : (
                <div className="mecaniciens-grid">
                  {mecaniciens.map((mecanicien) => (
                    <article key={mecanicien.id} className="mecanicien-card">
                      <div className="mecanicien-card-head">
                        <div className="mecanicien-avatar">
                          {buildInitials(mecanicien)}
                        </div>
                        <Badge bg="light" text="dark">Mecanicien</Badge>
                      </div>

                      <h3 className="mecanicien-name">
                        {`${mecanicien.first_name || ''} ${mecanicien.last_name || ''}`.trim() || mecanicien.username}
                      </h3>

                      <div className="mecanicien-meta">
                        <div>
                          <FontAwesomeIcon icon={faUserGear} />
                          <span>{mecanicien.username}</span>
                        </div>
                        <div>
                          <FontAwesomeIcon icon={faEnvelope} />
                          <span>{mecanicien.email || 'Courriel non renseigne'}</span>
                        </div>
                        <div>
                          <FontAwesomeIcon icon={faKey} />
                          <span>Acces individuel actif</span>
                        </div>
                      </div>

                      <div className="mecanicien-card-actions">
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDelete(mecanicien.id)}
                        >
                          <FontAwesomeIcon icon={faTrash} className="me-2" />
                          Supprimer
                        </Button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default GestionMecaniciensGarage;
