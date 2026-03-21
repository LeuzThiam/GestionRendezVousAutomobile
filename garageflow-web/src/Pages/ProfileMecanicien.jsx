// src/Pages/ProfileMecanicien.jsx

import React, { useState, useEffect } from 'react';
import { Card, Button, Form, Container, Row, Col, Nav } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUserEdit,
  faSave,
  faTools,
  faEdit,
} from '@fortawesome/free-solid-svg-icons';

import ListeRendezVousMecanicien from './ListeRendezVousMecanicien';
import './style.css';
import { useAuth } from '../shared/auth';

function ProfileMecanicien() {
  const { user: currentUser, loading, error, refreshUser, updateUser } = useAuth();

  // Contrôle de la section affichée
  const [selectedComponent, setSelectedComponent] = useState('edit');
  // Contrôle du mode édition
  const [isEditing, setIsEditing] = useState(false);

  // Form data : adapter les noms pour coller à votre API (ex: "first_name", "date_naissance")
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    date_naissance: '',
  });

  // 1) Charger le mécano (user) via l’API au montage
  useEffect(() => {
    refreshUser().catch(() => {});
  }, [refreshUser]);

  // 2) Mettre à jour le formData quand currentUser change
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

  // Bascule du mode édition
  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };

  // Soumission => PATCH sur l'API via updateUserAsync
  const handleSubmit = (e) => {
    e.preventDefault();
    updateUser(formData)
      .then(() => {
        setIsEditing(false);
        return refreshUser();
      })
      .catch(() => {});
  };

  // Sélection de la section
  const handleComponentSelect = (component) => {
    setSelectedComponent(component);
  };

  return (
    <Container fluid className="py-5">
      {loading && <p>Chargement en cours...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <Row>
        {/* MENU LATÉRAL */}
        <Col xs={12} md={4} lg={3} className="mb-4">
          <Card className="shadow-lg border-0 bg-light rounded-lg">
            <Card.Body>
              <h4 className="text-center mb-4">Mon Profil Mécanicien</h4>
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
                  onClick={() => handleComponentSelect('rendez-vous-mecanicien')}
                  className={`d-flex align-items-center py-2 custom-nav-link ${
                    selectedComponent === 'rendez-vous-mecanicien' ? 'active' : ''
                  }`}
                  style={{ cursor: 'pointer' }}
                >
                  <FontAwesomeIcon icon={faTools} className="me-2 text-info" />
                  Rendez-vous Mécanicien
                </Nav.Link>
              </Nav>
            </Card.Body>
          </Card>
        </Col>

        {/* CONTENU PRINCIPAL */}
        <Col xs={12} md={8} lg={9}>
          {selectedComponent === 'edit' && (
            <Card className="shadow-lg border-0 mb-4 bg-white rounded-lg">
              <Card.Body>
                <Card.Title className="text-center mb-4">
                  <FontAwesomeIcon icon={faUserEdit} className="me-2" />
                  Modifier mes informations
                  <Button
                    variant="outline-secondary"
                    className="ms-3"
                    onClick={handleEditToggle}
                  >
                    <FontAwesomeIcon icon={faEdit} /> {isEditing ? 'Annuler' : 'Modifier'}
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
                      required
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

          {selectedComponent === 'rendez-vous-mecanicien' && <ListeRendezVousMecanicien />}
        </Col>
      </Row>
    </Container>
  );
}

export default ProfileMecanicien;
