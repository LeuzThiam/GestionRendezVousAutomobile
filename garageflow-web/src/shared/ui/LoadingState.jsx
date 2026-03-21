import React from 'react';
import { Spinner } from 'react-bootstrap';

export default function LoadingState({
  className = 'd-flex align-items-center gap-2 mb-4',
  label = 'Chargement...',
  size = 'sm',
}) {
  return (
    <div className={className}>
      <Spinner animation="border" size={size} />
      <span>{label}</span>
    </div>
  );
}
