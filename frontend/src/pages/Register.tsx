import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { useAuth } from '@/contexts';
import { registerUser } from '@/services';
import { FaUser } from 'react-icons/fa';

const Register: React.FC = () => {
  const { user: auth0User } = useAuth0();
  const { user, isAuthenticated } = useAuth();
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Redirect if already registered
  useEffect(() => {
    if (isAuthenticated && user?.username) {
      console.log("User is registered, redirecting to home");
      navigate('/');
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim()) {
      setError('Username is required');
      return;
    }

    // Username validation
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      setError('Username must be 3-20 characters long and can only contain letters, numbers, and underscores');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('Attempting to register with:', {
        username,
        email: auth0User?.email,
        auth_id: auth0User?.sub
      });

      await registerUser({
        username: username,
        email: auth0User?.email || '',
        auth_id: auth0User?.sub || ''
      });

      // Force a reload of the user data after registration
      window.location.href = '/';
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.response?.data?.detail || 'Failed to register');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <div className="text-center mb-6">
          <FaUser className="mx-auto text-4xl text-green-600 mb-2" />
          <h1 className="text-2xl font-bold">Choose Your Username</h1>
          <p className="text-gray-600">This will be your unique identifier in the app</p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="username" className="block text-gray-700 font-medium mb-2">
              Username
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Enter your username"
              disabled={loading}
            />
            <p className="text-sm text-gray-500 mt-1">
              3-20 characters, letters, numbers, and underscores only
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 ${
              loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2" />
                Registering...
              </div>
            ) : (
              'Continue'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Register; 