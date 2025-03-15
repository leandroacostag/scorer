import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { useAuth } from '@/contexts';
import { registerUser } from '@/services';
import { FaUser, FaSpinner } from 'react-icons/fa';
import LoadingScreen from '@/components/LoadingScreen';

const Register: React.FC = () => {
  const { user: auth0User, isAuthenticated: auth0IsAuthenticated } = useAuth0();
  const { user, isAuthenticated, isLoading: authLoading, needsRegistration } = useAuth();
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
    // If not authenticated at all, redirect to home
    if (!auth0IsAuthenticated && !authLoading) {
      console.log("User not authenticated, redirecting to home");
      navigate('/');
    }
  }, [isAuthenticated, user, navigate, auth0IsAuthenticated, authLoading]);

  // Debug logging for registration page
  useEffect(() => {
    console.log('Register page state:', {
      auth0IsAuthenticated,
      isAuthenticated,
      authLoading,
      needsRegistration,
      hasUsername: user?.username ? true : false
    });
  }, [auth0IsAuthenticated, isAuthenticated, authLoading, needsRegistration, user]);

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

  // Show loading screen while auth is loading, but only if we don't need registration
  if (authLoading && !needsRegistration) {
    return <LoadingScreen />;
  }

  // If not authenticated with Auth0, redirect to home
  if (!auth0IsAuthenticated && !authLoading) {
    console.log("User not authenticated with Auth0, redirecting to home");
    navigate('/');
    return null;
  }

  // If already registered (has username), redirect to home
  if (isAuthenticated && user?.username && !authLoading) {
    console.log("User is already registered, redirecting to home");
    navigate('/');
    return null;
  }

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6 text-center text-green-700">Complete Your Registration</h1>
      
      {!auth0IsAuthenticated ? (
        <div className="text-center">
          <p className="mb-4">You need to be logged in to register.</p>
          <button
            onClick={() => window.location.href = '/'}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          >
            Go to Login
          </button>
        </div>
      ) : (
        <>
          {needsRegistration && (
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
              You need to complete your registration by choosing a username.
            </div>
          )}
          <p className="mb-6 text-gray-600">
            Choose a username to complete your registration.
          </p>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="username" className="block text-gray-700 font-bold mb-2">
                Username
              </label>
              <div className="flex">
                <span className="inline-flex items-center px-3 bg-gray-200 text-gray-600 rounded-l-md border border-r-0 border-gray-300">
                  <FaUser />
                </span>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="flex-grow p-2 border border-gray-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Choose a username"
                />
              </div>
              <p className="text-sm text-gray-500 mt-1">
                3-20 characters, letters, numbers, and underscores only
              </p>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline flex items-center justify-center"
            >
              {loading ? (
                <>
                  <FaSpinner className="animate-spin mr-2" />
                  Registering...
                </>
              ) : (
                'Complete Registration'
              )}
            </button>
          </form>
        </>
      )}
    </div>
  );
};

export default Register; 