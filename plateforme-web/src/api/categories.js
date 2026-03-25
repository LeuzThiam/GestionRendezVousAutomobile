import { apiClient } from './client';

export async function fetchOrganizationCategoriesRequest() {
  const response = await apiClient.get('/api/organizations/me/categories/');
  return response.data;
}

export async function createOrganizationCategoryRequest(payload) {
  const response = await apiClient.post('/api/organizations/me/categories/', payload);
  return response.data;
}

export async function updateOrganizationCategoryRequest(id, payload) {
  const response = await apiClient.patch(`/api/organizations/me/categories/${id}/`, payload);
  return response.data;
}

export async function deleteOrganizationCategoryRequest(id) {
  await apiClient.delete(`/api/organizations/me/categories/${id}/`);
}
