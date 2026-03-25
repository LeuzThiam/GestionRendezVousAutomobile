import React from 'react';
import { Alert, Badge, Button, Card, Col, Row } from 'react-bootstrap';
import { Link } from 'react-router-dom';

export default function ClientRendezVousCard({
  rdv,
  formatCurrency,
  formatDateTime,
  getTimeRemainingLabel,
  getRendezVousStatusLabel,
  getRendezVousStatusVariant,
  onCancel,
  onRequestModification,
}) {
  const statusLabel = getRendezVousStatusLabel(rdv.status);
  const remainingLabel = rdv.status === 'confirmed' ? getTimeRemainingLabel(rdv.date) : null;
  const canEdit = ['pending', 'confirmed'].includes(rdv.status);
  const canCancel = ['pending', 'confirmed', 'modification_requested'].includes(rdv.status);

  return (
    <Card className="shadow-sm border-0 h-100">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
          <div>
            <Card.Title className="mb-1">{rdv.organization_name || 'Etablissement'}</Card.Title>
            <div className="text-muted small">{formatDateTime(rdv.date)}</div>
          </div>
          <Badge bg={getRendezVousStatusVariant(rdv.status)}>{statusLabel}</Badge>
        </div>

        {remainingLabel && (
          <Alert variant="light" className="py-2 px-3 mb-3">
            <strong>Prochain rendez-vous :</strong> {remainingLabel}
          </Alert>
        )}

        {rdv.status === 'modification_requested' && rdv.requested_date && (
          <Alert variant="info" className="py-2 px-3 mb-3">
            <div><strong>Creneau actuel :</strong> {formatDateTime(rdv.date)}</div>
            <div><strong>Nouveau creneau demande :</strong> {formatDateTime(rdv.requested_date)}</div>
          </Alert>
        )}

        <Row className="g-3">
          <Col md={6}>
            <div className="small text-muted">Service</div>
            <div>{rdv.service_details?.nom || 'Non precise'}</div>
          </Col>
          <Col md={6}>
            <div className="small text-muted">Devis</div>
            <div>{formatCurrency(rdv.quote)}</div>
          </Col>
          <Col md={12}>
            <div className="small text-muted">Duree estimee</div>
            <div>{rdv.estimatedTime ? `${rdv.estimatedTime} h` : '-'}</div>
          </Col>
        </Row>

        <div className="mt-3">
          <div className="small text-muted">Description</div>
          <div>{rdv.description || 'Aucune description fournie.'}</div>
        </div>

        {rdv.reason && (
          <div className="mt-3">
            <div className="small text-muted">Motif</div>
            <div>{rdv.reason}</div>
          </div>
        )}

        <div className="d-flex flex-wrap gap-2 mt-4">
          {rdv.organization_slug && (
            <Button as={Link} to={`/pro/${rdv.organization_slug}/reservation`} variant="outline-dark">
              Voir la fiche publique
            </Button>
          )}
          {canEdit && (
            <Button variant="primary" onClick={() => onRequestModification(rdv)}>
              Demander une reprogrammation
            </Button>
          )}
          {canCancel && (
            <Button variant="outline-danger" onClick={() => onCancel(rdv)}>
              Annuler
            </Button>
          )}
        </div>
      </Card.Body>
    </Card>
  );
}
