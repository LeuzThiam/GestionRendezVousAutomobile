import { apiClient } from './client';

export async function loginRequest(payload) {
  const response = await apiClient.post('/api/auth/login/', payload);
  return response.data;
}

export async function registerOrganizationOwnerRequest(payload) {
  const response = await apiClient.post('/api/auth/register/owner/', payload);
  return response.data;
}

export async function registerClientRequest(payload) {
  const response = await apiClient.post('/api/auth/register/client/', payload);
  return response.data;
}

export async function refreshTokenRequest(payload) {
  const response = await apiClient.post('/api/auth/refresh/', payload);
  return response.data;
}

export async function logoutRequest() {
  await apiClient.post('/api/auth/logout/');
}

export async function fetchCurrentUserRequest() {
  const response = await apiClient.get('/api/auth/me/');
  return response.data;
}
