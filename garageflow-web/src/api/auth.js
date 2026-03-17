import { apiClient } from './client';

export async function loginRequest(payload) {
  const response = await apiClient.post('/api/users/token/', payload);
  return response.data;
}

export async function registerGarageOwnerRequest(payload) {
  const response = await apiClient.post('/api/garages/register/', payload);
  return response.data;
}
