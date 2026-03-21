import React from 'react';

export default function PageHeader({ title, description, actions, className = 'mb-4' }) {
  return (
    <div className={`d-flex flex-column flex-lg-row justify-content-between align-items-lg-end gap-3 ${className}`}>
      <div>
        <h2 className="mb-2">{title}</h2>
        {description ? <p className="text-muted mb-0">{description}</p> : null}
      </div>
      {actions ? <div className="d-flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
