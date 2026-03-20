import React, { useEffect, useState } from 'react';
import { Alert, Badge, Button, Card, Col, Container, Form, Row, Spinner } from 'react-bootstrap';
import { fetchCurrentGarageRequest, updateCurrentGarageRequest } from '../api/garages';

function GestionProfilGarage() {
  const [garage, setGarage] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
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
        const data = await fetchCurrentGarageRequest();
        if (!mounted) {
          return;
        }
        setGarage(data);
        setFormData({
          name: data.name || '',
          phone: data.phone || '',
          address: data.address || '',
          description: data.description || '',
        });
      } catch (requestError) {
        if (!mounted) {
          return;
        }
        const payload = requestError.response?.data;
        if (typeof payload === 'string') {
          setError(payload);
        } else if (payload && typeof payload === 'object') {
          setError(Object.values(payload).flat().join(' '));
        } else {
          setError("Impossible de charger le profil du garage.");
        }
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
    try {
      setLoading(true);
      setError(null);
      setMessage(null);
      const updated = await updateCurrentGarageRequest(formData);
      setGarage(updated);
      setFormData({
        name: updated.name || '',
        phone: updated.phone || '',
        address: updated.address || '',
        description: updated.description || '',
      });
      setMessage('Le profil du garage a ete mis a jour.');
    } catch (requestError) {
      const payload = requestError.response?.data;
      if (typeof payload === 'string') {
        setError(payload);
      } else if (payload && typeof payload === 'object') {
        setError(Object.values(payload).flat().join(' '));
      } else {
        setError("Impossible de mettre a jour le profil du garage.");
      }
    } finally {
      setLoading(false);
    }
  };

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
              <Card.Title className="mb-4">Informations publiques</Card.Title>
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

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Telephone</Form.Label>
                      <Form.Control
                        type="text"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
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
                </Form.Group>

                <Button type="submit" variant="dark" disabled={loading}>
                  Enregistrer le profil
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
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
              <div>{formData.description || 'Aucune description pour le moment.'}</div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default GestionProfilGarage;
