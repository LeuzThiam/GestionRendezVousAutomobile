import { apiClient } from './client';

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

export async function updateMecanicienRequest(id, payload) {
  const response = await apiClient.patch(`/api/users/owner/mecaniciens/${id}/`, payload);
  return response.data;
}

export async function fetchMecanicienDisponibilitesRequest(mecanicienId = '') {
  const response = await apiClient.get('/api/users/owner/mecaniciens/disponibilites/', {
    params: mecanicienId ? { mecanicien: mecanicienId } : undefined,
  });
  return response.data;
}

export async function createMecanicienDisponibiliteRequest(payload) {
  const response = await apiClient.post('/api/users/owner/mecaniciens/disponibilites/', payload);
  return response.data;
}

export async function updateMecanicienDisponibiliteRequest(id, payload) {
  const response = await apiClient.patch(`/api/users/owner/mecaniciens/disponibilites/${id}/`, payload);
  return response.data;
}

export async function deleteMecanicienDisponibiliteRequest(id) {
  await apiClient.delete(`/api/users/owner/mecaniciens/disponibilites/${id}/`);
}
