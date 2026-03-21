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
  faEye,
  faLink,
  faPaperPlane,
  faScrewdriverWrench,
  faTriangleExclamation,
  faUserGear,
} from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';
import { fetchGarageMecaniciensRequest, fetchMecanicienDisponibilitesRequest } from '../../personnel/api';
import { fetchGarageDisponibilitesRequest } from '../../planification/api';
import { fetchGarageServicesRequest } from '../api';
import { fetchRendezVousRequest } from '../../rendezvous/api';
import { useAuth } from '../../../shared/auth';
import { ErrorState, PageHeader, StatBadgeGroup } from '../../../shared/ui';
import { getRendezVousStatusLabel, getRendezVousStatusVariant } from '../../rendezvous/utils/status';

function DashboardGarage() {
  const { currentGarage, loading, error, user, refreshCurrentGarage } = useAuth();
  const [mecaniciens, setMecaniciens] = useState([]);
  const [disponibilitesMecaniciens, setDisponibilitesMecaniciens] = useState([]);
  const [garageDisponibilites, setGarageDisponibilites] = useState([]);
  const [garageServices, setGarageServices] = useState([]);
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
        const [mecaniciensData, rendezVousData, servicesData, disponibilitesGarageData] = await Promise.all([
          fetchGarageMecaniciensRequest(),
          fetchRendezVousRequest(),
          fetchGarageServicesRequest(),
          fetchGarageDisponibilitesRequest(),
        ]);
        const disponibilitesData = await fetchMecanicienDisponibilitesRequest();

        if (!mounted) {
          return;
        }

        setMecaniciens(mecaniciensData);
        setRendezVous(rendezVousData);
        setGarageServices(servicesData);
        setGarageDisponibilites(disponibilitesGarageData);
        setDisponibilitesMecaniciens(disponibilitesData);
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

  const today = new Date().toISOString().slice(0, 10);
  const publicReservationUrl = currentGarage?.slug
    ? `${window.location.origin}/garage/${currentGarage.slug}/reservation`
    : null;
  const activeGarageServicesCount = useMemo(() => garageServices.filter((item) => item.actif !== false).length, [garageServices]);
  const activeGarageDisponibilitesCount = useMemo(() => garageDisponibilites.filter((item) => item.actif !== false).length, [garageDisponibilites]);

  const mecaniciensWithoutAvailability = useMemo(() => {
    if (!mecaniciens.length) {
      return 0;
    }

    const mecaniciensWithAvailability = new Set(disponibilitesMecaniciens.map((item) => item.mecanicien));
    return mecaniciens.filter((item) => !mecaniciensWithAvailability.has(item.id)).length;
  }, [disponibilitesMecaniciens, mecaniciens]);

  const confirmedWithoutMecanicien = useMemo(() => {
    return rendezVous.filter((item) => item.status === 'confirmed' && !item.mecanicien).length;
  }, [rendezVous]);

  const metrics = useMemo(() => {
    const pendingCount = rendezVous.filter((item) => item.status === 'pending').length;
    const confirmedCount = rendezVous.filter((item) => item.status === 'confirmed').length;
    const modificationCount = rendezVous.filter((item) => item.status === 'modification_requested').length;
    const rejectedCount = rendezVous.filter((item) => item.status === 'rejected').length;
    const closedCount = rendezVous.filter((item) => (
      item.status === 'cancelled' || item.status === 'rejected' || item.status === 'done'
    )).length;
    const pendingRescheduleResponses = rendezVous.filter((item) => item.has_pending_reschedule).length;
    const todaysPendingCount = rendezVous.filter((item) => item.status === 'pending' && item.date?.slice(0, 10) === today).length;
    const todaysConfirmedCount = rendezVous.filter((item) => item.status === 'confirmed' && item.date?.slice(0, 10) === today).length;
    const responseTimes = rendezVous
      .filter((item) => item.status === 'confirmed' && item.confirmed_at)
      .map((item) => {
        const requestedAt = new Date(item.date);
        const confirmedAt = new Date(item.confirmed_at);
        const diffHours = (confirmedAt.getTime() - requestedAt.getTime()) / 3600000;
        return diffHours > 0 ? diffHours : null;
      })
      .filter((value) => value !== null);
    const averageResponseHours = responseTimes.length
      ? responseTimes.reduce((total, value) => total + value, 0) / responseTimes.length
      : null;
    const refusalRate = rendezVous.length ? Math.round((rejectedCount / rendezVous.length) * 100) : 0;

    return {
      mecaniciensCount: mecaniciens.length,
      pendingCount,
      confirmedCount,
      modificationCount,
      rejectedCount,
      closedCount,
      totalRendezVous: rendezVous.length,
      pendingRescheduleResponses,
      todaysPendingCount,
      todaysConfirmedCount,
      averageResponseHours,
      refusalRate,
      actionableBacklogCount: pendingCount + modificationCount + pendingRescheduleResponses,
    };
  }, [mecaniciens.length, rendezVous, today]);

  const todayActivity = useMemo(() => {
    return rendezVous
      .filter((item) => item.date?.slice(0, 10) === today)
      .sort((left, right) => new Date(left.date) - new Date(right.date))
      .slice(0, 6);
  }, [rendezVous, today]);

  const dashboardAlertsCount = metrics.pendingRescheduleResponses + confirmedWithoutMecanicien + mecaniciensWithoutAvailability;

  const conversionRate = useMemo(() => {
    if (!metrics.totalRendezVous) {
      return 0;
    }

    return Math.round((metrics.confirmedCount / metrics.totalRendezVous) * 100);
  }, [metrics.confirmedCount, metrics.totalRendezVous]);

  const readinessChecklist = useMemo(() => {
    const missing = [];
    if (!currentGarage?.description) {
      missing.push({
        label: 'Ajouter une description publique du garage',
        cta: '/garage/profil',
        ctaLabel: 'Completer le profil',
      });
    }
    if (!currentGarage?.phone || !currentGarage?.address) {
      missing.push({
        label: 'Completer les coordonnees visibles par les clients',
        cta: '/garage/profil',
        ctaLabel: 'Corriger le profil',
      });
    }
    if (!metrics.mecaniciensCount) {
      missing.push({
        label: 'Ajouter au moins un mecanicien a l equipe',
        cta: '/garage/mecaniciens',
        ctaLabel: 'Ajouter un mecanicien',
      });
    }
    if (mecaniciensWithoutAvailability > 0) {
      missing.push({
        label: `${mecaniciensWithoutAvailability} mecanicien(s) sans disponibilites`,
        cta: '/garage/mecaniciens/disponibilites',
        ctaLabel: 'Definir les disponibilites',
      });
    }
    if (!metrics.totalRendezVous) {
      missing.push({
        label: 'Commencer a diffuser le lien public de reservation',
        cta: currentGarage?.slug ? `/garage/${currentGarage.slug}/reservation` : '/garage/dashboard',
        ctaLabel: 'Voir la page publique',
      });
    }
    return missing;
  }, [currentGarage, mecaniciensWithoutAvailability, metrics.mecaniciensCount, metrics.totalRendezVous]);

  const operationalSignal = useMemo(() => {
    if (metrics.actionableBacklogCount >= 5) {
      return {
        label: 'Attention requise',
        description: 'Le garage a plusieurs decisions en attente qui ralentissent le flux.',
        tone: 'warning',
      };
    }

    if (readinessChecklist.length > 0) {
      return {
        label: 'Preparation incomplete',
        description: 'Le garage peut tourner, mais certains elements de base restent a finaliser.',
        tone: 'muted',
      };
    }

    return {
      label: 'Operationnel',
      description: 'Le garage est configure et le flux courant reste sous controle.',
      tone: 'success',
    };
  }, [metrics.actionableBacklogCount, readinessChecklist.length]);

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

  const handleShareLink = async () => {
    if (!publicReservationUrl) {
      return;
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title: currentGarage?.name || 'GarageFlow',
          text: 'Prenez rendez-vous en ligne avec notre garage.',
          url: publicReservationUrl,
        });
        setCopyMessage('Lien public partage.');
        return;
      } catch {
        // Fallback on copy if share is cancelled or unavailable.
      }
    }

    await handleCopyLink();
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

  const publicProfileMissing = [];
  if (!currentGarage?.description) {
    publicProfileMissing.push('description');
  }
  if (!currentGarage?.phone || !currentGarage?.address) {
    publicProfileMissing.push('coordonnees');
  }
  if (!activeGarageServicesCount) {
    publicProfileMissing.push('services');
  }
  if (!activeGarageDisponibilitesCount) {
    publicProfileMissing.push('horaires');
  }
  const publicProfileReady = publicProfileMissing.length === 0;
  const publicRequestsCount = metrics.totalRendezVous;

  return (
    <Container className="py-5 dashboard-garage">
      <PageHeader
        title="Pilotage du garage"
        description="Surveillez vos demandes, vos ressources et la preparation publique du garage depuis un seul ecran."
        className="mb-4"
        actions={(
          <StatBadgeGroup
            items={[
              { label: 'Demandes', value: metrics.pendingCount, bg: 'dark' },
              { label: 'Confirmes', value: metrics.confirmedCount, bg: 'success' },
              { label: 'Alertes', value: dashboardAlertsCount, bg: 'warning', text: 'dark' },
              { label: 'Conversion', value: `${conversionRate}%`, bg: 'info' },
            ]}
          />
        )}
      />

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
                    {currentGarage?.description
                      || 'Une vue de pilotage pour traiter les demandes, organiser l equipe et garder un garage operationnel.'}
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
                      <FontAwesomeIcon icon={faClock} />
                    </div>
                    <span className="dashboard-stat-label">A confirmer aujourd hui</span>
                    <strong className="dashboard-stat-value">{metrics.todaysPendingCount}</strong>
                  </div>
                </Col>
                <Col sm={6} lg={3}>
                  <div className="dashboard-stat-card">
                    <div className="dashboard-stat-icon">
                      <FontAwesomeIcon icon={faCalendarCheck} />
                    </div>
                    <span className="dashboard-stat-label">Temps moyen de reponse</span>
                    <strong className="dashboard-stat-value">
                      {metrics.averageResponseHours !== null ? `${metrics.averageResponseHours.toFixed(1)} h` : '-'}
                    </strong>
                  </div>
                </Col>
                <Col sm={6} lg={3}>
                  <div className="dashboard-stat-card">
                    <div className="dashboard-stat-icon">
                      <FontAwesomeIcon icon={faBolt} />
                    </div>
                    <span className="dashboard-stat-label">Taux de refus</span>
                    <strong className="dashboard-stat-value">{metrics.refusalRate}%</strong>
                  </div>
                </Col>
                <Col sm={6} lg={3}>
                  <div className="dashboard-stat-card">
                    <div className="dashboard-stat-icon">
                      <FontAwesomeIcon icon={faUserGear} />
                    </div>
                    <span className="dashboard-stat-label">Equipe mecanique</span>
                    <strong className="dashboard-stat-value">{metrics.mecaniciensCount}</strong>
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

              <div className="dashboard-link-box mb-3">
                {publicReservationUrl || 'Lien indisponible'}
              </div>

              <div className="d-flex flex-wrap gap-2">
                {currentGarage?.slug && (
                  <Button as={Link} to={`/garage/${currentGarage.slug}/reservation`} variant="dark">
                    <FontAwesomeIcon icon={faEye} className="me-2" />
                    Apercu public
                  </Button>
                )}
                <Button
                  variant="outline-primary"
                  onClick={handleShareLink}
                  disabled={!publicReservationUrl}
                >
                  <FontAwesomeIcon icon={faPaperPlane} className="me-2" />
                  Partager
                </Button>
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

              {!publicProfileReady && (
                <Alert variant="warning" className="mt-4 mb-0">
                  <div className="fw-semibold mb-1">Diffusion a completer avant partage large</div>
                  <div className="small">
                    Il manque encore : {publicProfileMissing.join(', ')}.
                  </div>
                  <div className="d-flex flex-wrap gap-2 mt-2">
                    {publicProfileMissing.includes('description') || publicProfileMissing.includes('coordonnees') ? (
                      <Button as={Link} to="/garage/profil" size="sm" variant="outline-dark">
                        Completer le profil
                      </Button>
                    ) : null}
                    {publicProfileMissing.includes('services') ? (
                      <Button as={Link} to="/garage/services" size="sm" variant="outline-dark">
                        Ajouter des services
                      </Button>
                    ) : null}
                    {publicProfileMissing.includes('horaires') ? (
                      <Button as={Link} to="/garage/disponibilites" size="sm" variant="outline-dark">
                        Definir les horaires
                      </Button>
                    ) : null}
                  </div>
                </Alert>
              )}

              <div className="dashboard-mini-metrics mt-4">
                <div>
                  <span>RDV du jour</span>
                  <strong>{metrics.todaysConfirmedCount}</strong>
                </div>
                <div>
                  <span>Taux confirme</span>
                  <strong>{conversionRate}%</strong>
                </div>
                <div>
                  <span>Alertes</span>
                  <strong>{dashboardAlertsCount}</strong>
                </div>
                <div>
                  <span>Backlog</span>
                  <strong>{metrics.actionableBacklogCount}</strong>
                </div>
                <div>
                  <span>Demandes via lien</span>
                  <strong>{publicRequestsCount}</strong>
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

      <ErrorState variant="warning">
        {typeof error === 'string' ? error : "Impossible de charger les informations du garage."}
      </ErrorState>

      <ErrorState variant="warning">{dashboardError}</ErrorState>

      {(metrics.actionableBacklogCount > 0 || readinessChecklist.length > 0) && (
        <Alert variant="warning" className="mb-4">
          <div className="d-flex flex-column gap-3">
            <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3">
              <div>
                <strong>Alertes prioritaires</strong>
                <div className="small">
                  {metrics.actionableBacklogCount > 0
                    ? `${metrics.actionableBacklogCount} element(s) demandent une action immediate du garage.`
                    : 'Le flux est stable, vous pouvez finaliser la configuration du garage.'}
                </div>
              </div>
              <div className="d-flex flex-wrap gap-2">
                {metrics.pendingCount > 0 && (
                  <Button as={Link} to="/garage/rendez-vous" variant="dark">
                    Traiter les demandes
                  </Button>
                )}
                {metrics.pendingRescheduleResponses > 0 && (
                  <Button as={Link} to="/garage/rendez-vous" variant="outline-dark">
                    Voir les reprogrammations
                  </Button>
                )}
                {readinessChecklist.length > 0 && (
                  <Button as={Link} to={readinessChecklist[0].cta} variant="outline-secondary">
                    Corriger le manque principal
                  </Button>
                )}
              </div>
            </div>
            {readinessChecklist.length > 0 && (
              <div className="small d-flex flex-column gap-2">
                {readinessChecklist.slice(0, 3).map((item) => (
                  <div key={item.label} className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-2 border rounded p-2 bg-white">
                    <span>{item.label}</span>
                    <Button as={Link} to={item.cta} size="sm" variant="outline-dark">
                      {item.ctaLabel}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Alert>
      )}

      <Row className="g-4">
        <Col lg={7}>
          <Card className="shadow-sm h-100 border-0">
            <Card.Body className="p-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <Card.Title className="mb-0">Activite du jour</Card.Title>
                <Badge bg="dark">{todayActivity.length} element(s)</Badge>
              </div>

              {todayActivity.length === 0 ? (
                <div className="dashboard-empty-state">
                  Aucune activite prevue aujourd hui. La priorite utile est de traiter les demandes ouvertes ou de diffuser le lien public.
                </div>
              ) : (
                <div className="dashboard-activity-list">
                  {todayActivity.map((item) => (
                    <div key={item.id} className="dashboard-activity-item">
                      <div>
                        <div className="fw-semibold">{formatDateTime(item.date)}</div>
                        <div className="small text-muted">
                          {item.client_name || 'Client'} · {item.service_details?.nom || item.description || 'Sans description'}
                        </div>
                      </div>
                      <Badge bg={getRendezVousStatusVariant(item.status)}>
                        {getRendezVousStatusLabel(item.status)}
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
                  <span>En attente</span>
                  <strong>{metrics.pendingCount}</strong>
                </div>
                <div className="dashboard-health-item">
                  <span>Demandes de modif</span>
                  <strong>{metrics.modificationCount}</strong>
                </div>
                <div className="dashboard-health-item">
                  <span>Sans mecanicien</span>
                  <strong>{confirmedWithoutMecanicien}</strong>
                </div>
                <div className="dashboard-health-item">
                  <span>Disponibilites manquantes</span>
                  <strong>{mecaniciensWithoutAvailability}</strong>
                </div>
                <div className="dashboard-health-item">
                  <span>Reponses attendues</span>
                  <strong>{metrics.pendingRescheduleResponses}</strong>
                </div>
                <div className="dashboard-health-item">
                  <span>Garage ID</span>
                  <strong>{user?.garage_id || currentGarage?.id || '-'}</strong>
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
                    : metrics.pendingRescheduleResponses > 0
                      ? `${metrics.pendingRescheduleResponses} reprogrammation(s) attendent encore une decision du garage.`
                      : confirmedWithoutMecanicien > 0
                        ? `${confirmedWithoutMecanicien} rendez-vous confirme(s) doivent encore etre rattaches a un mecanicien.`
                        : mecaniciensWithoutAvailability > 0
                          ? `${mecaniciensWithoutAvailability} mecanicien(s) n ont pas encore de disponibilites configurees.`
                          : "Aucune urgence immediate. Le garage peut se concentrer sur la qualite de service et l acquisition client."}
                </p>
              </div>

              <div className="dashboard-priority-block mt-4">
                <div className="dashboard-priority-head">
                  <FontAwesomeIcon icon={faBolt} />
                  <strong>Ce qui manque pour etre operationnel</strong>
                </div>
                {readinessChecklist.length > 0 ? (
                  <div className="small d-flex flex-column gap-2">
                    {readinessChecklist.map((item) => (
                      <div key={item.label} className="d-flex justify-content-between align-items-center gap-2">
                        <span>{item.label}</span>
                        <Button as={Link} to={item.cta} size="sm" variant="outline-dark">
                          {item.ctaLabel}
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mb-0 small">
                    Le garage est suffisamment configure pour tourner proprement sur le MVP.
                  </p>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="shadow-sm h-100 border-0 dashboard-action-card">
            <Card.Body className="p-4">
              <div className="dashboard-action-head">
                <FontAwesomeIcon icon={faBuilding} />
                <Card.Title className="mb-0">Profil garage</Card.Title>
              </div>
              <Card.Text>
                Mettez a jour le nom, l adresse, le telephone et la description visibles par les clients.
              </Card.Text>
              <Button as={Link} to="/garage/profil" variant="outline-dark">
                Modifier le profil
              </Button>
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
              <div className="mt-3">
                <Button as={Link} to="/garage/mecaniciens/disponibilites" variant="outline-secondary">
                  Definir les disponibilites
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="shadow-sm h-100 border-0 dashboard-action-card">
            <Card.Body className="p-4">
              <div className="dashboard-action-head">
                <FontAwesomeIcon icon={faClock} />
                <Card.Title className="mb-0">Disponibilites</Card.Title>
              </div>
              <Card.Text>
                Definissez les creneaux hebdomadaires affiches aux clients et posez la base du planning.
              </Card.Text>
              <Button as={Link} to="/garage/disponibilites" variant="outline-dark">
                Gerer les horaires
              </Button>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="shadow-sm h-100 border-0 dashboard-action-card">
            <Card.Body className="p-4">
              <div className="dashboard-action-head">
                <FontAwesomeIcon icon={faCalendarCheck} />
                <Card.Title className="mb-0">Planning</Card.Title>
              </div>
              <Card.Text>
                Consultez la grille horaire, la charge de l atelier et les conflits de creneaux.
              </Card.Text>
              <Button as={Link} to="/garage/planning" variant="outline-dark">
                Ouvrir le planning
              </Button>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="shadow-sm h-100 border-0 dashboard-action-card">
            <Card.Body className="p-4">
              <div className="dashboard-action-head">
                <FontAwesomeIcon icon={faBolt} />
                <Card.Title className="mb-0">Services</Card.Title>
              </div>
              <Card.Text>
                Publiez les prestations visibles sur votre fiche publique et structurez les demandes clients.
              </Card.Text>
              <Button as={Link} to="/garage/services" variant="outline-dark">
                Gerer les services
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
              <Button as={Link} to="/garage/rendez-vous" variant="outline-dark">
                Gerer les demandes
              </Button>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="shadow-sm h-100 border-0 dashboard-action-card">
            <Card.Body className="p-4">
              <div className="dashboard-action-head">
                <FontAwesomeIcon icon={faArrowTrendUp} />
                <Card.Title className="mb-0">Pilotage</Card.Title>
              </div>
              <Card.Text>
                Temps moyen de reponse : {metrics.averageResponseHours !== null ? `${metrics.averageResponseHours.toFixed(1)} h` : 'non calcule'}.
                Taux de refus : {metrics.refusalRate}%.
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
