import React from 'react';
import { Alert } from 'react-bootstrap';

export default function EmptyState({ children, className = 'mb-0', variant = 'light' }) {
  return (
    <Alert variant={variant} className={`app-feedback app-feedback-empty ${className}`.trim()}>
      {children}
    </Alert>
  );
}
