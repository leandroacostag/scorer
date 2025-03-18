import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { createMatch } from '@/services';
import { FaFutbol, FaArrowLeft } from 'react-icons/fa';

const CreateMatch: React.FC = () => {
  const navigate = useNavigate();
  const auth = useAuth();
  const { refreshMatches } = useData();
  
  const [formData, setFormData] = useState({
    date: '',
    location: '',
    time: '',
    format: 'F5',
    scoreMyTeam: 0,
    scoreOppositeTeam: 0,
    goals: 0,
    assists: 0,
    result: 'win', // 'win', 'lose', or 'draw'
    useScore: false,
    players: []
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData({
      ...formData,
      [name]: checked
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // Player data with goals and assists
      const playerData = {
        user_id: auth.user?.auth_id,
        team: 'A', // Player is always on team A (My Team)
        goals: parseInt(formData.goals.toString()),
        assists: parseInt(formData.assists.toString())
      };
      
      // Determine winning team based on the match result
      let winningTeam: "A" | "B" | "draw";
      
      if (formData.result === 'win') {
        winningTeam = 'A';
      } else if (formData.result === 'lose') {
        winningTeam = 'B';
      } else {
        // Draw
        winningTeam = 'draw';
      }
      
      const matchData = {
        date: formData.date,
        location: formData.location,
        time: formData.time,
        format: formData.format,
        winning_team: winningTeam,
        players: [playerData]
      };
      
      await createMatch(matchData);
      await refreshMatches();
      navigate('/matches');
    } catch (err: any) {
      console.error('Error creating match:', err);
      setError(err.response?.data?.detail || 'Failed to create match');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center mb-6">
        <button 
          onClick={() => navigate('/matches')}
          className="mr-4 text-blue-600 hover:text-blue-800"
        >
          <FaArrowLeft />
        </button>
        <h1 className="text-3xl font-bold">Create New Match</h1>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Date
            </label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Location
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="Enter location"
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Time
            </label>
            <input
              type="time"
              name="time"
              value={formData.time}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Format
            </label>
            <select
              name="format"
              value={formData.format}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            >
              <option value="F5">5-a-side</option>
              <option value="F6">6-a-side</option>
              <option value="F7">7-a-side</option>
              <option value="F8">8-a-side</option>
              <option value="F9">9-a-side</option>
              <option value="F10">10-a-side</option>
              <option value="F11">11-a-side</option>
            </select>
          </div>
          
          <div className="mb-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="useScore"
                checked={formData.useScore}
                onChange={handleCheckboxChange}
                className="mr-2"
              />
              <span className="text-gray-700 text-sm font-bold">Enter exact score</span>
            </label>
          </div>
          
          {formData.useScore ? (
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  My Team Score
                </label>
                <input
                  type="number"
                  name="scoreMyTeam"
                  value={formData.scoreMyTeam}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  min="0"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Opposite Team Score
                </label>
                <input
                  type="number"
                  name="scoreOppositeTeam"
                  value={formData.scoreOppositeTeam}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  min="0"
                  required
                />
              </div>
            </div>
          ) : (
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Match Result
              </label>
              <div className="flex space-x-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="result"
                    value="win"
                    checked={formData.result === 'win'}
                    onChange={handleChange}
                    className="form-radio"
                  />
                  <span className="ml-2">Win</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="result"
                    value="lose"
                    checked={formData.result === 'lose'}
                    onChange={handleChange}
                    className="form-radio"
                  />
                  <span className="ml-2">Lose</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="result"
                    value="draw"
                    checked={formData.result === 'draw'}
                    onChange={handleChange}
                    className="form-radio"
                  />
                  <span className="ml-2">Draw</span>
                </label>
              </div>
            </div>
          )}
          
          <div className="mb-6">
            <h3 className="block text-gray-700 text-lg font-bold mb-3">Your Performance</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Goals
                </label>
                <input
                  type="number"
                  name="goals"
                  value={formData.goals}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  min="0"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Assists
                </label>
                <input
                  type="number"
                  name="assists"
                  value={formData.assists}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  min="0"
                  required
                />
              </div>
            </div>
          </div>
                    
          <div className="flex items-center justify-between">
            <button
              type="submit"
              disabled={loading}
              className={`bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline flex items-center ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
              ) : (
                <FaFutbol className="mr-2" />
              )}
              {loading ? 'Creating...' : 'Create Match'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateMatch; 