/* API service — stub for future backend integration */

const BASE_URL = import.meta.env.VITE_API_URL || '';

const request = async (endpoint, options = {}) => {
  const url = `${BASE_URL}${endpoint}`;
  const config = {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  };
  const response = await fetch(url, config);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
};

export const api = {
  get:    (endpoint) => request(endpoint),
  post:   (endpoint, body) => request(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  put:    (endpoint, body) => request(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (endpoint) => request(endpoint, { method: 'DELETE' }),
};

export default api;
