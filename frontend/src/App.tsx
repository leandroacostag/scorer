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
import CreateMatch from './pages/CreateMatch';

// Get Auth0 configuration from window.ENV
const domain = window.ENV?.AUTH0_DOMAIN || '';
const clientId = window.ENV?.AUTH0_CLIENT_ID || '';
const audience = window.ENV?.AUTH0_AUDIENCE || '';

console.log('Auth0 Config:', { 
  domain: domain ? 'Set' : 'Not set', 
  clientId: clientId ? 'Set' : 'Not set', 
  audience: audience ? 'Set' : 'Not set' 
});

if (!domain || !clientId || !audience) {
  console.error('Missing Auth0 configuration');
}

const App: React.FC = () => {
  return (
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: window.location.origin,
        audience: audience
      }}
      useRefreshTokens={true}
      cacheLocation="localstorage"
    >
      <Router>
        <AuthProvider>
          <DataProvider>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<Home />} />
                <Route path="register" element={<Register />} />
                <Route
                  path="friends"
                  element={
                    <PrivateRoute>
                      <Friends />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="leaderboard"
                  element={
                    <PrivateRoute>
                      <Leaderboard />
                    </PrivateRoute>
                  }
                />
                <Route path="matches">
                  <Route
                    index
                    element={
                      <PrivateRoute>
                        <MatchesPage />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="create"
                    element={
                      <PrivateRoute>
                        <CreateMatch />
                      </PrivateRoute>
                    }
                  />
                </Route>
              </Route>
            </Routes>
          </DataProvider>
        </AuthProvider>
      </Router>
    </Auth0Provider>
  );
};

export default App; 