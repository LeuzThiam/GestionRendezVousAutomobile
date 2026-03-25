import React from 'react';
import { Badge, Button, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';

export default function OrganizationPublicCard({ organization }) {
  return (
    <Card className="organization-public-card border-0 h-100">
      <Card.Body className="d-flex flex-column">
        <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
          <div>
            <div className="organization-public-card-eyebrow">Établissement disponible</div>
            <Card.Title className="mb-1">{organization.name}</Card.Title>
            <Card.Text className="text-muted small mb-0">{organization.slug}</Card.Text>
          </div>
          <Badge bg="light" text="dark">
            {(() => {
              const n = organization.employes_count ?? organization.mecaniciens_count ?? 0;
              return n === 1 ? '1 employé' : `${n} employés`;
            })()}
          </Badge>
        </div>

        <div className="organization-public-card-meta">
          <div>
            <span>Adresse</span>
            <strong>{organization.address || 'À renseigner'}</strong>
          </div>
          <div>
            <span>Téléphone</span>
            <strong>{organization.phone || 'À renseigner'}</strong>
          </div>
        </div>

        <div className="organization-public-card-copy">
          {organization.description || 'Description non renseignée.'}
        </div>

        <div className="mb-3">
          <div className="small text-muted mb-2">Services</div>
          <div className="d-flex flex-wrap gap-2">
            {organization.services?.length ? (
              organization.services.map((service) => (
                <Badge bg="secondary" key={`${organization.id}-${service}`}>
                  {service}
                </Badge>
              ))
            ) : (
              <span className="text-muted small">Aucun service affiché</span>
            )}
          </div>
        </div>

        <div className="organization-public-card-footer mb-3">
          <span>Disponibilités visibles</span>
          <strong>{organization.disponibilites_count || 0}</strong>
        </div>

        <Card.Text className="text-muted mt-auto">
          Envoyez votre demande directement depuis la fiche publique de l&apos;établissement.
        </Card.Text>
        <Button as={Link} to={`/pro/${organization.slug}/reservation`} variant="dark">
          Voir la fiche
        </Button>
      </Card.Body>
    </Card>
  );
}
