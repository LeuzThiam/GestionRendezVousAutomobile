import { apiClient } from './client';

export async function fetchVehiculesRequest() {
  const response = await apiClient.get('/api/vehicules/');
  return response.data;
}

export async function createVehiculeRequest(payload) {
  const response = await apiClient.post('/api/vehicules/', payload);
  return response.data;
}

export async function updateVehiculeRequest(id, payload) {
  const response = await apiClient.put(`/api/vehicules/${id}/`, payload);
  return response.data;
}

export async function deleteVehiculeRequest(id) {
  await apiClient.delete(`/api/vehicules/${id}/`);
}
