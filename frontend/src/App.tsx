import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Auth0Provider } from '@auth0/auth0-react';
import { AuthProvider } from './contexts';
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';
import { DataProvider } from './contexts/DataContext';
import Register from './pages/Register';
import Friends from './pages/Friends';
import Leaderboard from './pages/Leaderboard';
import Home from './pages/Home';
import MatchesPage from './pages/Matches';

declare global {
    interface Window {
        env: {
            AUTH0_DOMAIN: string;
            AUTH0_CLIENT_ID: string;
            AUTH0_AUDIENCE: string;
        }
    }
}

// Get Auth0 configuration from window.env
const domain = window.env.AUTH0_DOMAIN;
const clientId = window.env.AUTH0_CLIENT_ID;
const audience = window.env.AUTH0_AUDIENCE;

if (!domain || !clientId || !audience) {
  throw new Error('Missing Auth0 configuration');
}

const App: React.FC = () => {
  console.log('Auth0 Config:', { domain, clientId, audience });

  return (
    <Router>
      <Auth0Provider
        domain={domain}
        clientId={clientId}
        authorizationParams={{
          redirect_uri: window.location.origin,
          audience: audience,
          scope: "openid profile email"
        }}
        useRefreshTokens={true}
        cacheLocation="localstorage"
      >
        <AuthProvider>
          <DataProvider>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/register" element={<Register />} />
              <Route element={<Layout />}>
                <Route 
                  path="/friends" 
                  element={
                    <PrivateRoute>
                      <Friends />
                    </PrivateRoute>
                  } 
                />
                <Route 
                  path="/matches" 
                  element={
                    <PrivateRoute>
                      <MatchesPage />
                    </PrivateRoute>
                  } 
                />
                <Route 
                  path="/leaderboard" 
                  element={
                    <PrivateRoute>
                      <Leaderboard />
                    </PrivateRoute>
                  } 
                />
              </Route>
            </Routes>
          </DataProvider>
        </AuthProvider>
      </Auth0Provider>
    </Router>
  );
};

export default App; 