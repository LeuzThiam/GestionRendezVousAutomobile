import { apiClient } from './client';

export async function fetchOrganizationServicesRequest() {
  const response = await apiClient.get('/api/organizations/me/services/');
  return response.data;
}

export async function createOrganizationServiceRequest(payload) {
  const response = await apiClient.post('/api/organizations/me/services/', payload);
  return response.data;
}

export async function updateOrganizationServiceRequest(id, payload) {
  const response = await apiClient.patch(`/api/organizations/me/services/${id}/`, payload);
  return response.data;
}

export async function deleteOrganizationServiceRequest(id) {
  await apiClient.delete(`/api/organizations/me/services/${id}/`);
}
