// src/Pages/ProfileClient.jsx

import React, { useState, useEffect } from 'react';
import { Alert, Badge, Card, Button, Form, Container, Row, Col, Nav } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUserEdit,
  faSave,
  faEdit,
  faCalendarAlt,
} from '@fortawesome/free-solid-svg-icons';

import MesRendezVous from './RechercheOrganisationsPage';
import RendezVousClient from './ListeRendezVousClientPage';

import '../../../Pages/style.css';
import { useAuth } from '../../../shared/auth';

function ProfileClient() {
  const { user: currentUser, loading, error, refreshUser, updateUser } = useAuth();

  const [selectedComponent, setSelectedComponent] = useState('edit');
  const [isEditing, setIsEditing] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);
  const [localError, setLocalError] = useState(null);

  // Champs alignés avec votre API
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    date_naissance: '',
  });

  // Au montage, on récupère le user (GET /api/users/profile/)
  useEffect(() => {
    refreshUser().catch(() => {});
  }, [refreshUser]);

  // Dès que currentUser est mis à jour, on copie ses champs dans formData
  useEffect(() => {
    if (currentUser) {
      setFormData({
        first_name: currentUser.first_name || '',
        last_name: currentUser.last_name || '',
        email: currentUser.email || '',
        date_naissance: currentUser.date_naissance || '',
      });
    }
  }, [currentUser]);

  // Toggle édition
  const handleEditToggle = () => {
    setSaveMessage(null);
    setLocalError(null);
    setIsEditing(!isEditing);
  };

  // Soumission => PATCH /api/users/profile/update/
  const handleSubmit = (e) => {
    e.preventDefault();
    setSaveMessage(null);
    setLocalError(null);
    updateUser(formData)
      .then(() => {
        setIsEditing(false);
        setSaveMessage('Vos informations personnelles ont ete mises a jour.');
        return refreshUser();
      })
      .catch((requestError) => {
        const payload = requestError?.response?.data;
        if (typeof payload === 'string') {
          setLocalError(payload);
        } else if (payload && typeof payload === 'object') {
          setLocalError(Object.values(payload).flat().join(' '));
        } else {
          setLocalError("Impossible de mettre a jour votre profil.");
        }
      });
  };

  const handleComponentSelect = (component) => {
    setSelectedComponent(component);
  };

  return (
    <Container fluid className="py-5">
      {loading && <p>Chargement en cours...</p>}
      {error && typeof error === 'object' ? (
        <p style={{ color: 'red' }}>{JSON.stringify(error)}</p>
      ) : error ? (
        <p style={{ color: 'red' }}>{error}</p>
      ) : null}

      <Card className="shadow-sm border-0 mb-4">
        <Card.Body>
          <Row className="align-items-center g-3">
            <Col lg={8}>
              <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
                <Badge bg="dark">Espace client</Badge>
                <Badge bg="secondary">{currentUser?.role || 'client'}</Badge>
              </div>
              <h1 className="h3 mb-1">
                {currentUser?.first_name || currentUser?.username || 'Client'} {currentUser?.last_name || ''}
              </h1>
              <p className="text-muted mb-0">
                Gerez vos informations personnelles et vos rendez-vous depuis un seul espace.
              </p>
            </Col>
            <Col lg={4}>
              <Row className="g-3">
                <Col xs={6}>
                  <Card className="border h-100">
                    <Card.Body>
                      <div className="small text-muted">Courriel</div>
                      <div className="fw-semibold">{currentUser?.email || '-'}</div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col xs={6}>
                  <Card className="border h-100">
                    <Card.Body>
                      <div className="small text-muted">Compte</div>
                      <div className="fw-semibold">{currentUser?.username || '-'}</div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Row>
        <Col xs={12} md={4} lg={3} className="mb-4">
          <Card className="shadow-lg border-0 bg-light rounded-lg">
            <Card.Body>
              <h4 className="text-center mb-4">Mon Profil Client</h4>
              <Nav className="flex-column">
                <Nav.Link
                  onClick={() => handleComponentSelect('edit')}
                  className={`d-flex align-items-center py-2 custom-nav-link ${
                    selectedComponent === 'edit' ? 'active' : ''
                  }`}
                  style={{ cursor: 'pointer' }}
                >
                  <FontAwesomeIcon icon={faUserEdit} className="me-2 text-primary" />
                  Modifier mes informations
                </Nav.Link>

                <Nav.Link
                  onClick={() => handleComponentSelect('rendez-vous')}
                  className={`d-flex align-items-center py-2 custom-nav-link ${
                    selectedComponent === 'rendez-vous' ? 'active' : ''
                  }`}
                  style={{ cursor: 'pointer' }}
                >
                  <FontAwesomeIcon icon={faCalendarAlt} className="me-2 text-info" />
                  Trouver un garage
                </Nav.Link>

                <Nav.Link
                  onClick={() => handleComponentSelect('rendez-vous-client')}
                  className={`d-flex align-items-center py-2 custom-nav-link ${
                    selectedComponent === 'rendez-vous-client' ? 'active' : ''
                  }`}
                  style={{ cursor: 'pointer' }}
                >
                  <FontAwesomeIcon icon={faCalendarAlt} className="me-2 text-danger" />
                  Mes Rendez-vous
                </Nav.Link>

              </Nav>
            </Card.Body>
          </Card>
        </Col>

        <Col xs={12} md={8} lg={9}>
          {selectedComponent === 'edit' && (
            <Card className="shadow-lg border-0 mb-4 bg-white rounded-lg">
              <Card.Body>
                {saveMessage && <Alert variant="success">{saveMessage}</Alert>}
                {localError && <Alert variant="danger">{localError}</Alert>}
                <Card.Title className="text-center mb-4">
                  <FontAwesomeIcon icon={faUserEdit} className="me-2" />
                  Modifier mes informations
                  <Button
                    variant="outline-secondary"
                    className="ms-3"
                    onClick={handleEditToggle}
                  >
                    <FontAwesomeIcon icon={faEdit} />
                    {isEditing ? ' Annuler' : ' Modifier'}
                  </Button>
                </Card.Title>

                <Form onSubmit={handleSubmit}>
                  <Row>
                    <Col md={6}>
                      <Form.Group controlId="formFirstName" className="mb-3">
                        <Form.Label>Prénom</Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="Entrez votre prénom"
                          value={formData.first_name}
                          onChange={(e) =>
                            setFormData({ ...formData, first_name: e.target.value })
                          }
                          required
                          disabled={!isEditing}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group controlId="formLastName" className="mb-3">
                        <Form.Label>Nom</Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="Entrez votre nom"
                          value={formData.last_name}
                          onChange={(e) =>
                            setFormData({ ...formData, last_name: e.target.value })
                          }
                          required
                          disabled={!isEditing}
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group controlId="formEmail" className="mb-3">
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                      type="email"
                      placeholder="Entrez votre email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      disabled={!isEditing}
                    />
                  </Form.Group>

                  <Form.Group controlId="formDateNaissance" className="mb-3">
                    <Form.Label>Date de naissance</Form.Label>
                    <Form.Control
                      type="date"
                      value={formData.date_naissance}
                      onChange={(e) =>
                        setFormData({ ...formData, date_naissance: e.target.value })
                      }
                      required
                      disabled={!isEditing}
                    />
                  </Form.Group>

                  {isEditing && (
                    <div className="d-flex justify-content-center">
                      <Button variant="primary" type="submit" className="w-50">
                        <FontAwesomeIcon icon={faSave} className="me-2" />
                        Enregistrer
                      </Button>
                    </div>
                  )}
                </Form>
              </Card.Body>
            </Card>
          )}

          {selectedComponent === 'rendez-vous' && <MesRendezVous />}
          {selectedComponent === 'rendez-vous-client' && <RendezVousClient />}
        </Col>
      </Row>
    </Container>
  );
}

export default ProfileClient;
