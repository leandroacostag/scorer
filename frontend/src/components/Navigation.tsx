import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';

const Navigation: React.FC = () => {
  const { loginWithRedirect, logout, isAuthenticated } = useAuth0();

  return (
    <nav>
      <Link to="/">Home</Link>
      {isAuthenticated ? (
        <>
          <Link to="/friends">Friends</Link>
          <Link to="/matches">Matches</Link>
          <Link to="/validation">Validation</Link>
          <Link to="/leaderboard">Leaderboard</Link>
          <button onClick={() => logout()}>Logout</button>
        </>
      ) : (
        <button onClick={() => loginWithRedirect()}>Login</button>
      )}
    </nav>
  );
};

export default Navigation; 