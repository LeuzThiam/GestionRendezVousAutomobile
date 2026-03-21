import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Button, Card, Col, Container, Form, Row, Spinner } from 'react-bootstrap';
import { useLocation } from 'react-router-dom';
import { fetchGarageMecaniciensRequest, fetchMecanicienDisponibilitesRequest } from '../../personnel/api';
import { fetchRendezVousRequest, updateRendezVousRequest } from '../api';
import { EmptyState, ErrorState, PageHeader, SectionCard, StatBadgeGroup } from '../../../shared/ui';
import { getRendezVousStatusLabel, getRendezVousStatusVariant } from '../utils/status';

const durationOptions = ['0.50', '1.00', '1.50', '2.00', '3.00', '4.00'];
const quotePresets = ['49.99', '79.99', '99.99', '149.99', '199.99'];

function flattenError(error) {
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

function formatDateTime(value) {
  if (!value) {
    return '-';
  }

  return new Intl.DateTimeFormat('fr-CA', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function formatTimeRange(item) {
  return `${item.jour_label} ${item.heure_debut} - ${item.heure_fin}`;
}

function getSlotDateTime(date, heure, fallback) {
  if (date && heure) {
    return `${date}T${heure}:00`;
  }
  return fallback || null;
}

function getWeekday(value) {
  const date = new Date(value);
  return date.getDay() === 0 ? 6 : date.getDay() - 1;
}

function getTimeValue(value) {
  return new Date(value).toLocaleTimeString('fr-CA', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function hasAvailabilityForSlot(slot, disponibilites) {
  if (!slot || !disponibilites.length) {
    return false;
  }

  const weekday = getWeekday(slot);
  const timeValue = getTimeValue(slot);

  return disponibilites.some((item) => (
    item.jour_semaine === weekday
    && item.heure_debut <= timeValue
    && item.heure_fin >= timeValue
  ));
}

function getServiceCompatibility(mecanicien, rdv) {
  const specialites = (mecanicien.specialites || '').toLowerCase();
  const serviceName = (rdv.service_details?.nom || '').toLowerCase();
  const description = (rdv.description || '').toLowerCase();

  if (!specialites.trim()) {
    return {
      compatible: true,
      score: 1,
      label: 'Aucune specialite renseignee',
    };
  }

  const matchesService = serviceName && specialites.includes(serviceName);
  const matchesDescription = description && specialites.split(',').some((entry) => {
    const token = entry.trim();
    return token && description.includes(token);
  });

  if (matchesService || matchesDescription) {
    return {
      compatible: true,
      score: 3,
      label: 'Specialite coherente',
    };
  }

  return {
    compatible: false,
    score: 0,
    label: 'Specialite non evidente',
  };
}

function getDecisionHistory(rdv) {
  const history = [];
  if (rdv.confirmed_at) {
    history.push(`Confirme le ${formatDateTime(rdv.confirmed_at)} par ${rdv.confirmed_by_name || 'le garage'}`);
  }
  if (rdv.rejected_at) {
    history.push(`Refuse le ${formatDateTime(rdv.rejected_at)} par ${rdv.rejected_by_name || 'le garage'}`);
  }
  if (rdv.reprogrammed_at) {
    history.push(`Reprogramme le ${formatDateTime(rdv.reprogrammed_at)} par ${rdv.reprogrammed_by_name || 'le garage'}`);
  }
  return history;
}

function getProposalTypeLabel(type) {
  if (type === 'garage_counter') {
    return 'Contre-proposition garage';
  }
  return 'Proposition client';
}

function getProposalStatusVariant(status) {
  if (status === 'accepted') {
    return 'success';
  }
  if (status === 'rejected') {
    return 'danger';
  }
  if (status === 'superseded') {
    return 'secondary';
  }
  return 'warning';
}

function getProposalStatusLabel(status) {
  if (status === 'accepted') {
    return 'Acceptee';
  }
  if (status === 'rejected') {
    return 'Refusee';
  }
  if (status === 'superseded') {
    return 'Remplacee';
  }
  return 'En attente';
}

function matchesSearch(rdv, term) {
  if (!term) {
    return true;
  }
  const haystack = [
    rdv.client_name,
    rdv.client_email,
    rdv.vehicle?.marque,
    rdv.vehicle?.modele,
    rdv.vehicle?.vin,
    rdv.description,
    rdv.service_details?.nom,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return haystack.includes(term.toLowerCase());
}

function GestionRendezVousGarage() {
  const location = useLocation();
  const [rendezVous, setRendezVous] = useState([]);
  const [mecaniciens, setMecaniciens] = useState([]);
  const [mecanicienDisponibilites, setMecanicienDisponibilites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [forms, setForms] = useState({});
  const [filters, setFilters] = useState({
    status: '',
    date: '',
    mecanicien: '',
    service: '',
    search: '',
  });
  const [selectedIds, setSelectedIds] = useState([]);
  const [batchReason, setBatchReason] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [rendezVousData, mecaniciensData, disponibilitesData] = await Promise.all([
        fetchRendezVousRequest(),
        fetchGarageMecaniciensRequest(),
        fetchMecanicienDisponibilitesRequest(),
      ]);
      setRendezVous(rendezVousData);
      setMecaniciens(mecaniciensData);
      setMecanicienDisponibilites(disponibilitesData);
      setForms((current) => {
        const next = { ...current };
        rendezVousData.forEach((item) => {
          const selectedDate = item.requested_date || item.date;
          next[item.id] ??= {
            mecanicien: item.mecanicien || '',
            estimatedTime: item.estimatedTime || '1.00',
            quote: item.quote || '',
            reason: item.reason || '',
            internalNote: '',
            date: selectedDate ? selectedDate.slice(0, 10) : '',
            heure: selectedDate ? selectedDate.slice(11, 16) : '',
          };
        });
        return next;
      });
    } catch (requestError) {
      setError(requestError.response?.data || requestError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!location.hash || loading) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      const target = document.querySelector(location.hash);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });

    return () => window.cancelAnimationFrame(frame);
  }, [location.hash, loading, rendezVous]);

  const disponibilitesByMecanicien = useMemo(() => {
    return mecanicienDisponibilites.reduce((accumulator, item) => {
      accumulator[item.mecanicien] ??= [];
      accumulator[item.mecanicien].push(item);
      return accumulator;
    }, {});
  }, [mecanicienDisponibilites]);

  const serviceOptions = useMemo(() => {
    return Array.from(
      new Map(
        rendezVous
          .filter((item) => item.service_details?.id)
          .map((item) => [item.service_details.id, item.service_details])
      ).values()
    );
  }, [rendezVous]);

  const getMecanicienSuggestions = (rdv) => {
    const currentForm = forms[rdv.id] || {};
    const slot = getSlotDateTime(currentForm.date, currentForm.heure, rdv.requested_date || rdv.date);

    return mecaniciens
      .map((mecanicien) => {
        const mecanicienId = Number(mecanicien.id);
        const disponibilites = disponibilitesByMecanicien[mecanicienId] || [];
        const hasDefinedAvailability = disponibilites.length > 0;
        const available = hasDefinedAvailability ? hasAvailabilityForSlot(slot, disponibilites) : true;
        const conflict = rendezVous.some((item) => (
          item.id !== rdv.id
          && item.status === 'confirmed'
          && Number(item.mecanicien || 0) === mecanicienId
          && getSlotDateTime(null, null, item.date) === slot
        ));
        const compatibility = getServiceCompatibility(mecanicien, rdv);
        const score = [
          mecanicien.is_active ? 100 : -100,
          available ? 40 : -40,
          conflict ? -60 : 15,
          compatibility.score * 12,
          -Number(mecanicien.rdv_today_count || 0) * 4,
          -Number(mecanicien.rdv_upcoming_count || 0),
          hasDefinedAvailability ? 6 : 0,
        ].reduce((total, value) => total + value, 0);

        return {
          mecanicien,
          disponibilites,
          hasDefinedAvailability,
          available,
          conflict,
          compatibility,
          score,
        };
      })
      .sort((left, right) => right.score - left.score);
  };

  const filteredRendezVous = useMemo(() => {
    return rendezVous.filter((item) => {
      if (filters.status && item.status !== filters.status) {
        return false;
      }
      if (filters.date && item.date?.slice(0, 10) !== filters.date) {
        return false;
      }
      if (filters.mecanicien && String(item.mecanicien || '') !== String(filters.mecanicien)) {
        return false;
      }
      if (filters.service && String(item.service || '') !== String(filters.service)) {
        return false;
      }
      if (!matchesSearch(item, filters.search)) {
        return false;
      }
      return true;
    });
  }, [filters, rendezVous]);

  const pendingRendezVous = useMemo(
    () => filteredRendezVous.filter((item) => item.status === 'pending'),
    [filteredRendezVous]
  );
  const modificationRequestedRendezVous = useMemo(
    () => filteredRendezVous.filter((item) => item.status === 'modification_requested'),
    [filteredRendezVous]
  );
  const confirmedRendezVous = useMemo(
    () => filteredRendezVous.filter((item) => item.status === 'confirmed'),
    [filteredRendezVous]
  );
  const closedRendezVous = useMemo(
    () => filteredRendezVous.filter((item) => ['rejected', 'cancelled', 'done'].includes(item.status)),
    [filteredRendezVous]
  );
  const topStats = [
    { label: 'En attente', value: pendingRendezVous.length, bg: 'warning', text: 'dark' },
    { label: 'Reprogrammation', value: modificationRequestedRendezVous.length, bg: 'info' },
    { label: 'Confirmes', value: confirmedRendezVous.length, bg: 'success' },
    { label: 'Historique', value: closedRendezVous.length, bg: 'secondary' },
  ];

  const handleFieldChange = (id, field, value) => {
    setForms((current) => ({
      ...current,
      [id]: {
        ...(current[id] || {}),
        [field]: value,
      },
    }));
  };

  const handleConfirm = async (rdv) => {
    const currentForm = forms[rdv.id] || {};
    const proposedDate =
      currentForm.date && currentForm.heure
        ? `${currentForm.date}T${currentForm.heure}:00`
        : (rdv.requested_date || rdv.date);
    const slotChanged = proposedDate !== (rdv.requested_date || rdv.date);

    try {
      setLoading(true);
      setError(null);
      setMessage(null);
      const updated = await updateRendezVousRequest(rdv.id, {
        status: 'confirmed',
        mecanicien: Number(currentForm.mecanicien),
        estimatedTime: currentForm.estimatedTime,
        quote: currentForm.quote,
        date: proposedDate,
        garage_internal_note: currentForm.internalNote || '',
      });
      setRendezVous((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setSelectedIds((current) => current.filter((id) => id !== rdv.id));
      if (rdv.status === 'modification_requested') {
        setMessage(slotChanged ? 'Rendez-vous reprogramme et confirme.' : 'Nouvelle proposition client acceptee.');
      } else {
        setMessage('Rendez-vous confirme et affecte.');
      }
    } catch (requestError) {
      setError(requestError.response?.data || requestError);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (rdv) => {
    const currentForm = forms[rdv.id] || {};
    const nextStatus = rdv.status === 'modification_requested' ? 'confirmed' : 'rejected';
    try {
      setLoading(true);
      setError(null);
      setMessage(null);
      const updated = await updateRendezVousRequest(rdv.id, {
        status: nextStatus,
        ...(rdv.status === 'modification_requested'
          ? { garage_internal_note: currentForm.internalNote || '' }
          : { reason: currentForm.reason }),
        ...(rdv.status === 'modification_requested' ? { date: rdv.date } : {}),
      });
      setRendezVous((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setSelectedIds((current) => current.filter((id) => id !== rdv.id));
      setMessage(
        rdv.status === 'modification_requested'
          ? 'Demande de reprogrammation refusee. Le creneau actuel est conserve.'
          : 'Demande refusee.'
      );
    } catch (requestError) {
      setError(requestError.response?.data || requestError);
    } finally {
      setLoading(false);
    }
  };

  const handleDone = async (rdv) => {
    try {
      setLoading(true);
      setError(null);
      setMessage(null);
      const updated = await updateRendezVousRequest(rdv.id, { status: 'done' });
      setRendezVous((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setMessage('Rendez-vous marque comme termine.');
    } catch (requestError) {
      setError(requestError.response?.data || requestError);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (id) => {
    setSelectedIds((current) => (
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    ));
  };

  const handleBulkReject = async () => {
    if (!selectedIds.length) {
      setError('Selectionnez au moins une demande a traiter.');
      return;
    }
    if (!batchReason.trim()) {
      setError('Ajoutez une raison commune pour le refus en lot.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setMessage(null);
      const updates = await Promise.all(
        selectedIds.map((id) => updateRendezVousRequest(id, { status: 'rejected', reason: batchReason }))
      );
      const updatesById = new Map(updates.map((item) => [item.id, item]));
      setRendezVous((current) => current.map((item) => updatesById.get(item.id) || item));
      setSelectedIds([]);
      setBatchReason('');
      setMessage(`${updates.length} demande(s) refusee(s) en lot.`);
    } catch (requestError) {
      setError(requestError.response?.data || requestError);
    } finally {
      setLoading(false);
    }
  };

  const renderCard = (rdv, showActions) => {
    const currentForm = forms[rdv.id] || {};
    const selectedMecanicienId = Number(currentForm.mecanicien || rdv.mecanicien || 0);
    const isModificationRequest = rdv.status === 'modification_requested';
    const selectedSlot = getSlotDateTime(currentForm.date, currentForm.heure, rdv.requested_date || rdv.date);
    const slotChanged = selectedSlot !== (rdv.requested_date || rdv.date);
    const confirmLabel = isModificationRequest
      ? slotChanged
        ? 'Reprogrammer et confirmer'
        : 'Accepter la proposition'
      : 'Confirmer';
    const decisionHistory = getDecisionHistory(rdv);
    const rescheduleHistory = rdv.reschedule_history || [];
    const isBatchEligible = rdv.status === 'pending';
    const mecanicienSuggestions = getMecanicienSuggestions(rdv);
    const bestSuggestion = mecanicienSuggestions[0] || null;
    const selectedSuggestion = mecanicienSuggestions.find((item) => item.mecanicien.id === selectedMecanicienId) || null;
    const selectedDisponibilites = selectedSuggestion?.disponibilites || [];
    const confirmBlocked = Boolean(
      !selectedMecanicienId
      || !currentForm.estimatedTime
      || !currentForm.quote
      || !currentForm.date
      || !currentForm.heure
      || (
      selectedSuggestion && (
        !selectedSuggestion.mecanicien.is_active
        || selectedSuggestion.conflict
        || (selectedSuggestion.hasDefinedAvailability && !selectedSuggestion.available)
      )
      )
    );

    return (
      <Col md={6} xl={4} key={rdv.id}>
        <Card className="shadow-sm h-100" id={`rdv-${rdv.id}`}>
          <Card.Body>
            <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
              <div className="d-flex gap-2">
                {isBatchEligible && (
                  <Form.Check
                    type="checkbox"
                    checked={selectedIds.includes(rdv.id)}
                    onChange={() => toggleSelection(rdv.id)}
                  />
                )}
                <div>
                  <Card.Title className="mb-1">{formatDateTime(rdv.date)}</Card.Title>
                  <div className="text-muted small">
                    {isModificationRequest ? 'Creneau actuellement planifie' : getRendezVousStatusLabel(rdv.status)}
                  </div>
                </div>
              </div>
              <Badge bg={getRendezVousStatusVariant(rdv.status)}>
                {getRendezVousStatusLabel(rdv.status)}
              </Badge>
            </div>

            <p className="mb-2"><strong>Client :</strong> {rdv.client_name || rdv.client}</p>
            <p className="mb-2"><strong>Courriel :</strong> {rdv.client_email || '-'}</p>
            <p className="mb-2"><strong>Garage :</strong> {rdv.garage_name || '-'}</p>
            <p className="mb-2"><strong>Service :</strong> {rdv.service_details?.nom || '-'}</p>
            <p className="mb-2"><strong>Vehicule :</strong> {rdv.vehicle ? `${rdv.vehicle.marque} ${rdv.vehicle.modele}` : '-'}</p>
            <p className="mb-3"><strong>Demande :</strong> {rdv.description || 'Sans description'}</p>

            {isModificationRequest && (
              <Alert variant="info" className="mb-3">
                <div className="fw-semibold mb-1">Demande de reprogrammation</div>
                <div className="small">
                  Creneau actuel : <strong>{formatDateTime(rdv.date)}</strong>
                </div>
                <div className="small mt-1">
                  Proposition du client : <strong>{formatDateTime(rdv.requested_date)}</strong>
                </div>
                <div className="small mt-1">
                  Vous pouvez accepter ce creneau tel quel ou en definir un autre avant confirmation.
                </div>
              </Alert>
            )}

            {rdv.has_pending_reschedule && (
              <Alert variant="warning" className="mb-3">
                <div className="fw-semibold mb-1">Reponse attendue</div>
                <div className="small">
                  {rdv.pending_reschedule_origin === 'client_request'
                    ? 'Une proposition du client attend une reponse du garage.'
                    : 'Une contre-proposition garage est encore ouverte dans l historique.'}
                </div>
              </Alert>
            )}

            {rdv.mecanicien && (
              <p className="mb-2"><strong>Mecanicien affecte :</strong> #{rdv.mecanicien}</p>
            )}
            {rdv.estimatedTime && (
              <p className="mb-2"><strong>Duree estimee :</strong> {rdv.estimatedTime} h</p>
            )}
            {rdv.quote && (
              <p className="mb-3"><strong>Devis :</strong> {rdv.quote}</p>
            )}
            {rdv.reason && (
              <p className="mb-3"><strong>Raison :</strong> {rdv.reason}</p>
            )}

            {decisionHistory.length > 0 && (
              <Alert variant="light" className="mb-3">
                <div className="fw-semibold mb-2">Historique de decision</div>
                <div className="small d-flex flex-column gap-1">
                  {decisionHistory.map((item) => (
                    <span key={item}>{item}</span>
                  ))}
                </div>
              </Alert>
            )}

            {rescheduleHistory.length > 0 && (
              <Alert variant="light" className="mb-3">
                <div className="fw-semibold mb-2">Historique des propositions</div>
                <div className="d-flex flex-column gap-2">
                  {rescheduleHistory.map((proposal) => (
                    <div key={proposal.id} className="border rounded p-2 bg-white">
                      <div className="d-flex justify-content-between align-items-center gap-2 mb-1">
                        <strong className="small">{getProposalTypeLabel(proposal.proposal_type)}</strong>
                        <Badge bg={getProposalStatusVariant(proposal.response_status)}>
                          {getProposalStatusLabel(proposal.response_status)}
                        </Badge>
                      </div>
                      <div className="small">
                        <div>Creneau propose : <strong>{formatDateTime(proposal.proposed_date)}</strong></div>
                        <div>Cree le {formatDateTime(proposal.created_at)} par {proposal.created_by_name || 'systeme'}</div>
                        {proposal.responded_at && (
                          <div>
                            Traite le {formatDateTime(proposal.responded_at)} par {proposal.responded_by_name || 'garage'}
                          </div>
                        )}
                        {proposal.internal_note && (
                          <div className="mt-1">
                            <strong>Note interne :</strong> {proposal.internal_note}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Alert>
            )}

            {showActions && (
              <>
                <Form.Group className="mb-3">
                  <Form.Label>Mecanicien</Form.Label>
                  <Form.Select
                    value={currentForm.mecanicien || ''}
                    onChange={(event) => handleFieldChange(rdv.id, 'mecanicien', event.target.value)}
                  >
                    <option value="">Selectionnez un mecanicien</option>
                    {mecanicienSuggestions.map(({ mecanicien, available, conflict, compatibility }) => (
                      <option key={mecanicien.id} value={mecanicien.id}>
                        {`${`${mecanicien.first_name || ''} ${mecanicien.last_name || ''}`.trim() || mecanicien.username} | ${
                          !mecanicien.is_active
                            ? 'inactif'
                            : conflict
                              ? 'conflit'
                              : available
                                ? 'disponible'
                                : 'hors creneau'
                        } | ${compatibility.label} | charge jour ${mecanicien.rdv_today_count || 0}`}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>

                {bestSuggestion && (
                  <Alert variant="light" className="mb-3">
                    <div className="d-flex justify-content-between align-items-start gap-3">
                      <div>
                        <div className="fw-semibold mb-1">Meilleur choix suggere</div>
                        <div className="small">
                          {`${bestSuggestion.mecanicien.first_name || ''} ${bestSuggestion.mecanicien.last_name || ''}`.trim() || bestSuggestion.mecanicien.username}
                        </div>
                        <div className="small text-muted">
                          {bestSuggestion.available ? 'Disponible sur le creneau' : 'Disponibilite a verifier'} · {bestSuggestion.compatibility.label} · charge jour {bestSuggestion.mecanicien.rdv_today_count || 0}
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="outline-dark"
                        size="sm"
                        onClick={() => handleFieldChange(rdv.id, 'mecanicien', String(bestSuggestion.mecanicien.id))}
                      >
                        Utiliser
                      </Button>
                    </div>
                  </Alert>
                )}

                {selectedMecanicienId > 0 && (
                  <Alert
                    variant={
                      selectedSuggestion?.conflict
                        ? 'danger'
                        : selectedSuggestion?.hasDefinedAvailability && !selectedSuggestion.available
                          ? 'warning'
                          : selectedDisponibilites.length > 0
                            ? 'light'
                            : 'warning'
                    }
                    className="mb-3"
                  >
                    <div className="fw-semibold mb-2">Lecture immediate de l affectation</div>
                    {selectedSuggestion && (
                      <div className="small mb-2">
                        {!selectedSuggestion.mecanicien.is_active
                          ? 'Ce mecanicien est inactif.'
                          : selectedSuggestion.conflict
                            ? 'Ce mecanicien a deja un rendez-vous confirme sur ce creneau.'
                            : selectedSuggestion.hasDefinedAvailability && !selectedSuggestion.available
                              ? 'Le creneau choisi est hors de ses disponibilites actives.'
                              : selectedSuggestion.available
                                ? 'Le mecanicien est disponible sur ce creneau.'
                                : 'Aucun creneau defini. Affectation possible, mais faible.'}
                        {' '}Compatibilite : <strong>{selectedSuggestion.compatibility.label}</strong>.
                      </div>
                    )}
                    {selectedDisponibilites.length > 0 ? (
                      <div className="small d-flex flex-column gap-1">
                        {selectedDisponibilites.map((item) => (
                          <span key={item.id}>{formatTimeRange(item)}</span>
                        ))}
                      </div>
                    ) : (
                      <div className="small">
                        Aucun creneau defini. Le systeme autorise encore la confirmation, mais il vaut mieux definir ses disponibilites.
                      </div>
                    )}
                  </Alert>
                )}

                <Row>
                  <Col sm={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>{isModificationRequest ? 'Date retenue' : 'Date planifiee'}</Form.Label>
                      <Form.Control
                        type="date"
                        value={currentForm.date || ''}
                        onChange={(event) => handleFieldChange(rdv.id, 'date', event.target.value)}
                      />
                    </Form.Group>
                  </Col>

                  <Col sm={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>{isModificationRequest ? 'Heure retenue' : 'Heure planifiee'}</Form.Label>
                      <Form.Control
                        type="time"
                        value={currentForm.heure || ''}
                        onChange={(event) => handleFieldChange(rdv.id, 'heure', event.target.value)}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                {isModificationRequest && slotChanged && (
                  <Alert variant="light" className="mb-3">
                    <div className="small">
                      Le creneau actuellement saisi pour confirmation est : <strong>{formatDateTime(selectedSlot)}</strong>
                    </div>
                  </Alert>
                )}

                <Row>
                  <Col sm={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Duree estimee</Form.Label>
                      <Form.Select
                        value={currentForm.estimatedTime || ''}
                        onChange={(event) => handleFieldChange(rdv.id, 'estimatedTime', event.target.value)}
                      >
                        <option value="">Selectionnez une duree</option>
                        {durationOptions.map((option) => (
                          <option key={option} value={option}>{option} h</option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>

                  <Col sm={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Devis</Form.Label>
                      <Form.Control
                        type="number"
                        min="0"
                        step="0.01"
                        value={currentForm.quote || ''}
                        onChange={(event) => handleFieldChange(rdv.id, 'quote', event.target.value)}
                        placeholder="120.00"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <div className="d-flex flex-wrap gap-2 mb-3">
                  {quotePresets.map((preset) => (
                    <Button
                      key={preset}
                      type="button"
                      variant="outline-secondary"
                      size="sm"
                      onClick={() => handleFieldChange(rdv.id, 'quote', preset)}
                    >
                      {preset}
                    </Button>
                  ))}
                </div>

                <Form.Group className="mb-3">
                  <Form.Label>{isModificationRequest ? 'Note interne du garage' : 'Raison du refus'}</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={isModificationRequest ? (currentForm.internalNote || '') : (currentForm.reason || '')}
                    onChange={(event) => handleFieldChange(
                      rdv.id,
                      isModificationRequest ? 'internalNote' : 'reason',
                      event.target.value
                    )}
                    placeholder={
                      isModificationRequest
                        ? 'Visible uniquement en interne pour expliquer la reponse du garage'
                        : 'Precisez la raison si vous refusez la demande'
                    }
                  />
                </Form.Group>

                <div className="d-flex flex-wrap gap-2">
                  <Button variant="success" onClick={() => handleConfirm(rdv)} disabled={loading || confirmBlocked}>
                    {confirmLabel}
                  </Button>
                  <Button variant="outline-danger" onClick={() => handleReject(rdv)} disabled={loading}>
                    {isModificationRequest ? 'Conserver le creneau actuel' : 'Refuser'}
                  </Button>
                </div>
                {confirmBlocked && (
                  <div className="small text-danger mt-2">
                    Finalisez l affectation : mecanicien valide, creneau coherent, duree et devis requis.
                  </div>
                )}
              </>
            )}

            {!showActions && rdv.status === 'confirmed' && (
              <Button variant="outline-dark" onClick={() => handleDone(rdv)} disabled={loading}>
                Marquer termine
              </Button>
            )}
          </Card.Body>
        </Card>
      </Col>
    );
  };

  return (
    <Container className="py-5">
      <PageHeader
        title="Gestion des rendez-vous"
        description="Traitez les demandes clients, filtrez rapidement l atelier et gardez un historique de decision plus clair."
        actions={(
          <>
            <StatBadgeGroup items={topStats} />
            {loading ? <Spinner animation="border" size="sm" /> : null}
          </>
        )}
      />

      {message && <Alert variant="success">{message}</Alert>}
      <ErrorState>{flattenError(error)}</ErrorState>

      <SectionCard className="shadow-sm border-0 mb-4">
          <Row className="g-3">
            <Col md={4}>
              <Form.Group>
                <Form.Label>Recherche client / vehicule</Form.Label>
                <Form.Control
                  value={filters.search}
                  onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
                  placeholder="Client, courriel, vehicule, VIN..."
                />
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group>
                <Form.Label>Statut</Form.Label>
                <Form.Select
                  value={filters.status}
                  onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
                >
                  <option value="">Tous</option>
                  <option value="pending">En attente</option>
                  <option value="modification_requested">Reprogrammation</option>
                  <option value="confirmed">Confirmes</option>
                  <option value="rejected">Refuses</option>
                  <option value="cancelled">Annules</option>
                  <option value="done">Termines</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group>
                <Form.Label>Date</Form.Label>
                <Form.Control
                  type="date"
                  value={filters.date}
                  onChange={(event) => setFilters((current) => ({ ...current, date: event.target.value }))}
                />
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group>
                <Form.Label>Mecanicien</Form.Label>
                <Form.Select
                  value={filters.mecanicien}
                  onChange={(event) => setFilters((current) => ({ ...current, mecanicien: event.target.value }))}
                >
                  <option value="">Tous</option>
                  {mecaniciens.map((mecanicien) => (
                    <option key={mecanicien.id} value={mecanicien.id}>
                      {`${mecanicien.first_name || ''} ${mecanicien.last_name || ''}`.trim() || mecanicien.username}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group>
                <Form.Label>Service</Form.Label>
                <Form.Select
                  value={filters.service}
                  onChange={(event) => setFilters((current) => ({ ...current, service: event.target.value }))}
                >
                  <option value="">Tous</option>
                  {serviceOptions.map((service) => (
                    <option key={service.id} value={service.id}>{service.nom}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
      </SectionCard>

      {selectedIds.length > 0 && (
        <SectionCard className="shadow-sm border-0 mb-4">
            <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-end gap-3">
              <div>
                <div className="fw-semibold">{selectedIds.length} demande(s) selectionnee(s)</div>
                <div className="small text-muted">
                  Action rapide en lot pour les demandes simples : refus avec une raison commune.
                </div>
              </div>
              <div className="d-flex gap-2 align-items-end flex-wrap">
                <Form.Group>
                  <Form.Label>Raison commune</Form.Label>
                  <Form.Control
                    value={batchReason}
                    onChange={(event) => setBatchReason(event.target.value)}
                    placeholder="Atelier complet, dossier incomplet..."
                  />
                </Form.Group>
                <Button variant="outline-danger" onClick={handleBulkReject} disabled={loading}>
                  Refuser la selection
                </Button>
              </div>
            </div>
        </SectionCard>
      )}

      <SectionCard
        className="mb-5 shadow-sm border-0"
        title="Demandes a traiter"
        actions={<Badge bg="warning" text="dark">{pendingRendezVous.length}</Badge>}
      >
        <Row className="g-4">
          {pendingRendezVous.map((rdv) => renderCard(rdv, true))}
        </Row>
        {pendingRendezVous.length === 0 && (
          <EmptyState>Aucune demande en attente pour le moment.</EmptyState>
        )}
      </SectionCard>

      <SectionCard
        className="mb-5 shadow-sm border-0"
        title="Demandes de reprogrammation"
        actions={<Badge bg="info">{modificationRequestedRendezVous.length}</Badge>}
      >
        <Row className="g-4">
          {modificationRequestedRendezVous.map((rdv) => renderCard(rdv, true))}
        </Row>
        {modificationRequestedRendezVous.length === 0 && (
          <EmptyState>Aucune demande de reprogrammation pour le moment.</EmptyState>
        )}
      </SectionCard>

      <SectionCard
        className="mb-5 shadow-sm border-0"
        title="Rendez-vous confirmes"
        actions={<Badge bg="success">{confirmedRendezVous.length}</Badge>}
      >
        <Row className="g-4">
          {confirmedRendezVous.map((rdv) => renderCard(rdv, false))}
        </Row>
        {confirmedRendezVous.length === 0 && (
          <EmptyState>Aucun rendez-vous confirme.</EmptyState>
        )}
      </SectionCard>

      <SectionCard
        className="shadow-sm border-0"
        title="Historique recent"
        actions={<Badge bg="secondary">{closedRendezVous.length}</Badge>}
      >
        <Row className="g-4">
          {closedRendezVous.map((rdv) => renderCard(rdv, false))}
        </Row>
        {closedRendezVous.length === 0 && (
          <EmptyState>Aucun rendez-vous clos pour le moment.</EmptyState>
        )}
      </SectionCard>
    </Container>
  );
}

export default GestionRendezVousGarage;
