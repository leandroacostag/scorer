import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getLeaderboard } from '@/services';
import { FaSpinner, FaSync, FaTrophy, FaInfoCircle } from 'react-icons/fa';

// Simplified leaderboard entry with points included
interface LeaderboardEntry {
  user_id: string;
  username: string;
  matches_played: number;
  wins: number;
  draws: number;
  losses: number;
  goals: number;
  assists: number;
  points: number; // Points calculated by backend
}

const Leaderboard: React.FC = () => {
  const auth = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<string>("2025");
  const [showPointsInfo, setShowPointsInfo] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      // Get data from backend with year parameter
      const data = await getLeaderboard(selectedYear);
      setLeaderboard(data);
    } catch (err: any) {
      console.error('Error fetching leaderboard:', err);
      setError(err.response?.data?.detail || 'Failed to fetch leaderboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedYear]); // Refetch when year changes

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  if (loading && !refreshing) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="container max-w-3xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Leaderboard {selectedYear}</h1>
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

      <div className="mb-4 flex items-center">
        <button 
          onClick={() => setShowPointsInfo(!showPointsInfo)}
          className="flex items-center text-blue-600 hover:text-blue-800"
        >
          <FaInfoCircle className="mr-1" /> 
          How are points calculated?
        </button>
      </div>

      {showPointsInfo && (
        <div className="bg-blue-50 border-l-4 border-blue-500 text-blue-700 p-4 mb-6">
          <h3 className="font-bold">Points Calculation:</h3>
          <ul className="list-disc ml-5 mt-2">
            <li>3 points for each win</li>
            <li>0 points for draws and losses</li>
            <li>For matches with format F8 and above (F8, F9, F10, F11): 1 point per goal</li>
            <li>For matches with format F7 and below (F5, F6, F7): 1 point per 2 goals</li>
          </ul>
        </div>
      )}

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
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rank
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Player
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Points
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  W/D/L
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Goals
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assists
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {leaderboard.map((player, index) => (
                <tr 
                  key={player.user_id}
                  className={player.user_id === auth.user?.auth_id ? "bg-blue-50" : ""}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {index + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {player.user_id === auth.user?.auth_id ? "You" : player.username}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                    {player.points}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {player.wins}/{player.draws}/{player.losses}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {player.goals}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {player.assists}
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