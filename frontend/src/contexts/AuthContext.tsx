import React, { createContext, useContext, ReactNode, useEffect, useState, useCallback } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate } from 'react-router-dom';
import { User } from '@/types';
import { getUserProfile, setAuthTokenGetter } from '@/services';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  getAccessToken: () => Promise<string>;
  user: User | null;
}

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { isAuthenticated, isLoading: auth0Loading, getAccessTokenSilently, user: auth0User } = useAuth0();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingRegistration, setIsCheckingRegistration] = useState(false);
  const [registrationCheckComplete, setRegistrationCheckComplete] = useState(false);

  const getAccessToken = useCallback(async () => {
    try {
      const token = await getAccessTokenSilently({
        authorizationParams: {
          audience: window.ENV?.AUTH0_AUDIENCE || '',
          scope: 'openid profile email'
        }
      });
      return token;
    } catch (error) {
      console.error('Error getting access token:', error);
      navigate('/');
      throw error;
    }
  }, [getAccessTokenSilently, navigate]);

  useEffect(() => {
    setAuthTokenGetter(getAccessToken);
  }, [getAccessToken]);

  useEffect(() => {
    const checkRegistration = async () => {
      if (isAuthenticated && !isCheckingRegistration) {
        try {
          setIsCheckingRegistration(true);
          setIsLoading(true);
          console.log('Checking user registration...');
          const userData = await getUserProfile();
          console.log('User profile retrieved:', userData);
          setUser(userData);
        } catch (error: any) {
          console.error('Error checking registration:', error);
          if (error.response?.status === 403) {
            navigate('/register');
          }
        } finally {
          setIsCheckingRegistration(false);
          setIsLoading(false);
          setRegistrationCheckComplete(true);
        }
      } else if (!isAuthenticated && !registrationCheckComplete) {
        setIsLoading(false);
        setRegistrationCheckComplete(true);
      }
    };

    if (!auth0Loading) {
      if (!isAuthenticated) {
        setUser(null);
      }
      
      if (!registrationCheckComplete || (isAuthenticated && !user)) {
        checkRegistration();
      }
    }
  }, [isAuthenticated, user, navigate, isCheckingRegistration, auth0Loading, registrationCheckComplete, auth0User]);

  // Debug logging
  useEffect(() => {
    console.log('AuthProvider State:', { 
      isAuthenticated, 
      isLoading: auth0Loading || isLoading,
      auth0Loading,
      user: user ? 'Set' : 'Not set',
      isCheckingRegistration,
      registrationCheckComplete,
      auth0User: auth0User ? 'Set' : 'Not set'
    });
  }, [isAuthenticated, isLoading, auth0Loading, user, isCheckingRegistration, registrationCheckComplete, auth0User]);

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      isLoading: auth0Loading || isLoading, 
      getAccessToken, 
      user 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 