import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getLeaderboard } from '@/services';
import { LeaderboardEntry } from '@/types';
import { FaTrophy, FaFutbol, FaHandsHelping, FaSpinner, FaSync } from 'react-icons/fa';

const Leaderboard: React.FC = () => {
  const auth = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getLeaderboard();
      console.log('Leaderboard data:', data);
      setLeaderboard(data);
    } catch (err: any) {
      console.error('Error fetching leaderboard:', err);
      setError(err.response?.data?.detail || 'Failed to fetch leaderboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (auth.user) {
      fetchLeaderboard();
    }
  }, [auth.user]);

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await fetchLeaderboard();
    } catch (error) {
      console.error('Error refreshing leaderboard:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const isCurrentUser = (userId: string) => {
    return userId === auth.user?.auth_id;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <FaSpinner className="animate-spin text-blue-600 text-4xl" />
      </div>
    );
  }

  return (
    <div className="container max-w-3xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Leaderboard</h1>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          {refreshing ? (
            <FaSpinner className="animate-spin mr-2" />
          ) : (
            <FaSync className="mr-2" />
          )}
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
          <p>{error}</p>
        </div>
      )}

      {leaderboard.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <FaTrophy className="text-gray-400 text-5xl mx-auto mb-4" />
          <p className="text-xl font-medium text-gray-700 mb-2">No Data Yet</p>
          <p className="text-gray-500">
            Once you and your friends play some matches, the leaderboard will be populated.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Player</th>
                <th className="py-3 px-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <FaTrophy className="inline mr-1" /> Wins
                </th>
                <th className="py-3 px-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <FaFutbol className="inline mr-1" /> Goals
                </th>
                <th className="py-3 px-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <FaHandsHelping className="inline mr-1" /> Assists
                </th>
                <th className="py-3 px-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Matches
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {leaderboard.map((entry, index) => (
                <tr 
                  key={entry.user_id}
                  className={`${isCurrentUser(entry.user_id) ? 'bg-blue-50' : ''}`}
                >
                  <td className="py-4 px-4 whitespace-nowrap">
                    {index === 0 && <span className="text-yellow-500 text-lg">🥇</span>}
                    {index === 1 && <span className="text-gray-400 text-lg">🥈</span>}
                    {index === 2 && <span className="text-yellow-700 text-lg">🥉</span>}
                    {index > 2 && <span className="font-medium text-gray-900">{index + 1}</span>}
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="text-sm font-medium text-gray-900">
                        {isCurrentUser(entry.user_id) ? 'You' : entry.username}
                        {isCurrentUser(entry.user_id) && <span className="ml-2 text-xs text-blue-600">(You)</span>}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap text-center text-sm font-medium">
                    {entry.wins}
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap text-center text-sm font-medium">
                    {entry.goals}
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap text-center text-sm font-medium">
                    {entry.assists}
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap text-center text-sm font-medium">
                    {entry.total_matches}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Leaderboard; 