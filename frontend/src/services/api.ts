import axios from 'axios';
import { User, UserCreate, Match, UserStats, LeaderboardEntry } from '../types';

// Get API URL from window.ENV or fallback to localhost:8000
const API_URL = (window.ENV && window.ENV.API_URL) || 'http://localhost:8000/api';

console.log('API URL being used:', API_URL);

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true
});

// Create a function to get the token
let getAuthToken: () => Promise<string>;

// Named exports
export {
  api,
  getAuthToken,
};

export const setAuthTokenGetter = (getter: () => Promise<string>) => {
  getAuthToken = getter;
  
  // Set up axios interceptor to add the token to all requests
  api.interceptors.request.use(async (config) => {
    try {
      if (getAuthToken) {
        const token = await getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          console.log('Added auth token to request');
        }
      }
      return config;
    } catch (error) {
      console.error('Error setting auth token:', error);
      return config;
    }
  });
};

// Add response interceptor for debugging
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error('Authentication error:', error);
      // Could trigger a refresh of the token here
    }
    return Promise.reject(error);
  }
);

// Auth API
export const registerUser = async (userData: UserCreate): Promise<User> => {
  const response = await api.post<User>('/auth/register', userData);
  return response.data;
};

export const getUserProfile = async (): Promise<User> => {
  const response = await api.get<User>('/auth/me');
  return response.data;
};

// Friends API
export const sendFriendRequest = async (data: { user_id: string }) => {
  try {
    const response = await api.post<void>('/friends/request', data);
    return response.data;
  } catch (error: any) {
    console.error('Friend request error:', {
      status: error.response?.status,
      data: error.response?.data
    });
    throw error;
  }
};

export const acceptFriendRequest = async (userId: string) => {
  const response = await api.post('/friends/accept', { user_id: userId });
  return response.data;
};

export const getFriendsList = async () => {
  const response = await api.get('/friends/list');
  return response.data;
};

export const getReceivedRequests = async () => {
  const response = await api.get<User[]>('/friends/requests/received');
  return response.data;
};

export const getSentRequests = async () => {
  const response = await api.get<User[]>('/friends/requests/sent');
  return response.data;
};

export const searchUsers = async (query: string) => {
  const response = await api.get<User[]>('/friends/search', { params: { query } });
  return response.data;
};

export const deleteFriend = async (userId: string): Promise<void> => {
  await api.delete<User[]>(`/friends/remove/${userId}`);
}; 

// Matches API
export const createMatch = async (matchData: any) => {
  const response = await api.post('/matches', matchData);
  return response.data;
};

export const validateMatch = async (matchId: string) => {
  const response = await api.post(`/matches/${matchId}/validate`);
  return response.data;
};

export const getUserMatches = async () => {
  const response = await api.get<Match[]>('/matches/my-matches');
  return response.data;
};

export const getPendingValidationMatches = async () => {
  const response = await api.get<Match[]>('/matches/pending-validation');
  return response.data;
};

export const getUserStats = async () => {
  const response = await api.get<UserStats>('/matches/stats');
  return response.data;
};

export const getLeaderboard = async (year?: string) => {
  const url = year ? `/matches/leaderboard?year=${year}` : '/matches/leaderboard';
  const response = await api.get(url);
  return response.data;
};

// Add a new function to add player stats to a match
export const addPlayerStatsToMatch = async (matchId: string, playerData: any) => {
  const response = await api.post(`/matches/${matchId}/players`, playerData);
  return response.data;
};

// Add a function to get friend suggestions
export const getFriendSuggestions = async () => {
  const response = await api.get<User[]>('/friends/suggestions');
  return response.data;
};

export const skipMatchValidation = async (matchId: string) => {
  const response = await api.post(`/matches/${matchId}/skip-validation`);
  return response.data;
};

export default api; 