import { apiClient } from './client';

export async function fetchGarageServicesRequest() {
  const response = await apiClient.get('/api/garages/me/services/');
  return response.data;
}

export async function createGarageServiceRequest(payload) {
  const response = await apiClient.post('/api/garages/me/services/', payload);
  return response.data;
}

export async function updateGarageServiceRequest(id, payload) {
  const response = await apiClient.patch(`/api/garages/me/services/${id}/`, payload);
  return response.data;
}

export async function deleteGarageServiceRequest(id) {
  await apiClient.delete(`/api/garages/me/services/${id}/`);
}
