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
  faWrench,
} from '@fortawesome/free-solid-svg-icons';
import {
  createMecanicienRequest,
  deleteMecanicienRequest,
  fetchGarageMecaniciensRequest,
  updateMecanicienRequest,
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

const emptyForm = {
  username: '',
  first_name: '',
  last_name: '',
  email: '',
  password: '',
  password2: '',
  specialites: '',
};

function GestionMecaniciensGarage() {
  const [mecaniciens, setMecaniciens] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
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
      active: mecaniciens.filter((item) => item.is_active).length,
      withDisponibilites: mecaniciens.filter((item) => Number(item.disponibilites_count) > 0).length,
      busyToday: mecaniciens.filter((item) => Number(item.rdv_today_count) > 0).length,
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
      setFormData(emptyForm);
      setLocalMessage('Mecanicien ajoute au garage.');
    } catch (requestError) {
      setError(requestError);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (mecanicien) => {
    setLocalMessage(null);
    try {
      setLoading(true);
      setError(null);
      const updated = await updateMecanicienRequest(mecanicien.id, {
        is_active: !mecanicien.is_active,
      });
      setMecaniciens((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setLocalMessage(updated.is_active ? 'Mecanicien reactive.' : 'Mecanicien desactive.');
    } catch (requestError) {
      setError(requestError);
    } finally {
      setLoading(false);
    }
  };

  const handleSpecialitesUpdate = async (mecanicien, specialites) => {
    try {
      setLoading(true);
      setError(null);
      const updated = await updateMecanicienRequest(mecanicien.id, { specialites });
      setMecaniciens((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setLocalMessage('Specialites mises a jour.');
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
      setLocalMessage('Mecanicien supprime.');
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
                    Structurez votre equipe, ses competences et sa charge operationnelle sans supprimer brutalement des comptes utiles.
                  </p>
                </div>

                <div className="mecaniciens-summary">
                  <div>
                    <span>Total equipe</span>
                    <strong>{stats.total}</strong>
                  </div>
                  <div>
                    <span>Actifs</span>
                    <strong>{stats.active}</strong>
                  </div>
                  <div>
                    <span>Avec dispos</span>
                    <strong>{stats.withDisponibilites}</strong>
                  </div>
                  <div>
                    <span>Occupes aujourd hui</span>
                    <strong>{stats.busyToday}</strong>
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
                    Statut, competences et charge doivent rester visibles.
                  </p>
                </div>
              </div>

              <div className="mecaniciens-checklist">
                <div>Desactiver un mecanicien absent plutot que le supprimer trop vite.</div>
                <div>Renseigner ses specialites pour faciliter les affectations.</div>
                <div>Verifier la charge du jour et les rendez-vous confirmes avant toute action.</div>
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

                <Form.Group className="mb-3">
                  <Form.Label>Specialites / competences</Form.Label>
                  <Form.Control
                    name="specialites"
                    value={formData.specialites}
                    onChange={handleChange}
                    placeholder="Freinage, moteur, diagnostic"
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
                    Vue d ensemble avec statut, competences et charge.
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
                        <Badge bg={mecanicien.is_active ? 'success' : 'secondary'}>
                          {mecanicien.is_active ? 'Actif' : 'Inactif'}
                        </Badge>
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
                          <span>{mecanicien.is_active ? 'Acces individuel actif' : 'Acces suspendu'}</span>
                        </div>
                        <div>
                          <FontAwesomeIcon icon={faWrench} />
                          <span>{mecanicien.specialites || 'Aucune specialite renseignee'}</span>
                        </div>
                      </div>

                      <div className="d-flex flex-wrap gap-2 mb-3">
                        <Badge bg="light" text="dark">
                          Confirmes: {mecanicien.rdv_confirmed_count || 0}
                        </Badge>
                        <Badge bg="light" text="dark">
                          Aujourd hui: {mecanicien.rdv_today_count || 0}
                        </Badge>
                        <Badge bg="light" text="dark">
                          A venir: {mecanicien.rdv_upcoming_count || 0}
                        </Badge>
                        <Badge bg="light" text="dark">
                          Dispos: {mecanicien.disponibilites_count || 0}
                        </Badge>
                      </div>

                      <Form.Group className="mb-3">
                        <Form.Label className="small text-muted mb-1">Specialites</Form.Label>
                        <Form.Control
                          size="sm"
                          defaultValue={mecanicien.specialites || ''}
                          placeholder="Freinage, moteur, diagnostic"
                          onBlur={(event) => {
                            if ((event.target.value || '') !== (mecanicien.specialites || '')) {
                              handleSpecialitesUpdate(mecanicien, event.target.value);
                            }
                          }}
                        />
                      </Form.Group>

                      <div className="mecanicien-card-actions d-flex flex-wrap gap-2">
                        <Button
                          variant={mecanicien.is_active ? 'outline-secondary' : 'outline-success'}
                          size="sm"
                          onClick={() => handleToggleActive(mecanicien)}
                        >
                          {mecanicien.is_active ? 'Desactiver' : 'Reactiver'}
                        </Button>
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
