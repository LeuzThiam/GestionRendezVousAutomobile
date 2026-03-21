import React from 'react';
import { Alert } from 'react-bootstrap';

export default function ErrorState({ children, className, variant = 'danger' }) {
  if (!children) {
    return null;
  }

  return (
    <Alert variant={variant} className={className}>
      {children}
    </Alert>
  );
}
