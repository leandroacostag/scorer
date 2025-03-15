import axios from 'axios';

// Get API URL from window.ENV or fallback to localhost:8000
const API_URL = (window.ENV && window.ENV.API_URL) || 'http://localhost:8000';

console.log('API URL being used:', API_URL);

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add response interceptor for debugging
api.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', error.response?.status, error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default api; 