import React from 'react';

export default function PageHeader({ title, description, actions, className = 'mb-4' }) {
  return (
    <div className={`app-page-header d-flex flex-column flex-lg-row justify-content-between align-items-lg-end gap-3 ${className}`}>
      <div className="app-page-header-copy">
        <h2 className="mb-2">{title}</h2>
        {description ? <p className="mb-0">{description}</p> : null}
      </div>
      {actions ? <div className="app-page-header-actions d-flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
