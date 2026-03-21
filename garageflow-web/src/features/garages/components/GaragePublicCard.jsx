import React from 'react';
import { Badge, Button, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';

export default function GaragePublicCard({ garage }) {
  return (
    <Card className="shadow-sm border-0 h-100">
      <Card.Body className="d-flex flex-column">
        <div className="d-flex justify-content-between align-items-start gap-3 mb-2">
          <Card.Title className="mb-0">{garage.name}</Card.Title>
          <Badge bg="light" text="dark">{garage.mecaniciens_count || 0} mec.</Badge>
        </div>
        <Card.Text className="text-muted small mb-2">{garage.slug}</Card.Text>
        <Card.Text className="mb-2">
          <strong>Adresse :</strong> {garage.address || 'A renseigner'}
        </Card.Text>
        <Card.Text className="mb-3">
          <strong>Telephone :</strong> {garage.phone || 'A renseigner'}
        </Card.Text>
        <Card.Text className="text-muted small mb-3">
          {garage.description || 'Description du garage non renseignee.'}
        </Card.Text>

        <div className="mb-3">
          <div className="small text-muted mb-2">Services</div>
          <div className="d-flex flex-wrap gap-2">
            {garage.services?.length ? (
              garage.services.map((service) => (
                <Badge bg="secondary" key={`${garage.id}-${service}`}>
                  {service}
                </Badge>
              ))
            ) : (
              <span className="text-muted small">Aucun service affiche</span>
            )}
          </div>
        </div>

        <div className="small text-muted mb-3">
          Disponibilites affichees : {garage.disponibilites_count || 0}
        </div>

        <Card.Text className="text-muted mt-auto">
          Envoyez votre demande directement au garage depuis sa fiche publique.
        </Card.Text>
        <Button as={Link} to={`/garage/${garage.slug}/reservation`} variant="dark">
          Voir la fiche du garage
        </Button>
      </Card.Body>
    </Card>
  );
}
