import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Card, Col, Container, Form, Row, Spinner } from 'react-bootstrap';
import { fetchGarageMecaniciensRequest, fetchMecanicienDisponibilitesRequest } from '../api/mecaniciens';
import { fetchRendezVousRequest } from '../api/rendezVous';
import { getRendezVousStatusLabel } from '../utils/rendezVousStatus';

function formatDateTime(value) {
  if (!value) {
    return '-';
  }

  return new Intl.DateTimeFormat('fr-CA', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function getDateKey(value) {
  if (!value) {
    return '';
  }

  return new Date(value).toISOString().slice(0, 10);
}

function formatTimeRange(item) {
  return `${item.jour_label} ${item.heure_debut} - ${item.heure_fin}`;
}

function getTimeKey(value) {
  if (!value) {
    return '';
  }

  return new Date(value).toLocaleTimeString('fr-CA', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function isAppointmentWithinAvailability(appointment, mecanicienDisponibilites) {
  if (!appointment?.date || !mecanicienDisponibilites.length) {
    return false;
  }

  const appointmentDate = new Date(appointment.date);
  const weekday = appointmentDate.getDay() === 0 ? 6 : appointmentDate.getDay() - 1;
  const timeKey = getTimeKey(appointment.date);

  return mecanicienDisponibilites.some((item) => (
    item.jour_semaine === weekday
    && item.heure_debut <= timeKey
    && item.heure_fin >= timeKey
  ));
}

function PlanningGarage() {
  const [rendezVous, setRendezVous] = useState([]);
  const [mecaniciens, setMecaniciens] = useState([]);
  const [disponibilites, setDisponibilites] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function loadPlanningData() {
      try {
        setLoading(true);
        setError(null);
        const [rendezVousData, mecaniciensData] = await Promise.all([
          fetchRendezVousRequest(),
          fetchGarageMecaniciensRequest(),
        ]);
        const disponibilitesData = await fetchMecanicienDisponibilitesRequest();

        if (!mounted) {
          return;
        }

        setRendezVous(rendezVousData);
        setMecaniciens(mecaniciensData);
        setDisponibilites(disponibilitesData);
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
          setError("Impossible de charger le planning du garage.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadPlanningData();
    return () => {
      mounted = false;
    };
  }, []);

  const confirmedAppointments = useMemo(() => {
    return rendezVous
      .filter((item) => item.status === 'confirmed')
      .sort((left, right) => new Date(left.date) - new Date(right.date));
  }, [rendezVous]);

  const appointmentsForSelectedDate = useMemo(() => {
    return confirmedAppointments.filter((item) => getDateKey(item.date) === selectedDate);
  }, [confirmedAppointments, selectedDate]);

  const planningByMecanicien = useMemo(() => {
    return mecaniciens.map((mecanicien) => {
      const mecanicienAppointments = appointmentsForSelectedDate.filter(
        (item) => Number(item.mecanicien) === mecanicien.id
      );
      const mecanicienDisponibilites = disponibilites.filter((item) => item.mecanicien === mecanicien.id);
      const appointmentsOutsideAvailability = mecanicienAppointments.filter((appointment) => (
        mecanicienDisponibilites.length > 0
          ? !isAppointmentWithinAvailability(appointment, mecanicienDisponibilites)
          : false
      ));

      return {
        mecanicien,
        appointments: mecanicienAppointments,
        disponibilites: mecanicienDisponibilites,
        appointmentsOutsideAvailability,
      };
    });
  }, [appointmentsForSelectedDate, disponibilites, mecaniciens]);

  const unassignedAppointments = useMemo(() => {
    return appointmentsForSelectedDate.filter((item) => !item.mecanicien);
  }, [appointmentsForSelectedDate]);

  const occupancy = useMemo(() => {
    if (!mecaniciens.length) {
      return 0;
    }

    const busyCount = planningByMecanicien.filter((entry) => entry.appointments.length > 0).length;
    return Math.round((busyCount / mecaniciens.length) * 100);
  }, [mecaniciens.length, planningByMecanicien]);

  const mecaniciensWithoutAvailability = useMemo(() => {
    return planningByMecanicien.filter((entry) => entry.disponibilites.length === 0).length;
  }, [planningByMecanicien]);

  const appointmentsOutsideAvailabilityCount = useMemo(() => {
    return planningByMecanicien.reduce(
      (total, entry) => total + entry.appointmentsOutsideAvailability.length,
      0
    );
  }, [planningByMecanicien]);

  return (
    <Container className="py-5">
      <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-end gap-3 mb-4">
        <div>
          <h1 className="mb-2">Planning du garage</h1>
          <p className="text-muted mb-0">
            Visualisez les rendez-vous confirmes par jour et par mecanicien pour organiser l atelier.
          </p>
        </div>
        <div className="d-flex flex-wrap gap-2">
          <Badge bg="dark">Confirmes: {confirmedAppointments.length}</Badge>
          <Badge bg="secondary">Equipe: {mecaniciens.length}</Badge>
          <Badge bg="info">Occupation: {occupancy}%</Badge>
          <Badge bg="warning" text="dark">Alertes: {unassignedAppointments.length + appointmentsOutsideAvailabilityCount}</Badge>
        </div>
      </div>

      {loading && (
        <div className="d-flex align-items-center gap-2 mb-4">
          <Spinner animation="border" size="sm" />
          <span>Chargement du planning...</span>
        </div>
      )}
      {error && <Alert variant="danger">{error}</Alert>}

      <Card className="shadow-sm border-0 mb-4">
        <Card.Body>
          <Row className="align-items-end g-3">
            <Col md={4}>
              <Form.Group controlId="planningDate">
                <Form.Label>Date du planning</Form.Label>
                <Form.Control
                  type="date"
                  value={selectedDate}
                  onChange={(event) => setSelectedDate(event.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={8}>
              <div className="small text-muted mb-1">Synthese</div>
              <div>
                {appointmentsForSelectedDate.length} rendez-vous confirme(s) sur la journee, dont {unassignedAppointments.length} sans mecanicien affecte.
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {unassignedAppointments.length > 0 && (
        <Alert variant="warning">
          {unassignedAppointments.length} rendez-vous confirme(s) n ont pas encore de mecanicien affecte pour cette date.
        </Alert>
      )}

      {(appointmentsOutsideAvailabilityCount > 0 || mecaniciensWithoutAvailability > 0) && (
        <Alert variant="warning">
          <div className="fw-semibold mb-1">Points de vigilance planning</div>
          <div className="small">
            {appointmentsOutsideAvailabilityCount > 0
              ? `${appointmentsOutsideAvailabilityCount} rendez-vous confirme(s) tombent hors des disponibilites definies. `
              : ''}
            {mecaniciensWithoutAvailability > 0
              ? `${mecaniciensWithoutAvailability} mecanicien(s) n ont encore aucun creneau configure.`
              : ''}
          </div>
        </Alert>
      )}

      <Row className="g-4">
        {planningByMecanicien.map(({
          mecanicien,
          appointments,
          disponibilites: mecanicienDisponibilites,
          appointmentsOutsideAvailability,
        }) => (
          <Col md={6} xl={4} key={mecanicien.id}>
            <Card className="shadow-sm border-0 h-100">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
                  <div>
                    <Card.Title className="mb-1">
                      {`${mecanicien.first_name || ''} ${mecanicien.last_name || ''}`.trim() || mecanicien.username}
                    </Card.Title>
                    <div className="text-muted small">{mecanicien.email || 'Courriel non renseigne'}</div>
                  </div>
                  <div className="d-flex flex-column align-items-end gap-2">
                    <Badge bg={appointments.length > 0 ? 'success' : 'secondary'}>
                      {appointments.length} RDV
                    </Badge>
                    {appointmentsOutsideAvailability.length > 0 && (
                      <Badge bg="warning" text="dark">
                        {appointmentsOutsideAvailability.length} hors creneau
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="small text-muted mb-3">
                  {mecanicienDisponibilites.length > 0
                    ? mecanicienDisponibilites.map((item) => formatTimeRange(item)).join(' | ')
                    : 'Aucune disponibilite mecanicien definie'}
                </div>

                {appointmentsOutsideAvailability.length > 0 && (
                  <Alert variant="warning" className="py-2 px-3">
                    <div className="small">
                      Certains rendez-vous planifies pour ce mecanicien sont hors de ses creneaux definis.
                    </div>
                  </Alert>
                )}

                {appointments.length > 0 ? (
                  <div className="d-flex flex-column gap-3">
                    {appointments.map((appointment) => (
                      <div key={appointment.id} className="border rounded p-3">
                        <div className="fw-semibold">{formatDateTime(appointment.date)}</div>
                        <div className="small text-muted mb-2">
                          {appointment.client_name || 'Client'} | {appointment.vehicle ? `${appointment.vehicle.marque} ${appointment.vehicle.modele}` : 'Vehicule non precise'}
                        </div>
                        <div className="mb-1"><strong>Service :</strong> {appointment.service_details?.nom || '-'}</div>
                        <div className="mb-1"><strong>Demande :</strong> {appointment.description || 'Sans description'}</div>
                        <div className="small text-muted">
                          Statut : {getRendezVousStatusLabel(appointment.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Alert variant="light" className="mb-0">
                    Aucun rendez-vous affecte sur cette date.
                  </Alert>
                )}
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {mecaniciens.length === 0 && !loading && (
        <Alert variant="secondary" className="mt-4">
          Aucun mecanicien n est encore rattache a ce garage.
        </Alert>
      )}
    </Container>
  );
}

export default PlanningGarage;
