import React from 'react';
import { Card } from 'react-bootstrap';

export default function SectionCard({ title, subtitle, actions, children, className = 'shadow-sm border-0', bodyClassName }) {
  return (
    <Card className={`app-section-card ${className}`.trim()}>
      <Card.Body className={`app-section-card-body ${bodyClassName || ''}`.trim()}>
        {(title || subtitle || actions) ? (
          <div
            className="app-section-card-head d-flex flex-column flex-md-row justify-content-between align-items-md-start gap-2 mb-4"
            style={{ position: 'relative', zIndex: 1 }}
          >
            <div className="flex-grow-1 pe-md-3" style={{ minWidth: 0 }}>
              {title ? (
                <h3
                  className="app-section-card-title h5 mb-0"
                  style={{
                    whiteSpace: 'normal',
                    overflowWrap: 'anywhere',
                    lineHeight: 1.35,
                  }}
                >
                  {title}
                </h3>
              ) : null}
              {subtitle ? <span className="text-muted small d-inline-block mt-1">{subtitle}</span> : null}
            </div>
            {actions ? (
              <div
                className="app-section-card-actions d-flex flex-wrap gap-2 align-self-start"
                style={{ flexShrink: 0, position: 'relative', zIndex: 1 }}
              >
                {actions}
              </div>
            ) : null}
          </div>
        ) : null}
        {children}
      </Card.Body>
    </Card>
  );
}
