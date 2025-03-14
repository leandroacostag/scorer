import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { 
  searchUsers, 
  sendFriendRequest, 
  acceptFriendRequest,
  deleteFriend,
  getFriendSuggestions
} from '@/services';
import { User } from '@/types';
import { FaUserPlus, FaUserCheck, FaUserClock, FaCheck, FaTimes, FaSync, FaUserMinus } from 'react-icons/fa';

const Friends: React.FC = () => {
  const auth = useAuth();
  const { friends, receivedRequests, sentRequests, loading, error: dataError, refreshFriends } = useData();
  
  const [searchInput, setSearchInput] = useState('');
  const [addingFriend, setAddingFriend] = useState(false);
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const [acceptingRequest, setAcceptingRequest] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(dataError);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingFriend, setDeletingFriend] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const handleSearch = async () => {
    if (!searchInput.trim()) {
      setError('Please enter a username');
      return;
    }

    try {
      setSearching(true);
      setError(null);
      const results = await searchUsers(searchInput);
      console.log('Search results:', results);
      setSearchResults(results);
      if (results.length === 0) {
        setError('No users found');
      }
    } catch (err: any) {
      console.error('Error searching users:', err);
      setError(err.response?.data?.detail || 'Failed to search users');
    } finally {
      setSearching(false);
    }
  };

  const handleAddFriend = async (userId: string) => {
    try {
      setAddingFriend(true);
      setError(null);
      
      console.log('Sending friend request:', { user_id: userId });
      
      await sendFriendRequest({ user_id: userId });
      
      setSearchInput('');
      setSearchResults([]);
      await refreshFriends();
    } catch (err: any) {
      console.error('Error adding friend:', err);
      if (err.response?.status === 422) {
        const validationError = err.response?.data?.detail;
        if (Array.isArray(validationError)) {
          setError(validationError.map(e => e.msg).join(', '));
        } else {
          setError(validationError?.msg || 'Invalid request');
        }
      } else {
        setError(err.response?.data?.detail || 'Failed to add friend');
      }
    } finally {
      setAddingFriend(false);
    }
  };

  const handleAcceptRequest = async (userId: string) => {
    try {
      setAcceptingRequest(userId);
      await acceptFriendRequest(userId);
      await refreshFriends();
    } catch (err: any) {
      console.error('Error accepting friend request:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to accept request');
    } finally {
      setAcceptingRequest(null);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      setError(null);
      await refreshFriends();
      await fetchSuggestions();
    } catch (err: any) {
      console.error('Error refreshing friends list:', err);
      setError(err.response?.data?.detail || 'Failed to refresh friends list');
    } finally {
      setRefreshing(false);
    }
  };

  const handleDeleteFriend = async (userId: string) => {
    try {
      setDeletingFriend(userId);
      setError(null);
      await deleteFriend(userId);
      await refreshFriends();
    } catch (err: any) {
      console.error('Error removing friend:', err);
      setError(err.response?.data?.detail || 'Failed to remove friend');
    } finally {
      setDeletingFriend(null);
    }
  };

  const isUserActionable = (userId: string): { canAdd: boolean; message?: string } => {
    if (!auth.user) {
      return { canAdd: false, message: 'Loading...' };
    }

    const searchedUser = searchResults.find(u => u.auth_id === userId);
    
    if (!searchedUser) {
      return { canAdd: false, message: 'User not found' };
    }

    if (auth.user.username === searchedUser.username) {
      return { canAdd: false, message: 'This is you' };
    }
    
    if (searchedUser.is_friend) {
      return { canAdd: false, message: 'Already friends' };
    }
    
    if (searchedUser.is_pending_friend) {
      return { canAdd: false, message: 'Request sent' };
    }
    
    if (searchedUser.is_pending_request) {
      return { canAdd: false, message: 'Request received' };
    }

    return { canAdd: true };
  };

  const fetchSuggestions = async () => {
    try {
      setLoadingSuggestions(true);
      const suggestionsData = await getFriendSuggestions();
      setSuggestions(suggestionsData);
    } catch (err: any) {
      console.error('Error fetching friend suggestions:', err);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  useEffect(() => {
    if (auth.user) {
      fetchSuggestions();
    }
  }, [auth.user]);

  if (loading || !auth.user) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Friends</h1>
        <button 
          onClick={handleRefresh}
          disabled={refreshing}
          className="text-blue-600 hover:text-blue-800 flex items-center"
        >
          {refreshing ? (
            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-600 mr-2"></div>
          ) : (
            <FaSync className="mr-1" />
          )}
          Refresh
        </button>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Add Friend</h2>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        <div className="flex items-center">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Enter username"
            className="flex-1 border border-gray-300 rounded-l px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <button
            onClick={handleSearch}
            disabled={searching || !searchInput.trim()}
            className={`bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-r flex items-center ${
              (searching || !searchInput.trim()) ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {searching ? (
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2" />
            ) : (
              <FaUserPlus className="mr-2" />
            )}
            {searching ? 'Searching...' : 'Search'}
          </button>
        </div>

        {searchResults.length > 0 && (
          <div className="mt-4">
            <h3 className="text-lg font-medium mb-2">Search Results</h3>
            <ul className="divide-y">
              {searchResults.map((user) => (
                <li key={user.auth_id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{user.username}</p>
                  </div>
                  <div>
                    {(() => {
                      const { canAdd, message } = isUserActionable(user.auth_id);
                      console.log('User ID:', user.auth_id);
                      return canAdd ? (
                        <button
                          onClick={() => handleAddFriend(user.auth_id)}
                          disabled={addingFriend}
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded flex items-center"
                        >
                          <FaUserPlus className="mr-1" />
                          Add Friend
                        </button>
                      ) : (
                        <span className="text-gray-500">{message}</span>
                      );
                    })()}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {(receivedRequests.length > 0 || sentRequests.length > 0) && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <FaUserClock className="mr-2 text-yellow-600" />
            Friend Requests
          </h2>

          {receivedRequests.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2 text-gray-700">Received Requests</h3>
              <ul className="divide-y">
                {receivedRequests.map((request) => (
                  <li key={request.auth_id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{request.username}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleAcceptRequest(request.auth_id)}
                        disabled={acceptingRequest === request.auth_id}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded flex items-center"
                      >
                        {acceptingRequest === request.auth_id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2" />
                        ) : (
                          <FaCheck className="mr-1" />
                        )}
                        Accept
                      </button>
                      <button className="text-red-600 hover:text-red-700">
                        <FaTimes />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {sentRequests.length > 0 && (
            <div>
              <h3 className="text-lg font-medium mb-2 text-gray-700">Sent Requests</h3>
              <ul className="divide-y">
                {sentRequests.map((request) => (
                  <li key={request.auth_id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{request.username}</p>
                    </div>
                    <span className="text-gray-500 flex items-center">
                      <FaUserClock className="mr-1" />
                      Pending
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Friend Suggestions */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <FaUserPlus className="mr-2 text-blue-600" />
          Friend Suggestions
        </h2>
        
        {loadingSuggestions ? (
          <div className="flex justify-center items-center h-16">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : suggestions.length === 0 ? (
          <p className="text-gray-500">No suggestions available at the moment.</p>
        ) : (
          <ul className="divide-y">
            {suggestions.map((suggestion) => (
              <li key={suggestion.auth_id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="font-medium">{suggestion.username}</p>
                  <p className="text-xs text-gray-500">
                    {suggestion.mutual_friends} mutual friend{suggestion.mutual_friends !== 1 ? 's' : ''}
                  </p>
                </div>
                <button
                  onClick={() => handleAddFriend(suggestion.auth_id)}
                  disabled={addingFriend}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded flex items-center"
                >
                  <FaUserPlus className="mr-1" />
                  Add Friend
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold flex items-center">
            <FaUserCheck className="mr-2 text-green-600" />
            My Friends ({friends.length})
          </h2>
        </div>
        
        {friends.length === 0 ? (
          <p className="text-gray-500">You don't have any friends yet.</p>
        ) : (
          <ul className="divide-y">
            {friends.map((friend) => (
              <li key={friend.auth_id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="font-medium">{friend.username}</p>
                </div>
                <button
                  onClick={() => handleDeleteFriend(friend.auth_id)}
                  disabled={deletingFriend === friend.auth_id}
                  className="text-red-600 hover:text-red-800 flex items-center"
                >
                  {deletingFriend === friend.auth_id ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-red-600 mr-2"></div>
                  ) : (
                    <FaUserMinus className="mr-1" />
                  )}
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Friends; 