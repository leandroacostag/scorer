import React, { createContext, useContext, ReactNode, useEffect, useState, useCallback } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User } from '@/types';
import { getUserProfile, setAuthTokenGetter } from '@/services';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  getAccessToken: () => Promise<string>;
  user: User | null;
  needsRegistration: boolean;
}

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { isAuthenticated, isLoading: auth0Loading, getAccessTokenSilently, user: auth0User } = useAuth0();
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingRegistration, setIsCheckingRegistration] = useState(false);
  const [registrationCheckComplete, setRegistrationCheckComplete] = useState(false);
  const [needsRegistration, setNeedsRegistration] = useState(false);

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
    if (needsRegistration && isAuthenticated && !isLoading && !auth0Loading) {
      console.log('Redirecting to registration page');
      navigate('/register');
    }
  }, [needsRegistration, isAuthenticated, isLoading, auth0Loading, navigate]);

  useEffect(() => {
    const checkRegistration = async () => {
      if (isAuthenticated && !isCheckingRegistration && !needsRegistration) {
        try {
          setIsCheckingRegistration(true);
          setIsLoading(true);
          console.log('Checking user registration...');
          const userData = await getUserProfile();
          console.log('User profile retrieved:', userData);
          setUser(userData);
          setNeedsRegistration(false);
        } catch (error: any) {
          console.error('Error checking registration:', error);
          if (error.response?.status === 403) {
            console.log('User needs registration, redirecting to registration page');
            setNeedsRegistration(true);
          }
        } finally {
          setIsCheckingRegistration(false);
          setIsLoading(false);
          setRegistrationCheckComplete(true);
        }
      } else if (!isAuthenticated && !registrationCheckComplete) {
        setIsLoading(false);
        setRegistrationCheckComplete(true);
        setNeedsRegistration(false);
      }
    };

    if (!auth0Loading) {
      if (!isAuthenticated) {
        setUser(null);
        setNeedsRegistration(false);
        setIsLoading(false);
      }
      
      if (!registrationCheckComplete || (isAuthenticated && !user && !needsRegistration)) {
        checkRegistration();
      }
    }
  }, [isAuthenticated, user, navigate, isCheckingRegistration, auth0Loading, registrationCheckComplete, auth0User, needsRegistration]);

  // Debug logging
  useEffect(() => {
    console.log('AuthProvider State:', { 
      isAuthenticated, 
      isLoading: auth0Loading || isLoading,
      auth0Loading,
      user: user ? 'Set' : 'Not set',
      isCheckingRegistration,
      registrationCheckComplete,
      needsRegistration,
      path: location.pathname,
      auth0User: auth0User ? 'Set' : 'Not set'
    });
  }, [isAuthenticated, isLoading, auth0Loading, user, isCheckingRegistration, registrationCheckComplete, auth0User, needsRegistration, location.pathname]);

  // Calculate the actual loading state
  const actuallyLoading = auth0Loading || 
    (isLoading && !needsRegistration);

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      isLoading: actuallyLoading,
      getAccessToken, 
      user,
      needsRegistration
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