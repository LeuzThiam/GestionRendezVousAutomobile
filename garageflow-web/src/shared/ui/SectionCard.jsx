import React from 'react';
import { Card } from 'react-bootstrap';

export default function SectionCard({ title, subtitle, actions, children, className = 'shadow-sm border-0', bodyClassName }) {
  return (
    <Card className={className}>
      <Card.Body className={bodyClassName}>
        {(title || subtitle || actions) ? (
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              {title ? <h3 className="h5 mb-0">{title}</h3> : null}
              {subtitle ? <span className="text-muted small">{subtitle}</span> : null}
            </div>
            {actions ? <div className="d-flex flex-wrap gap-2">{actions}</div> : null}
          </div>
        ) : null}
        {children}
      </Card.Body>
    </Card>
  );
}
