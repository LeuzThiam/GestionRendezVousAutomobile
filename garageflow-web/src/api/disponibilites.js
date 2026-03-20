import { apiClient } from './client';

export async function fetchGarageDisponibilitesRequest() {
  const response = await apiClient.get('/api/garages/me/disponibilites/');
  return response.data;
}

export async function createGarageDisponibiliteRequest(payload) {
  const response = await apiClient.post('/api/garages/me/disponibilites/', payload);
  return response.data;
}

export async function updateGarageDisponibiliteRequest(id, payload) {
  const response = await apiClient.patch(`/api/garages/me/disponibilites/${id}/`, payload);
  return response.data;
}

export async function deleteGarageDisponibiliteRequest(id) {
  await apiClient.delete(`/api/garages/me/disponibilites/${id}/`);
}
