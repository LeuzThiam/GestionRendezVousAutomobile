import { apiClient } from './http';

export async function fetchCurrentGarageRequest() {
  const response = await apiClient.get('/api/garages/me/');
  return response.data;
}

export async function fetchPublicGarageRequest(slug) {
  const response = await apiClient.get(`/api/garages/public/${slug}/`);
  return response.data;
}
