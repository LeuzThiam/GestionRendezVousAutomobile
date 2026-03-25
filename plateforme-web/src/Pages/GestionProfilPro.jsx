import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Button, Card, Col, Container, Form, Row, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { fetchCurrentOrganizationRequest, updateCurrentOrganizationRequest } from '../api/organizations';
import { fetchOrganizationDisponibilitesRequest } from '../api/disponibilites';
import { fetchOrganizationServicesRequest } from '../api/services';

function getErrorMessage(requestError, fallback) {
  const payload = requestError.response?.data;
  if (typeof payload === 'string') {
    return payload;
  }
  if (payload && typeof payload === 'object') {
    return Object.values(payload).flat().join(' ');
  }
  return fallback;
}

function GestionProfilPro() {
  const [garage, setGarage] = useState(null);
  const [services, setServices] = useState([]);
  const [disponibilites, setDisponibilites] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    type_etablissement: 'automobile',
    phone: '',
    address: '',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function loadGarage() {
      try {
        setLoading(true);
        setError(null);
        const [data, servicesData, disponibilitesData] = await Promise.all([
          fetchCurrentOrganizationRequest(),
          fetchOrganizationServicesRequest(),
          fetchOrganizationDisponibilitesRequest(),
        ]);
        if (!mounted) {
          return;
        }
        setGarage(data);
        setServices(servicesData);
        setDisponibilites(disponibilitesData);
        setFormData({
          name: data.name || '',
          type_etablissement: data.type_etablissement || 'automobile',
          phone: data.phone || '',
          address: data.address || '',
          description: data.description || '',
        });
      } catch (requestError) {
        if (!mounted) {
          return;
        }
        setError(getErrorMessage(requestError, "Impossible de charger le profil du garage."));
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadGarage();
    return () => {
      mounted = false;
    };
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!formData.phone.trim()) {
      setError('Le telephone du garage est requis pour une fiche publiable.');
      return;
    }
    if (!formData.address.trim()) {
      setError("L'adresse du garage est requise pour une fiche publiable.");
      return;
    }
    if (formData.description.trim().length < 30) {
      setError('La description doit contenir au moins 30 caracteres.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setMessage(null);
      const updated = await updateCurrentOrganizationRequest(formData);
      setGarage(updated);
      setFormData({
        name: updated.name || '',
        type_etablissement: updated.type_etablissement || 'automobile',
        phone: updated.phone || '',
        address: updated.address || '',
        description: updated.description || '',
      });
      setMessage('Le profil du garage a ete mis a jour.');
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Impossible de mettre a jour le profil du garage."));
    } finally {
      setLoading(false);
    }
  };

  const activeServices = useMemo(
    () => services.filter((item) => item.actif !== false),
    [services]
  );

  const activeDisponibilites = useMemo(
    () => disponibilites.filter((item) => item.actif !== false),
    [disponibilites]
  );

  const profileChecks = useMemo(() => {
    const checks = [
      {
        key: 'name',
        label: 'Nom du garage',
        done: formData.name.trim().length > 2,
        help: 'Ajoutez un nom clair et professionnel.',
      },
      {
        key: 'phone',
        label: 'Telephone',
        done: formData.phone.trim().length >= 8,
        help: 'Ajoutez un numero facilement joignable.',
      },
      {
        key: 'address',
        label: 'Adresse',
        done: formData.address.trim().length >= 8,
        help: 'Indiquez une adresse exploitable par les clients.',
      },
      {
        key: 'description',
        label: 'Description',
        done: formData.description.trim().length >= 30,
        help: 'Expliquez vos specialites et votre approche client.',
      },
      {
        key: 'services',
        label: 'Services',
        done: activeServices.length > 0,
        help: 'Ajoutez au moins un service visible sur la fiche publique.',
      },
      {
        key: 'disponibilites',
        label: 'Horaires',
        done: activeDisponibilites.length > 0,
        help: 'Definissez au moins un creneau d ouverture.',
      },
    ];

    const completed = checks.filter((item) => item.done).length;
    const score = Math.round((completed / checks.length) * 100);
    const missing = checks.filter((item) => !item.done);
    let status = 'Profil incomplet';
    let variant = 'warning';

    if (score === 100) {
      status = 'Profil publiable';
      variant = 'success';
    } else if (score >= 67) {
      status = 'Profil presque pret';
      variant = 'info';
    }

    return { checks, completed, score, missing, status, variant };
  }, [activeDisponibilites.length, activeServices.length, formData.address, formData.description, formData.name, formData.phone]);

  return (
    <Container className="py-5">
      <div className="d-flex justify-content-between align-items-start gap-3 mb-4">
        <div>
          <h1 className="mb-2">Profil du garage</h1>
          <p className="text-muted mb-0">
            Modifiez les informations visibles dans la recherche client et sur votre fiche publique.
          </p>
        </div>
        {garage?.slug && <Badge bg="dark">{garage.slug}</Badge>}
      </div>

      {loading && (
        <div className="d-flex align-items-center gap-2 mb-4">
          <Spinner animation="border" size="sm" />
          <span>Chargement en cours...</span>
        </div>
      )}
      {message && <Alert variant="success">{message}</Alert>}
      {error && <Alert variant="danger">{error}</Alert>}

      <Row className="g-4">
        <Col lg={8}>
          <Card className="shadow-sm border-0">
            <Card.Body>
              <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-start gap-3 mb-4">
                <div>
                  <Card.Title className="mb-2">Informations publiques</Card.Title>
                  <p className="text-muted mb-0">
                    Ces informations sont utilisees dans la recherche client et sur la fiche publique du garage.
                  </p>
                </div>
                <Badge bg={profileChecks.variant}>{profileChecks.status}</Badge>
              </div>

              <Alert variant={profileChecks.variant} className="mb-4">
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
                  <strong>Completude du profil</strong>
                  <span>{profileChecks.score}%</span>
                </div>
                <div className="small mb-2">
                  {profileChecks.completed} element(s) completes sur {profileChecks.checks.length}.
                </div>
                {profileChecks.missing.length > 0 ? (
                  <div className="small">
                    Il manque encore : {profileChecks.missing.map((item) => item.label.toLowerCase()).join(', ')}.
                  </div>
                ) : (
                  <div className="small">
                    Votre profil contient les informations essentielles pour une fiche publique solide.
                  </div>
                )}
              </Alert>

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Nom du garage</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Type d etablissement</Form.Label>
                  <Form.Select
                    name="type_etablissement"
                    value={formData.type_etablissement}
                    onChange={handleChange}
                  >
                    <option value="automobile">Automobile / mecanique</option>
                    <option value="multi_services">Multi-services (prestations variees)</option>
                  </Form.Select>
                  <Form.Text muted>
                    Les nouveaux comptes recoivent des categories adaptees ; vous pouvez les ajuster dans la section Services.
                  </Form.Text>
                </Form.Group>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Telephone</Form.Label>
                      <Form.Control
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="418 555-1234"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Adresse</Form.Label>
                      <Form.Control
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        placeholder="123 rue Principale, Rimouski"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-4">
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={5}
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Presentez votre garage, vos specialites et votre approche client"
                  />
                  <Form.Text muted>
                    Minimum recommande : 30 caracteres.
                  </Form.Text>
                </Form.Group>

                <div className="d-flex flex-wrap gap-2">
                  <Button type="submit" variant="dark" disabled={loading}>
                    Enregistrer le profil
                  </Button>
                  <Button as={Link} to="/pro/services" variant="outline-dark">
                    Gerer les services
                  </Button>
                  <Button as={Link} to="/pro/disponibilites" variant="outline-secondary">
                    Gerer les horaires
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <div className="d-flex flex-column gap-4">
            <Card className="shadow-sm border-0">
              <Card.Body>
                <Card.Title className="mb-3">Actions prioritaires</Card.Title>
                {profileChecks.missing.length > 0 ? (
                  <div className="d-flex flex-column gap-3">
                    {profileChecks.missing.map((item) => (
                      <div key={item.key} className="border rounded p-3">
                        <div className="fw-semibold">{item.label}</div>
                        <div className="small text-muted">{item.help}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Alert variant="success" className="mb-0">
                    Le profil garage couvre les informations essentielles attendues.
                  </Alert>
                )}
              </Card.Body>
            </Card>

            <Card className="shadow-sm border-0">
              <Card.Body>
                <Card.Title className="mb-3">Apercu public</Card.Title>
                <div className="small text-muted mb-1">Nom</div>
                <div className="fw-semibold mb-3">{formData.name || '-'}</div>

                <div className="small text-muted mb-1">Telephone</div>
                <div className="mb-3">{formData.phone || 'Non renseigne'}</div>

                <div className="small text-muted mb-1">Adresse</div>
                <div className="mb-3">{formData.address || 'Non renseignee'}</div>

                <div className="small text-muted mb-1">Description</div>
                <div className="mb-3">{formData.description || 'Aucune description pour le moment.'}</div>

                <hr />

                <div className="small text-muted mb-1">Services actifs</div>
                <div className="mb-3">{activeServices.length > 0 ? activeServices.length : 'Aucun service'}</div>

                <div className="small text-muted mb-1">Creneaux actifs</div>
                <div>{activeDisponibilites.length > 0 ? activeDisponibilites.length : 'Aucun horaire'}</div>
              </Card.Body>
            </Card>
          </div>
        </Col>
      </Row>
    </Container>
  );
}

export default GestionProfilPro;
