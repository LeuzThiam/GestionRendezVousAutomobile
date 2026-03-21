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

export async function fetchGarageFermeturesRequest() {
  const response = await apiClient.get('/api/garages/me/fermetures/');
  return response.data;
}

export async function createGarageFermetureRequest(payload) {
  const response = await apiClient.post('/api/garages/me/fermetures/', payload);
  return response.data;
}

export async function updateGarageFermetureRequest(id, payload) {
  const response = await apiClient.patch(`/api/garages/me/fermetures/${id}/`, payload);
  return response.data;
}

export async function deleteGarageFermetureRequest(id) {
  await apiClient.delete(`/api/garages/me/fermetures/${id}/`);
}
