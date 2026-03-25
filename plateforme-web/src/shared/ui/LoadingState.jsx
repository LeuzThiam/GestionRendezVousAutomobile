import React from 'react';
import { Spinner } from 'react-bootstrap';

export default function LoadingState({
  className = 'd-flex align-items-center gap-2 mb-4',
  label = 'Chargement...',
  size = 'sm',
}) {
  return (
    <div className={`app-feedback app-feedback-loading ${className}`.trim()}>
      <Spinner animation="border" size={size} />
      <span>{label}</span>
    </div>
  );
}
