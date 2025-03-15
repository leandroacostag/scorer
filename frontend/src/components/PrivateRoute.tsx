import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts';
import LoadingScreen from '@/components/LoadingScreen';

interface PrivateRouteProps {
  children: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading, user, needsRegistration } = useAuth();

  // Debug logging
  useEffect(() => {
    console.log('PrivateRoute state:', { 
      isAuthenticated, 
      isLoading, 
      hasUser: !!user,
      needsRegistration 
    });
  }, [isAuthenticated, isLoading, user, needsRegistration]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" />;
  }

  // If authenticated but needs registration, redirect to registration
  if (needsRegistration) {
    return <Navigate to="/register" />;
  }

  return <>{children}</>;
};

export default PrivateRoute; 