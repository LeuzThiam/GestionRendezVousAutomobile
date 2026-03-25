export const RENDEZ_VOUS_STATUS_LABELS = {
  pending: 'En attente',
  confirmed: 'Confirme',
  modification_requested: 'Reprogrammation demandee',
  cancelled: 'Annule',
  rejected: 'Refuse',
  refused: 'Refuse',
  done: 'Termine',
};

export const RENDEZ_VOUS_STATUS_VARIANTS = {
  pending: 'warning',
  confirmed: 'success',
  modification_requested: 'info',
  cancelled: 'secondary',
  rejected: 'danger',
  refused: 'danger',
  done: 'dark',
};

export function getRendezVousStatusLabel(status) {
  return RENDEZ_VOUS_STATUS_LABELS[status] || status;
}

export function getRendezVousStatusVariant(status) {
  return RENDEZ_VOUS_STATUS_VARIANTS[status] || 'secondary';
}
