import { apiClient } from './client';

export async function fetchCurrentOrganizationRequest() {
  const response = await apiClient.get('/api/organizations/me/');
  return response.data;
}

export async function updateCurrentOrganizationRequest(payload) {
  const response = await apiClient.patch('/api/organizations/me/', payload);
  return response.data;
}

export async function fetchPublicOrganizationsRequest(query = '') {
  const response = await apiClient.get('/api/organizations/public/', {
    params: query ? { q: query } : undefined,
  });
  return response.data;
}

export async function fetchPublicOrganizationRequest(slug) {
  const response = await apiClient.get(`/api/organizations/public/${slug}/`);
  return response.data;
}
