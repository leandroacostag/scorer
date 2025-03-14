export {
  api,
  getAccessToken,
  setAuthTokenGetter,
  registerUser,
  getUserProfile,
  sendFriendRequest,
  acceptFriendRequest,
  getFriendsList,
  getReceivedRequests,
  getSentRequests,
  searchUsers,
  deleteFriend,
  createMatch,
  validateMatch,
  getUserMatches,
  getPendingValidationMatches,
  getUserStats,
  getLeaderboard,
  addPlayerStatsToMatch,
  getFriendSuggestions,
  skipMatchValidation
} from './api';

const apiPath = './api';
export default apiPath; 