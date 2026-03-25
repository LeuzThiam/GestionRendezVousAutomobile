import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Button, Card, Col, Container, Row } from 'react-bootstrap';
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
import { fetchOrganizationMecaniciensRequest, fetchMecanicienDisponibilitesRequest } from '../../personnel/api';
import { fetchOrganizationDisponibilitesRequest } from '../../planification/api';
import { fetchOrganizationServicesRequest } from '../api';
import { fetchRendezVousRequest } from '../../rendezvous/api';
import { useAuth } from '../../../shared/auth';
import { ErrorState, LoadingState, PageHeader, SectionCard, StatBadgeGroup } from '../../../shared/ui';
import { getRendezVousStatusLabel, getRendezVousStatusVariant } from '../../rendezvous/utils/status';

function DashboardPro() {
  const { currentOrganization, loading, error, user, refreshCurrentOrganization } = useAuth();
  const [mecaniciens, setMecaniciens] = useState([]);
  const [disponibilitesMecaniciens, setDisponibilitesMecaniciens] = useState([]);
  const [garageDisponibilites, setGarageDisponibilites] = useState([]);
  const [garageServices, setGarageServices] = useState([]);
  const [rendezVous, setRendezVous] = useState([]);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState(null);
  const [copyMessage, setCopyMessage] = useState(null);

  useEffect(() => {
    if (!currentOrganization) {
      refreshCurrentOrganization().catch(() => {});
    }
  }, [currentOrganization, refreshCurrentOrganization]);

  useEffect(() => {
    let mounted = true;

    async function loadDashboardData() {
      try {
        setDashboardLoading(true);
        setDashboardError(null);
        const [mecaniciensData, rendezVousData, servicesData, disponibilitesGarageData] = await Promise.all([
          fetchOrganizationMecaniciensRequest(),
          fetchRendezVousRequest(),
          fetchOrganizationServicesRequest(),
          fetchOrganizationDisponibilitesRequest(),
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

    if (currentOrganization) {
      loadDashboardData();
    }

    return () => {
      mounted = false;
    };
  }, [currentOrganization]);

  const today = new Date().toISOString().slice(0, 10);
  const publicReservationUrl = currentOrganization?.slug
    ? `${window.location.origin}/pro/${currentOrganization.slug}/reservation`
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

  const confirmedSansEmploye = useMemo(() => {
    return rendezVous.filter((item) => {
      const assigne = item.employe ?? item.mecanicien;
      return item.status === 'confirmed' && !assigne;
    }).length;
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

  const dashboardAlertsCount = metrics.pendingRescheduleResponses + confirmedSansEmploye + mecaniciensWithoutAvailability;

  const conversionRate = useMemo(() => {
    if (!metrics.totalRendezVous) {
      return 0;
    }

    return Math.round((metrics.confirmedCount / metrics.totalRendezVous) * 100);
  }, [metrics.confirmedCount, metrics.totalRendezVous]);

  const readinessChecklist = useMemo(() => {
    const missing = [];
    if (!currentOrganization?.description) {
      missing.push({
        label: 'Ajouter une description publique de l’établissement',
        cta: '/pro/profil',
        ctaLabel: 'Compléter le profil',
      });
    }
    if (!currentOrganization?.phone || !currentOrganization?.address) {
      missing.push({
        label: 'Compléter les coordonnées visibles par les clients',
        cta: '/pro/profil',
        ctaLabel: 'Corriger le profil',
      });
    }
    if (!metrics.mecaniciensCount) {
      missing.push({
        label: 'Ajouter au moins un employé à l’équipe',
        cta: '/pro/mecaniciens',
        ctaLabel: 'Ajouter un employé',
      });
    }
    if (mecaniciensWithoutAvailability > 0) {
      missing.push({
        label: `${mecaniciensWithoutAvailability} employé(s) sans disponibilités`,
        cta: '/pro/mecaniciens/disponibilites',
        ctaLabel: 'Définir les disponibilités',
      });
    }
    if (!metrics.totalRendezVous) {
      missing.push({
        label: 'Commencer à diffuser le lien public de réservation',
        cta: currentOrganization?.slug ? `/pro/${currentOrganization.slug}/reservation` : '/pro/dashboard',
        ctaLabel: 'Voir la page publique',
      });
    }
    return missing;
  }, [currentOrganization, mecaniciensWithoutAvailability, metrics.mecaniciensCount, metrics.totalRendezVous]);

  const operationalSignal = useMemo(() => {
    if (metrics.actionableBacklogCount >= 5) {
      return {
        label: 'Attention requise',
        description: 'L’établissement a plusieurs décisions en attente qui ralentissent le flux.',
        tone: 'warning',
      };
    }

    if (readinessChecklist.length > 0) {
      return {
        label: 'Préparation incomplète',
        description: 'L’établissement peut fonctionner, mais certains éléments de base restent à finaliser.',
        tone: 'muted',
      };
    }

    return {
      label: 'Opérationnel',
      description: 'L’établissement est configuré et le flux courant reste sous contrôle.',
      tone: 'success',
    };
  }, [metrics.actionableBacklogCount, readinessChecklist.length]);

  const handleCopyLink = async () => {
    if (!publicReservationUrl) {
      return;
    }

    try {
      await navigator.clipboard.writeText(publicReservationUrl);
      setCopyMessage('Lien public copié.');
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
          title: currentOrganization?.name || 'Plateforme RDV',
          text: 'Prenez rendez-vous en ligne avec notre établissement.',
          url: publicReservationUrl,
        });
        setCopyMessage('Lien public partagé.');
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
  if (!currentOrganization?.description) {
    publicProfileMissing.push('description');
  }
  if (!currentOrganization?.phone || !currentOrganization?.address) {
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
  const topStats = [
    { label: 'Demandes', value: metrics.pendingCount, bg: 'dark' },
    { label: 'Confirmés', value: metrics.confirmedCount, bg: 'success' },
    { label: 'Alertes', value: dashboardAlertsCount, bg: 'warning', text: 'dark' },
    { label: 'Conversion', value: `${conversionRate}%`, bg: 'info' },
  ];
  const overviewTiles = [
    {
      label: 'Demandes prioritaires',
      value: metrics.actionableBacklogCount,
      detail: 'Backlog à traiter',
    },
    {
      label: 'Équipe disponible',
      value: Math.max(metrics.mecaniciensCount - mecaniciensWithoutAvailability, 0),
      detail: 'Employés prêts',
    },
    {
      label: 'Diffusion publique',
      value: publicProfileReady ? 'OK' : 'À revoir',
      detail: publicProfileReady ? 'Profil publiable' : `${publicProfileMissing.length} point(s) à corriger`,
    },
    {
      label: 'Réservations du jour',
      value: metrics.todaysConfirmedCount,
      detail: 'Rendez-vous confirmés',
    },
  ];

  return (
    <Container className="py-5 dashboard-garage">
      <PageHeader
        title="Pilotage de l’établissement"
        description="Surveillez vos demandes, vos ressources et la préparation de votre fiche publique depuis un seul écran."
        className="mb-4"
        actions={<StatBadgeGroup items={topStats} />}
      />

      <Row className="g-3 mb-4">
        {overviewTiles.map((tile) => (
          <Col md={6} xl={3} key={tile.label}>
            <div className="dashboard-kpi-strip">
              <span>{tile.label}</span>
              <strong>{tile.value}</strong>
              <small>{tile.detail}</small>
            </div>
          </Col>
        ))}
      </Row>

      <Row className="g-4 mb-4">
        <Col xl={8}>
          <Card className="dashboard-hero border-0 shadow-sm h-100">
            <Card.Body className="p-4 p-lg-5">
              <div className="d-flex flex-wrap justify-content-between align-items-start gap-3">
                <div>
                  <p className="dashboard-eyebrow mb-2">Espace pro</p>
                  <h1 className="mb-2 d-flex align-items-center gap-3">
                    <span className="dashboard-icon-orb">
                      <FontAwesomeIcon icon={faBuilding} />
                    </span>
                    {currentOrganization?.name || 'Tableau de bord'}
                  </h1>
                  <div className="dashboard-meta-row mb-3">
                    <span>{currentOrganization?.slug || 'slug-indisponible'}</span>
                    <span>{currentOrganization?.address || 'Adresse à renseigner'}</span>
                    <span>{currentOrganization?.phone || 'Téléphone à renseigner'}</span>
                  </div>
                  <p className="dashboard-hero-text mb-0">
                    {currentOrganization?.description
                      || 'Une vue de pilotage pour traiter les demandes, organiser l’équipe et garder l’établissement opérationnel.'}
                  </p>
                </div>

                <div className="text-lg-end">
                  <Badge bg="light" text="dark" className="dashboard-badge mb-2">
                    {user?.role === 'owner' ? 'Propriétaire' : 'Utilisateur'}
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
                    <span className="dashboard-stat-label">À confirmer aujourd’hui</span>
                    <strong className="dashboard-stat-value">{metrics.todaysPendingCount}</strong>
                  </div>
                </Col>
                <Col sm={6} lg={3}>
                  <div className="dashboard-stat-card">
                    <div className="dashboard-stat-icon">
                      <FontAwesomeIcon icon={faCalendarCheck} />
                    </div>
                    <span className="dashboard-stat-label">Temps moyen de réponse</span>
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
                    <span className="dashboard-stat-label">Équipe</span>
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
                  <Card.Title className="mb-1">Lien public de réservation</Card.Title>
                  <p className="text-muted small mb-0">
                    Point d’entrée client pour les demandes de rendez-vous.
                  </p>
                </div>
              </div>

              <div className="dashboard-link-box mb-3">
                {publicReservationUrl || 'Lien indisponible'}
              </div>

              <div className="d-flex flex-wrap gap-2">
                {currentOrganization?.slug && (
                  <Button as={Link} to={`/pro/${currentOrganization.slug}/reservation`} variant="dark">
                    <FontAwesomeIcon icon={faEye} className="me-2" />
                    Aperçu public
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
                  <div className="fw-semibold mb-1">Diffusion à compléter avant partage large</div>
                  <div className="small">
                    Il manque encore : {publicProfileMissing.join(', ')}.
                  </div>
                  <div className="d-flex flex-wrap gap-2 mt-2">
                    {publicProfileMissing.includes('description') || publicProfileMissing.includes('coordonnees') ? (
                      <Button as={Link} to="/pro/profil" size="sm" variant="outline-dark">
                        Compléter le profil
                      </Button>
                    ) : null}
                    {publicProfileMissing.includes('services') ? (
                      <Button as={Link} to="/pro/services" size="sm" variant="outline-dark">
                        Ajouter des services
                      </Button>
                    ) : null}
                    {publicProfileMissing.includes('horaires') ? (
                      <Button as={Link} to="/pro/disponibilites" size="sm" variant="outline-dark">
                        Définir les horaires
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
                  <span>Taux confirmé</span>
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

      {(loading || dashboardLoading) && <LoadingState label="Chargement du dashboard..." />}

      <ErrorState variant="warning">
        {typeof error === 'string' ? error : "Impossible de charger les informations de l’établissement."}
      </ErrorState>

      <ErrorState variant="warning">{dashboardError}</ErrorState>

      {(metrics.actionableBacklogCount > 0 || readinessChecklist.length > 0) && (
        <Alert variant="warning" className="mb-4 dashboard-alert-banner">
          <div className="d-flex flex-column gap-3">
            <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3">
              <div>
                <strong>Alertes prioritaires</strong>
                <div className="small">
                  {metrics.actionableBacklogCount > 0
                    ? `${metrics.actionableBacklogCount} élément(s) demandent une action immédiate.`
                    : 'Le flux est stable, vous pouvez finaliser la configuration de l’établissement.'}
                </div>
              </div>
              <div className="d-flex flex-wrap gap-2">
                {metrics.pendingCount > 0 && (
                  <Button as={Link} to="/pro/rendez-vous" variant="dark">
                    Traiter les demandes
                  </Button>
                )}
                {metrics.pendingRescheduleResponses > 0 && (
                  <Button as={Link} to="/pro/rendez-vous" variant="outline-dark">
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
          <SectionCard
            className="shadow-sm h-100 border-0"
            title="Activité du jour"
            subtitle="Vue immédiate des passages planifiés et de la charge de l’atelier."
            actions={<Badge bg="dark">{todayActivity.length} élément(s)</Badge>}
            bodyClassName="p-4"
          >
            {todayActivity.length === 0 ? (
              <div className="dashboard-empty-state">
                Aucune activité prévue aujourd’hui. La priorité utile est de traiter les demandes ouvertes ou de diffuser le lien public.
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
          </SectionCard>
        </Col>

        <Col lg={5}>
          <SectionCard
            className="shadow-sm h-100 border-0 dashboard-health-card"
            title="État opérationnel"
            subtitle={operationalSignal.description}
            actions={(
              <Badge bg={operationalSignal.tone === 'success' ? 'success' : operationalSignal.tone === 'warning' ? 'warning' : 'secondary'}>
                {operationalSignal.label}
              </Badge>
            )}
            bodyClassName="p-4"
          >
            <div className="dashboard-panel-head mb-4">
              <span className="dashboard-panel-icon">
                <FontAwesomeIcon icon={faArrowTrendUp} />
              </span>
              <div>
                <div className="small text-muted">Synthèse exploitation</div>
                <div className="fw-semibold">Lecture rapide du niveau de préparation de l’établissement</div>
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
                <span>Sans employé assigné</span>
                <strong>{confirmedSansEmploye}</strong>
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
                <span>ID établissement</span>
                <strong>{user?.organization_id || currentOrganization?.id || '-'}</strong>
              </div>
            </div>

            <div className="dashboard-priority-block mt-4">
              <div className="dashboard-priority-head">
                <FontAwesomeIcon icon={faTriangleExclamation} />
                <strong>Point de vigilance</strong>
              </div>
              <p className="mb-0">
                {metrics.pendingCount > 0
                  ? `Traiter ${metrics.pendingCount} demande(s) en attente pour garder un délai de réponse professionnel.`
                  : metrics.pendingRescheduleResponses > 0
                    ? `${metrics.pendingRescheduleResponses} reprogrammation(s) attendent encore une décision de votre part.`
                    : confirmedSansEmploye > 0
                      ? `${confirmedSansEmploye} rendez-vous confirmé(s) doivent encore être rattachés à un employé.`
                      : mecaniciensWithoutAvailability > 0
                        ? `${mecaniciensWithoutAvailability} employé(s) n’ont pas encore de disponibilités configurées.`
                        : "Aucune urgence immédiate. Vous pouvez vous concentrer sur la qualité de service et l’acquisition client."}
              </p>
            </div>

            <div className="dashboard-priority-block mt-4">
              <div className="dashboard-priority-head">
                <FontAwesomeIcon icon={faBolt} />
                <strong>Ce qui manque pour être opérationnel</strong>
              </div>
              {readinessChecklist.length > 0 ? (
                <div className="small d-flex flex-column gap-2">
                  {readinessChecklist.map((item) => (
                    <div key={item.label} className="d-flex justify-content-between align-items-center gap-2">
                      <span>{item.label}</span>
                      <Button as={Link} to={item.cta} size="sm" variant="outline-light">
                        {item.ctaLabel}
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mb-0 small">
                  L’établissement est suffisamment configuré pour fonctionner correctement sur le MVP.
                </p>
              )}
            </div>
          </SectionCard>
        </Col>

        <Col md={4}>
          <Card className="shadow-sm h-100 border-0 dashboard-action-card dashboard-action-card-primary">
            <Card.Body className="p-4">
              <div className="dashboard-action-head">
                <FontAwesomeIcon icon={faBuilding} />
                <Card.Title className="mb-0">Profil de l’établissement</Card.Title>
              </div>
              <Card.Text>
                Mettez à jour le nom, l’adresse, le téléphone et la description visibles par les clients.
              </Card.Text>
              <Button as={Link} to="/pro/profil" variant="outline-dark">
                Modifier le profil
              </Button>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="shadow-sm h-100 border-0 dashboard-action-card dashboard-action-card-accent">
            <Card.Body className="p-4">
              <div className="dashboard-action-head">
                <FontAwesomeIcon icon={faScrewdriverWrench} />
                <Card.Title className="mb-0">Équipe</Card.Title>
              </div>
              <Card.Text>
                {metrics.mecaniciensCount > 0
                  ? `${metrics.mecaniciensCount} employé(s) rattaché(s) à votre établissement.`
                  : "Aucun employé ajouté pour l’instant."}
              </Card.Text>
              <Button as={Link} to="/pro/mecaniciens" variant="outline-dark">
                Gérer les employés
              </Button>
              <div className="mt-3">
                <Button as={Link} to="/pro/mecaniciens/disponibilites" variant="outline-secondary">
                  Définir les disponibilités
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
                <Card.Title className="mb-0">Disponibilités</Card.Title>
              </div>
              <Card.Text>
                Définissez les créneaux hebdomadaires affichés aux clients et posez la base du planning.
              </Card.Text>
              <Button as={Link} to="/pro/disponibilites" variant="outline-dark">
                Gérer les horaires
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
                Consultez la grille horaire, la charge de l’atelier et les conflits de créneaux.
              </Card.Text>
              <Button as={Link} to="/pro/planning" variant="outline-dark">
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
              <Button as={Link} to="/pro/services" variant="outline-dark">
                Gérer les services
              </Button>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="shadow-sm h-100 border-0 dashboard-action-card">
            <Card.Body className="p-4">
              <div className="dashboard-action-head">
                <FontAwesomeIcon icon={faCalendarCheck} />
                <Card.Title className="mb-0">Réservations</Card.Title>
              </div>
              <Card.Text>
                {metrics.pendingCount > 0
                  ? `${metrics.pendingCount} demande(s) attendent une action de votre équipe.`
                  : 'Aucune demande en attente pour le moment.'}
              </Card.Text>
              <Button as={Link} to="/pro/rendez-vous" variant="outline-dark">
                Gérer les demandes
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
                Temps moyen de réponse : {metrics.averageResponseHours !== null ? `${metrics.averageResponseHours.toFixed(1)} h` : 'non calculé'}.
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

export default DashboardPro;
