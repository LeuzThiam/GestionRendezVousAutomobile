import { apiClient } from './http';

export async function fetchMecaniciensRequest() {
  const response = await apiClient.get('/api/users/mecaniciens/');
  return response.data;
}

export async function fetchGarageMecaniciensRequest() {
  const response = await apiClient.get('/api/users/owner/mecaniciens/');
  return response.data;
}

export async function createMecanicienRequest(payload) {
  const response = await apiClient.post('/api/users/owner/mecaniciens/', payload);
  return response.data;
}

export async function deleteMecanicienRequest(id) {
  await apiClient.delete(`/api/users/owner/mecaniciens/${id}/`);
}
