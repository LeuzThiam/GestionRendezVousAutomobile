import { apiClient } from './client';

export async function fetchOrganizationDisponibilitesRequest() {
  const response = await apiClient.get('/api/organizations/me/disponibilites/');
  return response.data;
}

export async function createOrganizationDisponibiliteRequest(payload) {
  const response = await apiClient.post('/api/organizations/me/disponibilites/', payload);
  return response.data;
}

export async function updateOrganizationDisponibiliteRequest(id, payload) {
  const response = await apiClient.patch(`/api/organizations/me/disponibilites/${id}/`, payload);
  return response.data;
}

export async function deleteOrganizationDisponibiliteRequest(id) {
  await apiClient.delete(`/api/organizations/me/disponibilites/${id}/`);
}

export async function fetchOrganizationFermeturesRequest() {
  const response = await apiClient.get('/api/organizations/me/fermetures/');
  return response.data;
}

export async function createOrganizationFermetureRequest(payload) {
  const response = await apiClient.post('/api/organizations/me/fermetures/', payload);
  return response.data;
}

export async function updateOrganizationFermetureRequest(id, payload) {
  const response = await apiClient.patch(`/api/organizations/me/fermetures/${id}/`, payload);
  return response.data;
}

export async function deleteOrganizationFermetureRequest(id) {
  await apiClient.delete(`/api/organizations/me/fermetures/${id}/`);
}
