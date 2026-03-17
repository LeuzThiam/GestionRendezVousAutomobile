import { apiClient } from './http';

export async function fetchRendezVousRequest() {
  const response = await apiClient.get('/api/rendezvous/');
  return response.data;
}

export async function createRendezVousRequest(payload) {
  const response = await apiClient.post('/api/rendezvous/', payload);
  return response.data;
}

export async function updateRendezVousRequest(id, payload) {
  const response = await apiClient.patch(`/api/rendezvous/${id}/`, payload);
  return response.data;
}
