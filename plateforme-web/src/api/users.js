import { apiClient } from './client';

export async function fetchUserProfileRequest() {
  const response = await apiClient.get('/api/users/profile/');
  return response.data;
}

export async function updateUserProfileRequest(payload) {
  const response = await apiClient.patch('/api/users/profile/update/', payload);
  return response.data;
}
