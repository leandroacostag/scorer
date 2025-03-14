import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { validateMatch, getPendingValidationMatches, addPlayerStatsToMatch, getUserMatches } from '@/services';
import { Match, User } from '@/types';
import { FaClipboardCheck, FaTimes, FaCheck, FaSync, FaCalendarAlt, FaMapMarkerAlt, FaUserPlus, FaTrophy, FaUserFriends, FaFutbol } from 'react-icons/fa';
import { format } from 'date-fns';

// Rename the component to MatchesPage
const MatchesPage: React.FC = () => {
  const auth = useAuth();
  const { refreshMatches, matches: myMatches } = useData();
  const [pendingMatches, setPendingMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddStatsModal, setShowAddStatsModal] = useState(false);
  const [currentMatch, setCurrentMatch] = useState<Match | null>(null);
  const [statsData, setStatsData] = useState({
    goals: 0,
    assists: 0,
    team: 'A'
  });
  const [addingStats, setAddingStats] = useState(false);
  const [userMap, setUserMap] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState('my-matches'); // 'my-matches' or 'pending-validation'

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get all pending validation matches
      const pending = await getPendingValidationMatches();
      setPendingMatches(pending);
      
      // Refresh user's matches through DataContext
      await refreshMatches();
      
      // Collect all unique user IDs from all matches
      const userIds = new Set<string>();
      const allMatches = [...pending, ...myMatches]; 
      
      allMatches.forEach(match => {
        userIds.add(match.created_by);
        match.players.forEach(player => {
          userIds.add(player.user_id);
        });
      });
      
      // Create a mapping of user IDs to usernames
      const userMapping: Record<string, string> = {};
      
      // For now, we'll just use the current user's username for their ID
      if (auth.user) {
        userMapping[auth.user.auth_id] = auth.user.username;
      }
      
      // For other users, use a placeholder 
      // In a real implementation, you would fetch user details from your API
      Array.from(userIds).forEach(id => {
        if (!userMapping[id]) {
          userMapping[id] = `Player ${id.substring(0, 6)}`;
        }
      });
      
      setUserMap(userMapping);
    } catch (err: any) {
      console.error('Error fetching matches data:', err);
      setError(err.response?.data?.detail || 'Failed to fetch matches data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await fetchData();
    } catch (err: any) {
      console.error('Error refreshing:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleValidate = async (matchId: string) => {
    try {
      setValidating(matchId);
      setError(null);
      await validateMatch(matchId);
      await fetchData();
    } catch (err: any) {
      console.error('Error validating match:', err);
      setError(err.response?.data?.detail || 'Failed to validate match');
    } finally {
      setValidating(null);
    }
  };
  
  const handleAddStats = (match: Match) => {
    setCurrentMatch(match);
    // Set default team based on existing players
    const teamACount = match.players.filter(p => p.team === 'A').length;
    const teamBCount = match.players.filter(p => p.team === 'B').length;
    
    // Default to the team with fewer players
    const suggestedTeam = teamACount <= teamBCount ? 'A' : 'B';
    
    setStatsData({
      ...statsData,
      team: suggestedTeam
    });
    
    setShowAddStatsModal(true);
  };
  
  const handleStatsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setStatsData({
      ...statsData,
      [name]: name === 'goals' || name === 'assists' ? parseInt(value) : value
    });
  };
  
  const handleSubmitStats = async () => {
    if (!currentMatch) return;
    
    try {
      setAddingStats(true);
      setError(null);
      
      await addPlayerStatsToMatch(currentMatch.match_id, {
        user_id: auth.user?.auth_id,
        team: statsData.team,
        goals: statsData.goals,
        assists: statsData.assists
      });
      
      await fetchData();
      setShowAddStatsModal(false);
    } catch (err: any) {
      console.error('Error adding stats:', err);
      setError(err.response?.data?.detail || 'Failed to add your stats');
    } finally {
      setAddingStats(false);
    }
  };

  const formatMatchDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'MMMM d, yyyy');
  };

  const getTeamPlayers = (match: Match, team: 'A' | 'B') => {
    return match.players.filter(player => player.team === team);
  };

  const getPlayerName = (userId: string, match: Match) => {
    if (userId === auth.user?.auth_id) {
      return 'You';
    }
    
    // Check if there's a player with this user_id and a username
    const player = match.players.find(p => p.user_id === userId);
    if (player && player.username) {
      return player.username;
    }
    
    // Fall back to the userMap or a generic player ID
    return userMap[userId] || `Player ${userId.substring(0, 6)}`;
  };
  
  const isPlayerInMatch = (match: Match, userId: string) => {
    return match.players.some(player => player.user_id === userId);
  };
  
  const getMatchStatusBadge = (match: Match) => {
    if (match.is_validated) {
      return <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">Validated</span>;
    } else {
      return <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded">Needs Validation</span>;
    }
  };
  
  const renderMatchCard = (match: Match, showValidate = false) => {
    return (
      <div key={match.match_id} className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-gray-50 px-6 py-4">
          <div className="flex justify-between">
            <div className="flex items-center">
              <div className="bg-blue-100 p-2 rounded-full mr-4">
                <FaFutbol className="text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">{match.format} Match</h3>
                <p className="text-sm text-gray-600">{formatMatchDate(match.date)}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">
                {match.score.teamA} - {match.score.teamB}
              </div>
              <div className="text-xs text-gray-500">
                Team A - Team B
              </div>
            </div>
          </div>
        </div>
        
        <div className="px-6 py-4">
          <div className="flex items-center mb-4">
            <FaMapMarkerAlt className="text-gray-500 mr-2" />
            <span className="text-gray-700">{match.location}</span>
            <span className="mx-2 text-gray-300">|</span>
            <FaCalendarAlt className="text-gray-500 mr-2" />
            <span className="text-gray-700">{match.time}</span>
          </div>
          
          <div className="border-t border-gray-200 pt-4">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-gray-700 mb-2 flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                  Team A
                </h3>
                <ul className="space-y-1">
                  {getTeamPlayers(match, 'A').map((player, index) => (
                    <li key={index} className="text-sm">
                      {getPlayerName(player.user_id, match)}
                      {player.goals > 0 && (
                        <span className="text-gray-500 ml-2">
                          {player.goals} {player.goals === 1 ? 'goal' : 'goals'}
                        </span>
                      )}
                      {player.assists > 0 && (
                        <span className="text-gray-500 ml-2">
                          {player.assists} {player.assists === 1 ? 'assist' : 'assists'}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-gray-700 mb-2 flex items-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                  Team B
                </h3>
                <ul className="space-y-1">
                  {getTeamPlayers(match, 'B').map((player, index) => (
                    <li key={index} className="text-sm">
                      {getPlayerName(player.user_id, match)}
                      {player.goals > 0 && (
                        <span className="text-gray-500 ml-2">
                          {player.goals} {player.goals === 1 ? 'goal' : 'goals'}
                        </span>
                      )}
                      {player.assists > 0 && (
                        <span className="text-gray-500 ml-2">
                          {player.assists} {player.assists === 1 ? 'assist' : 'assists'}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-gray-50 px-6 py-3 flex justify-between items-center">
          <div className="text-sm text-gray-500">
            Created by {match.creator_username ? (match.creator_username === auth.user?.username ? 'You' : match.creator_username) : getPlayerName(match.created_by, match)}
          </div>
          <div className="flex space-x-2">
            {showValidate && !isPlayerInMatch(match, auth.user?.auth_id || '') && (
              <button
                onClick={() => handleAddStats(match)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded flex items-center"
              >
                <FaUserPlus className="mr-1" />
                Add My Stats
              </button>
            )}
            {showValidate && isPlayerInMatch(match, auth.user?.auth_id || '') && (
              <button
                onClick={() => handleValidate(match.match_id)}
                disabled={validating === match.match_id}
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded flex items-center"
              >
                {validating === match.match_id ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                ) : (
                  <FaCheck className="mr-1" />
                )}
                Validate
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Matches</h1>
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

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('my-matches')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'my-matches'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FaTrophy className="inline-block mr-2" />
            My Matches
          </button>
          <button
            onClick={() => setActiveTab('pending-validation')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'pending-validation'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FaClipboardCheck className="inline-block mr-2" />
            Pending Validation
            {pendingMatches.length > 0 && (
              <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                {pendingMatches.length}
              </span>
            )}
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'my-matches' && (
        <div>
          {myMatches.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <FaTrophy className="mx-auto text-gray-400 text-5xl mb-4" />
              <p className="text-gray-500 text-lg mb-4">You haven't played any matches yet.</p>
              <button
                onClick={() => window.location.href = '/matches/create'}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded inline-flex items-center"
              >
                Create Your First Match
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {myMatches.map(match => renderMatchCard(match))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'pending-validation' && (
        <div>
          {pendingMatches.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <FaClipboardCheck className="mx-auto text-gray-400 text-5xl mb-4" />
              <p className="text-gray-500 text-lg mb-4">No matches waiting for your validation.</p>
              <p className="text-gray-500">When your friends record matches that include you, they'll appear here for validation.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {pendingMatches.map(match => renderMatchCard(match, true))}
            </div>
          )}
        </div>
      )}
      
      {/* Add Stats Modal */}
      {showAddStatsModal && currentMatch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add Your Stats</h2>
            <p className="mb-4 text-gray-600">
              Add your performance stats for this match.
            </p>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Which team were you on?
              </label>
              <div className="mb-3 p-3 bg-gray-50 rounded">
                <div className="mb-2">
                  <strong>Team A:</strong> {getTeamPlayers(currentMatch, 'A').map(p => getPlayerName(p.user_id, currentMatch)).join(', ') || 'No players yet'}
                </div>
                <div>
                  <strong>Team B:</strong> {getTeamPlayers(currentMatch, 'B').map(p => getPlayerName(p.user_id, currentMatch)).join(', ') || 'No players yet'}
                </div>
              </div>
              <select
                name="team"
                value={statsData.team}
                onChange={handleStatsChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              >
                <option value="A">Team A</option>
                <option value="B">Team B</option>
              </select>
              <p className="mt-1 text-sm text-gray-500">
                {auth.user?.username} will be added to Team {statsData.team}
              </p>
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Goals
              </label>
              <input
                type="number"
                name="goals"
                value={statsData.goals}
                onChange={handleStatsChange}
                min="0"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Assists
              </label>
              <input
                type="number"
                name="assists"
                value={statsData.assists}
                onChange={handleStatsChange}
                min="0"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowAddStatsModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitStats}
                disabled={addingStats}
                className={`bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center ${
                  addingStats ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {addingStats ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                ) : (
                  <FaCheck className="mr-1" />
                )}
                {addingStats ? 'Saving...' : 'Save Stats'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchesPage; 