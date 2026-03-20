import { apiClient } from './client';

export async function fetchCurrentGarageRequest() {
  const response = await apiClient.get('/api/garages/me/');
  return response.data;
}

export async function fetchPublicGaragesRequest(query = '') {
  const response = await apiClient.get('/api/garages/public/', {
    params: query ? { q: query } : undefined,
  });
  return response.data;
}

export async function fetchPublicGarageRequest(slug) {
  const response = await apiClient.get(`/api/garages/public/${slug}/`);
  return response.data;
}
