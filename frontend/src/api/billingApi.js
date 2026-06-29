import { apiRequest } from './client.js'

export const authApi = {
  login: (username, password) =>
    apiRequest('/auth/login', { method: 'POST', body: { username, password }, auth: false }),
  me: () => apiRequest('/auth/me'),
  logout: () => apiRequest('/auth/logout', { method: 'POST' }),
  changePassword: (body) => apiRequest('/auth/change-password', { method: 'POST', body }),
  verifyPassword: (password) =>
    apiRequest('/auth/verify-password', { method: 'POST', body: { password } }),
}

export const storeApi = {
  bootstrap: () => apiRequest('/store/bootstrap'),
  eraseAll: () => apiRequest('/store/erase', { method: 'POST' }),
  purge: (options) => apiRequest('/store/purge', { method: 'POST', body: options }),
}

export const productApi = {
  list: () => apiRequest('/products'),
  create: (product) => apiRequest('/products', { method: 'POST', body: product }),
  update: (id, updates) => apiRequest(`/products/${id}`, { method: 'PUT', body: updates }),
  remove: (id) => apiRequest(`/products/${id}`, { method: 'DELETE' }),
}

export const groupApi = {
  list: () => apiRequest('/groups'),
  create: (name) => apiRequest('/groups', { method: 'POST', body: { name } }),
  update: (id, name) => apiRequest(`/groups/${id}`, { method: 'PUT', body: { name } }),
  remove: (id) => apiRequest(`/groups/${id}`, { method: 'DELETE' }),
  addSubcategory: (groupId, name) =>
    apiRequest(`/groups/${groupId}/subcategories`, { method: 'POST', body: { name } }),
  updateSubcategory: (groupId, subcategoryId, name) =>
    apiRequest(`/groups/${groupId}/subcategories/${subcategoryId}`, {
      method: 'PUT',
      body: { name },
    }),
  removeSubcategory: (groupId, subcategoryId) =>
    apiRequest(`/groups/${groupId}/subcategories/${subcategoryId}`, { method: 'DELETE' }),
}

export const batchApi = {
  list: () => apiRequest('/batches'),
  create: (name) => apiRequest('/batches', { method: 'POST', body: { name } }),
  remove: (id) => apiRequest(`/batches/${id}`, { method: 'DELETE' }),
}

export const orderApi = {
  list: () => apiRequest('/orders'),
  create: (order) => apiRequest('/orders', { method: 'POST', body: order }),
}

export const settingsApi = {
  get: () => apiRequest('/settings'),
  update: (settings) => apiRequest('/settings', { method: 'PUT', body: settings }),
}

export const userApi = {
  list: () => apiRequest('/users'),
  create: (body) => apiRequest('/users', { method: 'POST', body }),
  remove: (id) => apiRequest(`/users/${id}`, { method: 'DELETE' }),
  resetPassword: (id, newPassword) =>
    apiRequest(`/users/${id}/password`, { method: 'PATCH', body: { newPassword } }),
}

export const auditApi = {
  list: (category = '') =>
    apiRequest(category ? `/audit?category=${encodeURIComponent(category)}` : '/audit'),
  create: (body) => apiRequest('/audit', { method: 'POST', body }),
  clear: () => apiRequest('/audit', { method: 'DELETE' }),
}
