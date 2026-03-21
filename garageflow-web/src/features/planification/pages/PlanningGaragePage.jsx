import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Button, Card, Col, Container, Form, Row } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { fetchGarageMecaniciensRequest, fetchMecanicienDisponibilitesRequest } from '../../personnel/api';
import { fetchRendezVousRequest } from '../../rendezvous/api';
import { EmptyState, ErrorState, LoadingState } from '../../../shared/ui';

const HOUR_SLOTS = Array.from({ length: 13 }, (_, index) => 7 + index);

function formatDateTime(value) {
  if (!value) {
    return '-';
  }

  return new Intl.DateTimeFormat('fr-CA', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function formatShortDate(value) {
  return new Intl.DateTimeFormat('fr-CA', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(new Date(value));
}

function getDateKey(value) {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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

function getHourSlotKey(hour) {
  return `${String(hour).padStart(2, '0')}:00`;
}

function formatHourLabel(hour) {
  return `${String(hour).padStart(2, '0')}h00`;
}

function getWeekStart(dateValue) {
  const date = new Date(`${dateValue}T12:00:00`);
  const weekday = date.getDay();
  const offset = weekday === 0 ? -6 : 1 - weekday;
  date.setDate(date.getDate() + offset);
  return date;
}

function getWeekDates(dateValue) {
  const start = getWeekStart(dateValue);
  return Array.from({ length: 7 }, (_, index) => {
    const next = new Date(start);
    next.setDate(start.getDate() + index);
    return next.toISOString().slice(0, 10);
  });
}

function formatTimeRange(item) {
  return `${item.jour_label} ${item.heure_debut} - ${item.heure_fin}`;
}

function isWithinAvailability(dateKey, hour, mecanicienDisponibilites) {
  if (!mecanicienDisponibilites.length) {
    return false;
  }

  const day = new Date(`${dateKey}T12:00:00`);
  const weekday = day.getDay() === 0 ? 6 : day.getDay() - 1;
  const slotStart = getHourSlotKey(hour);
  const slotEnd = `${String(hour + 1).padStart(2, '0')}:00`;

  return mecanicienDisponibilites.some((item) => (
    item.jour_semaine === weekday
    && item.heure_debut < slotEnd
    && item.heure_fin > slotStart
  ));
}

function getAppointmentHour(value) {
  return Number(getTimeKey(value).slice(0, 2));
}

function PlanningGarage() {
  const [rendezVous, setRendezVous] = useState([]);
  const [mecaniciens, setMecaniciens] = useState([]);
  const [disponibilites, setDisponibilites] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [viewMode, setViewMode] = useState('day');
  const [selectedMecanicien, setSelectedMecanicien] = useState('');
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

  const disponibilitesByMecanicien = useMemo(() => {
    return disponibilites.reduce((accumulator, item) => {
      accumulator[item.mecanicien] ??= [];
      accumulator[item.mecanicien].push(item);
      return accumulator;
    }, {});
  }, [disponibilites]);

  const weekDates = useMemo(() => getWeekDates(selectedDate), [selectedDate]);

  const visibleMecaniciens = useMemo(() => {
    if (!selectedMecanicien) {
      return mecaniciens;
    }
    return mecaniciens.filter((item) => String(item.id) === String(selectedMecanicien));
  }, [mecaniciens, selectedMecanicien]);

  const filteredAppointments = useMemo(() => {
    return confirmedAppointments.filter((item) => {
      if (selectedMecanicien && String(item.mecanicien || '') !== String(selectedMecanicien)) {
        return false;
      }

      const dateKey = getDateKey(item.date);
      if (viewMode === 'day') {
        return dateKey === selectedDate;
      }
      return weekDates.includes(dateKey);
    });
  }, [confirmedAppointments, selectedDate, selectedMecanicien, viewMode, weekDates]);

  const dayColumns = useMemo(() => {
    return visibleMecaniciens.map((mecanicien) => ({
      id: `mecanicien-${mecanicien.id}`,
      label: `${`${mecanicien.first_name || ''} ${mecanicien.last_name || ''}`.trim() || mecanicien.username}`,
      subLabel: mecanicien.specialites || mecanicien.email || 'Mecanicien',
      mecanicien,
      dateKey: selectedDate,
    }));
  }, [selectedDate, visibleMecaniciens]);

  const weekColumns = useMemo(() => {
    return weekDates.map((dateKey) => ({
      id: `date-${dateKey}`,
      label: formatShortDate(dateKey),
      subLabel: selectedMecanicien
        ? (visibleMecaniciens[0]
          ? `${`${visibleMecaniciens[0].first_name || ''} ${visibleMecaniciens[0].last_name || ''}`.trim() || visibleMecaniciens[0].username}`
          : 'Mecanicien')
        : 'Equipe',
      mecanicien: visibleMecaniciens[0] || null,
      dateKey,
    }));
  }, [selectedMecanicien, visibleMecaniciens, weekDates]);

  const columns = viewMode === 'day' ? dayColumns : weekColumns;

  const getCellAppointments = (column, hour) => {
    return filteredAppointments.filter((appointment) => {
      const appointmentHour = getAppointmentHour(appointment.date);
      const appointmentDateKey = getDateKey(appointment.date);

      if (appointmentDateKey !== column.dateKey || appointmentHour !== hour) {
        return false;
      }

      if (viewMode === 'day') {
        return Number(appointment.mecanicien) === column.mecanicien.id;
      }

      if (selectedMecanicien) {
        return Number(appointment.mecanicien) === column.mecanicien?.id;
      }

      return true;
    });
  };

  const getCellAvailability = (column, hour) => {
    if (viewMode === 'day') {
      const mecanicienDisponibilites = disponibilitesByMecanicien[column.mecanicien.id] || [];
      return isWithinAvailability(column.dateKey, hour, mecanicienDisponibilites);
    }

    if (selectedMecanicien && column.mecanicien) {
      const mecanicienDisponibilites = disponibilitesByMecanicien[column.mecanicien.id] || [];
      return isWithinAvailability(column.dateKey, hour, mecanicienDisponibilites);
    }

    return false;
  };

  const conflicts = useMemo(() => {
    return filteredAppointments.filter((appointment) => {
      const hour = getAppointmentHour(appointment.date);
      const sameSlotCount = filteredAppointments.filter((candidate) => (
        getDateKey(candidate.date) === getDateKey(appointment.date)
        && getAppointmentHour(candidate.date) === hour
        && Number(candidate.mecanicien || 0) === Number(appointment.mecanicien || 0)
      )).length;

      if (sameSlotCount > 1) {
        return true;
      }

      if (!appointment.mecanicien) {
        return false;
      }

      const mecanicienDisponibilites = disponibilitesByMecanicien[appointment.mecanicien] || [];
      return mecanicienDisponibilites.length > 0
        && !isWithinAvailability(getDateKey(appointment.date), hour, mecanicienDisponibilites);
    });
  }, [disponibilitesByMecanicien, filteredAppointments]);

  const unassignedAppointments = useMemo(() => {
    return filteredAppointments.filter((item) => !item.mecanicien);
  }, [filteredAppointments]);

  const emptyAvailableSlots = useMemo(() => {
    let total = 0;
    columns.forEach((column) => {
      HOUR_SLOTS.forEach((hour) => {
        if (getCellAvailability(column, hour) && getCellAppointments(column, hour).length === 0) {
          total += 1;
        }
      });
    });
    return total;
  }, [columns, filteredAppointments]);

  const occupancy = useMemo(() => {
    const totalCells = columns.length * HOUR_SLOTS.length;
    if (!totalCells) {
      return 0;
    }
    const occupied = columns.reduce((total, column) => {
      return total + HOUR_SLOTS.filter((hour) => getCellAppointments(column, hour).length > 0).length;
    }, 0);
    return Math.round((occupied / totalCells) * 100);
  }, [columns, filteredAppointments]);

  const mecaniciensWithoutAvailability = useMemo(() => {
    return visibleMecaniciens.filter((item) => (disponibilitesByMecanicien[item.id] || []).length === 0).length;
  }, [disponibilitesByMecanicien, visibleMecaniciens]);

  const summaryLabel = viewMode === 'day'
    ? `Journee du ${formatShortDate(selectedDate)}`
    : `Semaine du ${formatShortDate(weekDates[0])} au ${formatShortDate(weekDates[6])}`;

  return (
    <Container className="py-5">
      <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-end gap-3 mb-4">
        <div>
          <h1 className="mb-2">Planning du garage</h1>
          <p className="text-muted mb-0">
            Vue horaire du garage pour reperer la charge, les conflits et les trous de planning.
          </p>
        </div>
        <div className="d-flex flex-wrap gap-2">
          <Badge bg="dark">Confirmes: {filteredAppointments.length}</Badge>
          <Badge bg="secondary">Colonnes: {columns.length}</Badge>
          <Badge bg="info">Occupation: {occupancy}%</Badge>
          <Badge bg="warning" text="dark">Conflits: {conflicts.length}</Badge>
          <Badge bg="success">Trous visibles: {emptyAvailableSlots}</Badge>
        </div>
      </div>

      {loading && <LoadingState label="Chargement du planning..." />}
      <ErrorState>{error}</ErrorState>

      <Card className="shadow-sm border-0 mb-4">
        <Card.Body>
          <Row className="g-3 align-items-end">
            <Col md={3}>
              <Form.Group>
                <Form.Label>Vue</Form.Label>
                <Form.Select value={viewMode} onChange={(event) => setViewMode(event.target.value)}>
                  <option value="day">Jour</option>
                  <option value="week">Semaine</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Date de reference</Form.Label>
                <Form.Control
                  type="date"
                  value={selectedDate}
                  onChange={(event) => setSelectedDate(event.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Mecanicien</Form.Label>
                <Form.Select
                  value={selectedMecanicien}
                  onChange={(event) => setSelectedMecanicien(event.target.value)}
                >
                  <option value="">Toute l equipe</option>
                  {mecaniciens.map((mecanicien) => (
                    <option key={mecanicien.id} value={mecanicien.id}>
                      {`${mecanicien.first_name || ''} ${mecanicien.last_name || ''}`.trim() || mecanicien.username}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <div className="small text-muted mb-1">Lecture courante</div>
              <div className="fw-semibold">{summaryLabel}</div>
              <div className="small text-muted">
                {viewMode === 'week' && !selectedMecanicien
                  ? 'Selectionnez un mecanicien pour visualiser ses trous de charge plus finement.'
                  : 'Les cases vertes indiquent des creneaux disponibles sans rendez-vous.'}
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {unassignedAppointments.length > 0 && (
        <Alert variant="warning">
          {unassignedAppointments.length} rendez-vous confirme(s) n ont pas encore de mecanicien affecte sur la periode affichée.
        </Alert>
      )}

      {(conflicts.length > 0 || mecaniciensWithoutAvailability > 0) && (
        <Alert variant="warning">
          <div className="fw-semibold mb-1">Points de vigilance planning</div>
          <div className="small">
            {conflicts.length > 0
              ? `${conflicts.length} rendez-vous presentent un conflit de creneau ou tombent hors disponibilites. `
              : ''}
            {mecaniciensWithoutAvailability > 0
              ? `${mecaniciensWithoutAvailability} mecanicien(s) visibles n ont aucun creneau configure.`
              : ''}
          </div>
        </Alert>
      )}

      <Card className="shadow-sm border-0">
        <Card.Body className="p-0">
          {columns.length === 0 ? (
            <EmptyState className="m-4">
              Aucun mecanicien disponible pour afficher le planning.
            </EmptyState>
          ) : (
            <div className="overflow-auto">
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: `120px repeat(${columns.length}, minmax(220px, 1fr))`,
                  minWidth: `${120 + (columns.length * 220)}px`,
                }}
              >
                <div className="border-bottom border-end p-3 bg-light fw-semibold">Heure</div>
                {columns.map((column) => (
                  <div key={column.id} className="border-bottom border-end p-3 bg-light">
                    <div className="fw-semibold">{column.label}</div>
                    <div className="small text-muted">{column.subLabel}</div>
                  </div>
                ))}

                {HOUR_SLOTS.map((hour) => (
                  <React.Fragment key={hour}>
                    <div className="border-end border-bottom p-3 bg-light-subtle">
                      <div className="fw-semibold">{formatHourLabel(hour)}</div>
                    </div>
                    {columns.map((column) => {
                      const appointments = getCellAppointments(column, hour);
                      const isAvailable = getCellAvailability(column, hour);
                      const hasConflict = appointments.length > 1 || appointments.some((appointment) => conflicts.some((item) => item.id === appointment.id));

                      let background = '#ffffff';
                      if (hasConflict) {
                        background = '#fff1f0';
                      } else if (appointments.length > 0) {
                        background = '#eef6ff';
                      } else if (isAvailable) {
                        background = '#f1f8f3';
                      }

                      return (
                        <div
                          key={`${column.id}-${hour}`}
                          className="border-end border-bottom p-2"
                          style={{ backgroundColor: background, minHeight: '124px' }}
                        >
                          {appointments.length > 0 ? (
                            <div className="d-flex flex-column gap-2">
                              {appointments.map((appointment) => (
                                <div key={appointment.id} className="border rounded p-2 bg-white shadow-sm">
                                  <div className="d-flex justify-content-between align-items-start gap-2 mb-1">
                                    <strong className="small">{getTimeKey(appointment.date)}</strong>
                                    {hasConflict && (
                                      <Badge bg="danger">Conflit</Badge>
                                    )}
                                  </div>
                                  <div className="small fw-semibold">
                                    {appointment.client_name || 'Client'} · {appointment.service_details?.nom || 'Service'}
                                  </div>
                                  <div className="small text-muted">
                                    {appointment.vehicle
                                      ? `${appointment.vehicle.marque} ${appointment.vehicle.modele}`
                                      : 'Vehicule non precise'}
                                  </div>
                                  <div className="small mt-1">
                                    Duree : <strong>{appointment.estimatedTime ? `${appointment.estimatedTime} h` : 'Non renseignee'}</strong>
                                  </div>
                                  <div className="d-flex justify-content-between align-items-center gap-2 mt-2">
                                    <span className="small text-muted">RDV #{appointment.id}</span>
                                    <Button
                                      as={Link}
                                      to={`/garage/rendez-vous#rdv-${appointment.id}`}
                                      variant="outline-dark"
                                      size="sm"
                                    >
                                      Ouvrir
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : isAvailable ? (
                            <div className="h-100 d-flex flex-column justify-content-center align-items-start">
                              <Badge bg="success" className="mb-2">Disponible</Badge>
                              <div className="small text-muted">
                                Creneau libre a exploiter pour absorber une nouvelle demande.
                              </div>
                            </div>
                          ) : (
                            <div className="small text-muted h-100 d-flex align-items-center">
                              Aucun creneau exploitable sur cette case.
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}
        </Card.Body>
      </Card>

      {selectedMecanicien && (
        <Card className="shadow-sm border-0 mt-4">
          <Card.Body>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h2 className="h5 mb-0">Disponibilites du mecanicien filtre</h2>
              <Badge bg="secondary">
                {(disponibilitesByMecanicien[Number(selectedMecanicien)] || []).length} creneau(x)
              </Badge>
            </div>
            {(disponibilitesByMecanicien[Number(selectedMecanicien)] || []).length > 0 ? (
              <div className="small text-muted d-flex flex-wrap gap-2">
                {(disponibilitesByMecanicien[Number(selectedMecanicien)] || []).map((item) => (
                  <span key={item.id} className="border rounded px-2 py-1 bg-light">
                    {formatTimeRange(item)}
                  </span>
                ))}
              </div>
            ) : (
              <EmptyState>
                Ce mecanicien n a encore aucune disponibilite definie.
              </EmptyState>
            )}
          </Card.Body>
        </Card>
      )}
    </Container>
  );
}

export default PlanningGarage;
