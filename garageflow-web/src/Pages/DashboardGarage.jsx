import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Button, Card, Col, Container, Row, Spinner } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowTrendUp,
  faBolt,
  faBuilding,
  faCalendarCheck,
  faClock,
  faCopy,
  faLink,
  faScrewdriverWrench,
  faTriangleExclamation,
  faUserGear,
} from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';
import { fetchGarageMecaniciensRequest } from '../api/mecaniciens';
import { fetchRendezVousRequest } from '../api/rendezVous';
import { useAuth } from '../shared/auth/AuthContext';

function DashboardGarage() {
  const { currentGarage, loading, error, user, refreshCurrentGarage } = useAuth();
  const [mecaniciens, setMecaniciens] = useState([]);
  const [rendezVous, setRendezVous] = useState([]);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState(null);
  const [copyMessage, setCopyMessage] = useState(null);

  useEffect(() => {
    if (!currentGarage) {
      refreshCurrentGarage().catch(() => {});
    }
  }, [currentGarage, refreshCurrentGarage]);

  useEffect(() => {
    let mounted = true;

    async function loadDashboardData() {
      try {
        setDashboardLoading(true);
        setDashboardError(null);
        const [mecaniciensData, rendezVousData] = await Promise.all([
          fetchGarageMecaniciensRequest(),
          fetchRendezVousRequest(),
        ]);

        if (!mounted) {
          return;
        }

        setMecaniciens(mecaniciensData);
        setRendezVous(rendezVousData);
      } catch (requestError) {
        if (!mounted) {
          return;
        }
        const payload = requestError.response?.data;
        if (typeof payload === 'string') {
          setDashboardError(payload);
        } else if (payload && typeof payload === 'object') {
          setDashboardError(Object.values(payload).flat().join(' '));
        } else {
          setDashboardError("Impossible de charger les indicateurs du dashboard.");
        }
      } finally {
        if (mounted) {
          setDashboardLoading(false);
        }
      }
    }

    if (currentGarage) {
      loadDashboardData();
    }

    return () => {
      mounted = false;
    };
  }, [currentGarage]);

  const publicReservationUrl = currentGarage?.slug
    ? `${window.location.origin}/garage/${currentGarage.slug}/reservation`
    : null;

  const metrics = useMemo(() => {
    const pendingCount = rendezVous.filter((item) => item.status === 'pending').length;
    const confirmedCount = rendezVous.filter((item) => item.status === 'confirmed').length;
    const modificationCount = rendezVous.filter((item) => item.status === 'modification_requested').length;
    const closedCount = rendezVous.filter((item) => (
      item.status === 'cancelled' || item.status === 'rejected' || item.status === 'refused'
    )).length;

    return {
      mecaniciensCount: mecaniciens.length,
      pendingCount,
      confirmedCount,
      modificationCount,
      closedCount,
      totalRendezVous: rendezVous.length,
    };
  }, [mecaniciens, rendezVous]);

  const todayAppointments = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return rendezVous.filter((item) => item.date?.slice(0, 10) === today).length;
  }, [rendezVous]);

  const operationalSignal = useMemo(() => {
    if (metrics.pendingCount >= 5) {
      return {
        label: 'Attention requise',
        description: 'Le volume de demandes en attente commence a s accumuler.',
        tone: 'warning',
      };
    }

    if (metrics.totalRendezVous === 0) {
      return {
        label: 'Demarrage',
        description: 'Le garage est pret, il faut maintenant generer les premiers rendez-vous.',
        tone: 'muted',
      };
    }

    return {
      label: 'Flux maitrise',
      description: 'Les operations sont stables et les demandes restent sous controle.',
      tone: 'success',
    };
  }, [metrics.pendingCount, metrics.totalRendezVous]);

  const conversionRate = useMemo(() => {
    if (!metrics.totalRendezVous) {
      return 0;
    }

    return Math.round((metrics.confirmedCount / metrics.totalRendezVous) * 100);
  }, [metrics.confirmedCount, metrics.totalRendezVous]);

  const latestRendezVous = useMemo(() => {
    return [...rendezVous]
      .sort((left, right) => new Date(right.date) - new Date(left.date))
      .slice(0, 5);
  }, [rendezVous]);

  const handleCopyLink = async () => {
    if (!publicReservationUrl) {
      return;
    }

    try {
      await navigator.clipboard.writeText(publicReservationUrl);
      setCopyMessage('Lien public copie.');
    } catch {
      setCopyMessage("Impossible de copier le lien.");
    }
  };

  const formatDateTime = (value) => {
    if (!value) {
      return '-';
    }

    return new Intl.DateTimeFormat('fr-CA', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'En attente',
      confirmed: 'Confirme',
      modification_requested: 'Modification',
      cancelled: 'Annule',
      rejected: 'Refuse',
      refused: 'Refuse',
    };

    return labels[status] || status;
  };

  const getStatusVariant = (status) => {
    const variants = {
      pending: 'warning',
      confirmed: 'success',
      modification_requested: 'info',
      cancelled: 'secondary',
      rejected: 'danger',
      refused: 'danger',
    };

    return variants[status] || 'secondary';
  };

  return (
    <Container className="py-5 dashboard-garage">
      <Row className="g-4 mb-4">
        <Col xl={8}>
          <Card className="dashboard-hero border-0 shadow-sm h-100">
            <Card.Body className="p-4 p-lg-5">
              <div className="d-flex flex-wrap justify-content-between align-items-start gap-3">
                <div>
                  <p className="dashboard-eyebrow mb-2">GarageFlow MVP</p>
                  <h1 className="mb-2 d-flex align-items-center gap-3">
                    <span className="dashboard-icon-orb">
                      <FontAwesomeIcon icon={faBuilding} />
                    </span>
                    {currentGarage?.name || 'Tableau de bord garage'}
                  </h1>
                  <div className="dashboard-meta-row mb-3">
                    <span>{currentGarage?.slug || 'slug-indisponible'}</span>
                    <span>{currentGarage?.address || 'Adresse a renseigner'}</span>
                    <span>{currentGarage?.phone || 'Telephone a renseigner'}</span>
                  </div>
                  <p className="dashboard-hero-text mb-0">
                    Une vue operationnelle pour suivre l equipe, les rendez-vous et la reservation
                    publique sans naviguer entre plusieurs ecrans.
                  </p>
                </div>

                <div className="text-lg-end">
                  <Badge bg="light" text="dark" className="dashboard-badge mb-2">
                    {user?.role === 'owner' ? 'Proprietaire' : 'Utilisateur'}
                  </Badge>
                  <div className="small opacity-75">{user?.email || user?.username || '-'}</div>
                  <div className="dashboard-signal">
                    <span className={`dashboard-signal-dot dashboard-signal-${operationalSignal.tone}`}></span>
                    {operationalSignal.label}
                  </div>
                </div>
              </div>

              <Row className="g-3 mt-3">
                <Col sm={6} lg={3}>
                  <div className="dashboard-stat-card">
                    <div className="dashboard-stat-icon">
                      <FontAwesomeIcon icon={faUserGear} />
                    </div>
                    <span className="dashboard-stat-label">Mecaniciens</span>
                    <strong className="dashboard-stat-value">{metrics.mecaniciensCount}</strong>
                  </div>
                </Col>
                <Col sm={6} lg={3}>
                  <div className="dashboard-stat-card">
                    <div className="dashboard-stat-icon">
                      <FontAwesomeIcon icon={faClock} />
                    </div>
                    <span className="dashboard-stat-label">RDV en attente</span>
                    <strong className="dashboard-stat-value">{metrics.pendingCount}</strong>
                  </div>
                </Col>
                <Col sm={6} lg={3}>
                  <div className="dashboard-stat-card">
                    <div className="dashboard-stat-icon">
                      <FontAwesomeIcon icon={faCalendarCheck} />
                    </div>
                    <span className="dashboard-stat-label">RDV confirmes</span>
                    <strong className="dashboard-stat-value">{metrics.confirmedCount}</strong>
                  </div>
                </Col>
                <Col sm={6} lg={3}>
                  <div className="dashboard-stat-card">
                    <div className="dashboard-stat-icon">
                      <FontAwesomeIcon icon={faBolt} />
                    </div>
                    <span className="dashboard-stat-label">Demandes de modif</span>
                    <strong className="dashboard-stat-value">{metrics.modificationCount}</strong>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>

        <Col xl={4}>
          <Card className="shadow-sm h-100 border-0 dashboard-side-panel">
            <Card.Body className="p-4">
              <div className="dashboard-panel-head mb-3">
                <span className="dashboard-panel-icon">
                  <FontAwesomeIcon icon={faLink} />
                </span>
                <div>
                  <Card.Title className="mb-1">Lien public de reservation</Card.Title>
                  <p className="text-muted small mb-0">
                    Point d entree client pour les demandes de rendez-vous.
                  </p>
                </div>
              </div>

              <p className="text-muted small mb-3">
                Partagez ce lien a vos clients pour qu ils demandent un rendez-vous.
              </p>

              <div className="dashboard-link-box mb-3">
                {publicReservationUrl || 'Lien indisponible'}
              </div>

              <div className="d-flex flex-wrap gap-2">
                {currentGarage?.slug && (
                  <Button as={Link} to={`/garage/${currentGarage.slug}/reservation`} variant="dark">
                    Ouvrir la page
                  </Button>
                )}
                <Button
                  variant="outline-dark"
                  onClick={handleCopyLink}
                  disabled={!publicReservationUrl}
                >
                  <FontAwesomeIcon icon={faCopy} className="me-2" />
                  Copier le lien
                </Button>
              </div>

              {copyMessage && (
                <p className="small text-muted mt-3 mb-0">{copyMessage}</p>
              )}

              <div className="dashboard-mini-metrics mt-4">
                <div>
                  <span>Aujourd hui</span>
                  <strong>{todayAppointments}</strong>
                </div>
                <div>
                  <span>Taux confirme</span>
                  <strong>{conversionRate}%</strong>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {(loading || dashboardLoading) && (
        <div className="d-flex align-items-center gap-2 mb-4">
          <Spinner animation="border" size="sm" />
          <span>Chargement du dashboard...</span>
        </div>
      )}

      {error && (
        <Alert variant="warning">
          {typeof error === 'string' ? error : "Impossible de charger les informations du garage."}
        </Alert>
      )}

      {dashboardError && (
        <Alert variant="warning">
          {dashboardError}
        </Alert>
      )}

      <Row className="g-4">
        <Col lg={7}>
          <Card className="shadow-sm h-100 border-0">
            <Card.Body className="p-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <Card.Title className="mb-0">Activite recente</Card.Title>
                <Badge bg="dark">{metrics.totalRendezVous} rendez-vous</Badge>
              </div>

              {latestRendezVous.length === 0 ? (
                <div className="dashboard-empty-state">
                  Aucun rendez-vous pour le moment. Commencez par partager votre lien public
                  ou ajouter votre equipe.
                </div>
              ) : (
                <div className="dashboard-activity-list">
                  {latestRendezVous.map((item) => (
                    <div key={item.id} className="dashboard-activity-item">
                      <div>
                        <div className="fw-semibold">{formatDateTime(item.date)}</div>
                        <div className="small text-muted">
                          {item.description || 'Sans description'}
                        </div>
                      </div>
                      <Badge bg={getStatusVariant(item.status)}>
                        {getStatusLabel(item.status)}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col lg={5}>
          <Card className="shadow-sm h-100 border-0 dashboard-health-card">
            <Card.Body className="p-4">
              <div className="dashboard-panel-head mb-4">
                <span className="dashboard-panel-icon">
                  <FontAwesomeIcon icon={faArrowTrendUp} />
                </span>
                <div>
                  <Card.Title className="mb-1">Etat operationnel</Card.Title>
                  <p className="text-muted small mb-0">{operationalSignal.description}</p>
                </div>
              </div>

              <div className="dashboard-health-grid">
                <div className="dashboard-health-item">
                  <span>Flux courant</span>
                  <strong>{operationalSignal.label}</strong>
                </div>
                <div className="dashboard-health-item">
                  <span>Rendez-vous clos</span>
                  <strong>{metrics.closedCount}</strong>
                </div>
                <div className="dashboard-health-item">
                  <span>Garage ID</span>
                  <strong>{user?.garage_id || currentGarage?.id || '-'}</strong>
                </div>
                <div className="dashboard-health-item">
                  <span>Proprietaire</span>
                  <strong>{user?.first_name || user?.username || '-'}</strong>
                </div>
              </div>

              <div className="dashboard-priority-block mt-4">
                <div className="dashboard-priority-head">
                  <FontAwesomeIcon icon={faTriangleExclamation} />
                  <strong>Point de vigilance</strong>
                </div>
                <p className="mb-0">
                  {metrics.pendingCount > 0
                    ? `Traiter ${metrics.pendingCount} demande(s) en attente pour garder un delai de reponse professionnel.`
                    : "Aucune urgence immediate. Vous pouvez travailler la configuration du garage et l acquisition client."}
                </p>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="shadow-sm h-100 border-0 dashboard-action-card">
            <Card.Body className="p-4">
              <div className="dashboard-action-head">
                <FontAwesomeIcon icon={faScrewdriverWrench} />
                <Card.Title className="mb-0">Equipe mecanique</Card.Title>
              </div>
              <Card.Text>
                {metrics.mecaniciensCount > 0
                  ? `${metrics.mecaniciensCount} mecanicien(s) rattache(s) a votre garage.`
                  : "Aucun mecanicien ajoute pour l instant."}
              </Card.Text>
              <Button as={Link} to="/garage/mecaniciens" variant="outline-dark">
                Gerer les mecaniciens
              </Button>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="shadow-sm h-100 border-0 dashboard-action-card">
            <Card.Body className="p-4">
              <div className="dashboard-action-head">
                <FontAwesomeIcon icon={faCalendarCheck} />
                <Card.Title className="mb-0">Reservations</Card.Title>
              </div>
              <Card.Text>
                {metrics.pendingCount > 0
                  ? `${metrics.pendingCount} demande(s) attendent une action de votre equipe.`
                  : 'Aucune demande en attente pour le moment.'}
              </Card.Text>
              {currentGarage?.slug && (
                <Button as={Link} to={`/garage/${currentGarage.slug}/reservation`} variant="outline-dark">
                  Voir la page publique
                </Button>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="shadow-sm h-100 border-0 dashboard-action-card">
            <Card.Body className="p-4">
              <div className="dashboard-action-head">
                <FontAwesomeIcon icon={faArrowTrendUp} />
                <Card.Title className="mb-0">Vision MVP</Card.Title>
              </div>
              <Card.Text>
                Prochaine etape logique: ajouter les services, les disponibilites et un vrai suivi
                des rendez-vous par garage.
              </Card.Text>
              <Badge bg="secondary">{metrics.closedCount} rendez-vous clos</Badge>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default DashboardGarage;
