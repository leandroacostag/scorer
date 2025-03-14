import axios from 'axios';

// Try to get API URL from window.ENV first, then fall back to process.env
const API_URL = (window.ENV && window.ENV.REACT_APP_API_URL) || process.env.REACT_APP_API_URL || '';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api; 