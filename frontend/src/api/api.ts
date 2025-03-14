import axios from 'axios';

// Get API URL from window.ENV or fallback to empty string
const API_URL = (window.ENV && window.ENV.REACT_APP_API_URL) || '';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api; 