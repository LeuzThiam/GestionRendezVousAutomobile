import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Button, Card, Col, Container, Form, Row, Spinner } from 'react-bootstrap';
import {
  createOrganizationCategoryRequest,
  deleteOrganizationCategoryRequest,
  fetchOrganizationCategoriesRequest,
} from '../api/categories';
import {
  createOrganizationServiceRequest,
  deleteOrganizationServiceRequest,
  fetchOrganizationServicesRequest,
  updateOrganizationServiceRequest,
} from '../api/services';

function normalizeError(error) {
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

const emptyForm = () => ({
  nom: '',
  categorie: '',
  description: '',
  duree_estimee: '',
  prix_indicatif: '',
  ordre_affichage: 0,
  actif: true,
});

function formatPrice(value) {
  if (value === null || value === undefined || value === '') {
    return '-';
  }

  return new Intl.NumberFormat('fr-CA', {
    style: 'currency',
    currency: 'CAD',
  }).format(Number(value));
}

function GestionServicesPro() {
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState(emptyForm);
  const [categoryForm, setCategoryForm] = useState({ nom: '', ordre: 0 });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const loadAll = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [servicesData, categoriesData] = await Promise.all([
        fetchOrganizationServicesRequest(),
        fetchOrganizationCategoriesRequest(),
      ]);
      setServices(servicesData);
      setCategories(categoriesData);
    } catch (requestError) {
      setError(requestError.response?.data || requestError);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    if (editingId || categories.length === 0) {
      return;
    }
    setFormData((current) => {
      if (current.categorie !== '') {
        return current;
      }
      return { ...current, categorie: String(categories[0].id) };
    });
  }, [categories, editingId]);

  const stats = useMemo(() => ({
    total: services.length,
    active: services.filter((item) => item.actif).length,
    inactive: services.filter((item) => !item.actif).length,
  }), [services]);

  const sortedServices = useMemo(() => (
    [...services].sort((left, right) => {
      if ((left.ordre_affichage ?? 0) !== (right.ordre_affichage ?? 0)) {
        return (left.ordre_affichage ?? 0) - (right.ordre_affichage ?? 0);
      }
      return left.nom.localeCompare(right.nom);
    })
  ), [services]);

  const sortedCategories = useMemo(() => (
    [...categories].sort((left, right) => {
      if ((left.ordre ?? 0) !== (right.ordre ?? 0)) {
        return (left.ordre ?? 0) - (right.ordre ?? 0);
      }
      return left.nom.localeCompare(right.nom);
    })
  ), [categories]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleCategoryFormChange = (event) => {
    const { name, value, type } = event.target;
    setCategoryForm((current) => ({
      ...current,
      [name]: type === 'number' ? Number(value) : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!formData.categorie) {
      setError({ categorie: ['Choisissez une categorie.'] });
      return;
    }
    if (!formData.duree_estimee) {
      setError({ duree_estimee: ['La duree estimee est requise.'] });
      return;
    }
    if (formData.prix_indicatif === '' || formData.prix_indicatif === null || formData.prix_indicatif === undefined) {
      setError({ prix_indicatif: ['Le prix indicatif est requis.'] });
      return;
    }

    const payload = {
      nom: formData.nom,
      categorie: Number(formData.categorie),
      description: formData.description,
      duree_estimee: formData.duree_estimee,
      prix_indicatif: formData.prix_indicatif,
      ordre_affichage: Number(formData.ordre_affichage),
      actif: formData.actif,
    };

    try {
      setLoading(true);
      setError(null);
      setMessage(null);
      if (editingId) {
        const updated = await updateOrganizationServiceRequest(editingId, payload);
        setServices((current) => current.map((item) => (item.id === updated.id ? updated : item)));
        setMessage('Service mis a jour.');
      } else {
        const created = await createOrganizationServiceRequest(payload);
        setServices((current) => [...current, created]);
        setMessage('Service ajoute.');
      }
      setFormData(() => {
        const next = emptyForm();
        if (categories[0]) {
          next.categorie = String(categories[0].id);
        }
        return next;
      });
      setEditingId(null);
    } catch (requestError) {
      setError(requestError.response?.data || requestError);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (service) => {
    setEditingId(service.id);
    setFormData({
      nom: service.nom || '',
      categorie: service.categorie != null ? String(service.categorie) : '',
      description: service.description || '',
      duree_estimee: service.duree_estimee || '',
      prix_indicatif: service.prix_indicatif || '',
      ordre_affichage: service.ordre_affichage ?? 0,
      actif: Boolean(service.actif),
    });
  };

  const handleToggleActive = async (service) => {
    try {
      setLoading(true);
      setError(null);
      setMessage(null);
      const updated = await updateOrganizationServiceRequest(service.id, {
        actif: !service.actif,
      });
      setServices((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setMessage(updated.actif ? 'Service active.' : 'Service desactive.');
      if (editingId === service.id) {
        handleEdit(updated);
      }
    } catch (requestError) {
      setError(requestError.response?.data || requestError);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (serviceId) => {
    try {
      setLoading(true);
      setError(null);
      setMessage(null);
      await deleteOrganizationServiceRequest(serviceId);
      setServices((current) => current.filter((item) => item.id !== serviceId));
      if (editingId === serviceId) {
        setEditingId(null);
        setFormData(() => {
          const next = emptyForm();
          if (categories[0]) {
            next.categorie = String(categories[0].id);
          }
          return next;
        });
      }
      setMessage('Service supprime.');
    } catch (requestError) {
      setError(requestError.response?.data || requestError);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async (event) => {
    event.preventDefault();
    if (!categoryForm.nom.trim()) {
      return;
    }
    try {
      setLoading(true);
      setError(null);
      setMessage(null);
      await createOrganizationCategoryRequest({
        nom: categoryForm.nom.trim(),
        ordre: categoryForm.ordre,
      });
      setCategoryForm({ nom: '', ordre: 0 });
      await loadAll();
      setMessage('Categorie ajoutee.');
    } catch (requestError) {
      setError(requestError.response?.data || requestError);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    try {
      setLoading(true);
      setError(null);
      setMessage(null);
      await deleteOrganizationCategoryRequest(categoryId);
      await loadAll();
      setMessage('Categorie supprimee.');
    } catch (requestError) {
      setError(requestError.response?.data || requestError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-5">
      <div className="d-flex justify-content-between align-items-start gap-3 mb-4">
        <div>
          <h1 className="mb-2">Services et categories</h1>
          <p className="text-muted mb-0">
            Definissez des categories de prestations pour votre etablissement, puis rattachez chaque service public a une categorie.
          </p>
        </div>
        {loading && <Spinner animation="border" size="sm" />}
      </div>

      {message && <Alert variant="success">{message}</Alert>}
      {error && <Alert variant="danger">{normalizeError(error)}</Alert>}

      <Row className="g-4 mb-4">
        <Col lg={6}>
          <Card className="shadow-sm h-100">
            <Card.Body>
              <Card.Title className="mb-3">Categories de prestations</Card.Title>
              <p className="small text-muted">
                Les categories structurent votre catalogue (ex. entretien, consultation, atelier). Le slug est genere automatiquement.
              </p>
              <Form onSubmit={handleCreateCategory} className="mb-4">
                <Row className="g-2 align-items-end">
                  <Col sm={7}>
                    <Form.Label className="small">Nouvelle categorie</Form.Label>
                    <Form.Control
                      name="nom"
                      value={categoryForm.nom}
                      onChange={handleCategoryFormChange}
                      placeholder="Ex. Soins esthetiques"
                    />
                  </Col>
                  <Col sm={3}>
                    <Form.Label className="small">Ordre</Form.Label>
                    <Form.Control
                      type="number"
                      min="0"
                      name="ordre"
                      value={categoryForm.ordre}
                      onChange={handleCategoryFormChange}
                    />
                  </Col>
                  <Col sm={2}>
                    <Button type="submit" variant="outline-dark" className="w-100" disabled={loading}>
                      Ajouter
                    </Button>
                  </Col>
                </Row>
              </Form>
              <div className="d-grid gap-2">
                {sortedCategories.map((cat) => (
                  <div key={cat.id} className="d-flex justify-content-between align-items-center border rounded px-3 py-2">
                    <div>
                      <strong>{cat.nom}</strong>
                      <span className="text-muted small ms-2">({cat.slug})</span>
                    </div>
                    <Button variant="outline-danger" size="sm" onClick={() => handleDeleteCategory(cat.id)}>
                      Supprimer
                    </Button>
                  </div>
                ))}
                {categories.length === 0 && (
                  <div className="text-muted small">Chargement des categories...</div>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="g-4 mb-4">
        <Col md={6}>
          <Card className="shadow-sm h-100">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <Card.Title className="mb-0">{editingId ? 'Modifier un service' : 'Ajouter un service'}</Card.Title>
                <div className="d-flex gap-2">
                  <Badge bg="dark">{stats.active}/{stats.total} actifs</Badge>
                  <Badge bg="secondary">{stats.inactive} inactif(s)</Badge>
                </div>
              </div>

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Nom du service</Form.Label>
                  <Form.Control name="nom" value={formData.nom} onChange={handleChange} required />
                </Form.Group>

                <Row>
                  <Col sm={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Categorie</Form.Label>
                      <Form.Select name="categorie" value={formData.categorie} onChange={handleChange} required>
                        <option value="">-- Choisir --</option>
                        {sortedCategories.map((cat) => (
                          <option key={cat.id} value={String(cat.id)}>
                            {cat.nom}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col sm={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Ordre d affichage</Form.Label>
                      <Form.Control
                        type="number"
                        min="0"
                        step="1"
                        name="ordre_affichage"
                        value={formData.ordre_affichage}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Description</Form.Label>
                  <Form.Control as="textarea" rows={3} name="description" value={formData.description} onChange={handleChange} />
                </Form.Group>

                <Row>
                  <Col sm={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Duree estimee (heures)</Form.Label>
                      <Form.Control
                        type="number"
                        min="0.25"
                        max="12"
                        step="0.25"
                        name="duree_estimee"
                        value={formData.duree_estimee}
                        onChange={handleChange}
                        placeholder="1.50"
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col sm={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Prix indicatif (CAD)</Form.Label>
                      <Form.Control
                        type="number"
                        min="0"
                        step="0.01"
                        name="prix_indicatif"
                        value={formData.prix_indicatif}
                        onChange={handleChange}
                        placeholder="89.99"
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Alert variant="light" className="small">
                  Un service actif doit garder une duree estimee coherente et un prix indicatif lisible pour le client.
                </Alert>

                <Form.Check
                  type="switch"
                  id="service-actif"
                  name="actif"
                  label="Service actif"
                  checked={formData.actif}
                  onChange={handleChange}
                  className="mb-4"
                />

                <div className="d-flex gap-2">
                  <Button type="submit" disabled={loading}>
                    {editingId ? 'Enregistrer' : 'Ajouter'}
                  </Button>
                  {editingId && (
                    <Button
                      type="button"
                      variant="outline-secondary"
                      onClick={() => {
                        setEditingId(null);
                        setFormData(() => {
                          const next = emptyForm();
                          if (categories[0]) {
                            next.categorie = String(categories[0].id);
                          }
                          return next;
                        });
                      }}
                    >
                      Annuler
                    </Button>
                  )}
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card className="shadow-sm h-100">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <Card.Title className="mb-0">Catalogue public</Card.Title>
                <Badge bg="dark">Trie par ordre puis nom</Badge>
              </div>
              <div className="d-grid gap-3">
                {sortedServices.map((service) => (
                  <div key={service.id} className="border rounded p-3">
                    <div className="d-flex justify-content-between align-items-start gap-3">
                      <div>
                        <div className="d-flex flex-wrap align-items-center gap-2">
                          <strong>{service.nom}</strong>
                          <Badge bg="light" text="dark">
                            {service.categorie_label || service.categorie_slug || '—'}
                          </Badge>
                          <Badge bg="secondary">#{service.ordre_affichage ?? 0}</Badge>
                        </div>
                        <div className="small text-muted mt-1">{service.description || 'Sans description'}</div>
                      </div>
                      <Badge bg={service.actif ? 'success' : 'secondary'}>
                        {service.actif ? 'Actif' : 'Inactif'}
                      </Badge>
                    </div>
                    <div className="small text-muted mt-3">
                      Duree: {service.duree_estimee || '-'} h
                    </div>
                    <div className="small text-muted">
                      Prix indicatif: {formatPrice(service.prix_indicatif)}
                    </div>
                    <div className="d-flex gap-2 mt-3 flex-wrap">
                      <Button variant="outline-dark" size="sm" onClick={() => handleEdit(service)}>
                        Modifier
                      </Button>
                      <Button
                        variant={service.actif ? 'outline-secondary' : 'outline-success'}
                        size="sm"
                        onClick={() => handleToggleActive(service)}
                      >
                        {service.actif ? 'Desactiver' : 'Activer'}
                      </Button>
                      <Button variant="outline-danger" size="sm" onClick={() => handleDelete(service.id)}>
                        Supprimer
                      </Button>
                    </div>
                  </div>
                ))}
                {services.length === 0 && (
                  <div className="text-muted">Aucun service publie pour le moment.</div>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default GestionServicesPro;
