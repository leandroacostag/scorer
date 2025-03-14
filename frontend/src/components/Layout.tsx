import React, { ReactNode, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { useAuth } from '../contexts';
import { FaHome, FaUserFriends, FaFutbol, FaTrophy, FaSignOutAlt, FaSignInAlt, FaUser } from 'react-icons/fa';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  // eslint-disable-next-line
  const { isAuthenticated, loginWithRedirect, logout, user: auth0User } = useAuth0();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Redirect to registration if authenticated but no username
  useEffect(() => {
    if (isAuthenticated && !user?.username && location.pathname !== '/register') {
      navigate('/register');
    }
  }, [isAuthenticated, user, location.pathname, navigate]);

  const navItems = [
    { path: '/', label: 'Home', icon: <FaHome /> },
    { path: '/friends', label: 'Friends', icon: <FaUserFriends />, auth: true },
    { path: '/matches', label: 'Matches', icon: <FaFutbol />, auth: true },
    { path: '/leaderboard', label: 'Leaderboard', icon: <FaTrophy />, auth: true },
  ];

  // Only show nav items if user has completed registration
  const showNavItems = !isAuthenticated || (isAuthenticated && user?.username);

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <header className="bg-green-700 text-white shadow-md">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="text-xl font-bold">Scorer</Link>
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <div className="flex items-center space-x-2">
                  <FaUser className="text-lg" />
                  <span className="hidden md:inline">
                    {user?.username || 'Set up username'}
                  </span>
                </div>
                <button 
                  onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
                  className="flex items-center space-x-1 bg-red-600 hover:bg-red-700 px-3 py-1 rounded"
                >
                  <FaSignOutAlt />
                  <span className="hidden md:inline">Logout</span>
                </button>
              </>
            ) : (
              <button 
                onClick={() => loginWithRedirect()}
                className="flex items-center space-x-1 bg-green-600 hover:bg-green-800 px-3 py-1 rounded"
              >
                <FaSignInAlt />
                <span>Login</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {showNavItems && (
          <nav className="w-16 md:w-64 bg-gray-800 text-white">
            <div className="py-6 px-2 md:px-6">
              <ul className="space-y-2">
                {navItems.map((item) => {
                  if (item.auth && !isAuthenticated) return null;
                  return (
                    <li key={item.path}>
                      <Link
                        to={item.path}
                        className={`flex items-center space-x-2 p-2 rounded hover:bg-gray-700 ${
                          location.pathname === item.path ? 'bg-gray-700' : ''
                        }`}
                      >
                        <span className="text-xl">{item.icon}</span>
                        <span className="hidden md:inline">{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          </nav>
        )}

        <main className="flex-1 p-4 md:p-8">
          {children}
        </main>
      </div>

      <footer className="bg-gray-800 text-white py-4">
        <div className="container mx-auto px-4 text-center">
          <p>© {new Date().getFullYear()} Scorer</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout; 