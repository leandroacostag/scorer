import React, { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { useAuth } from '../contexts';
import { FaHome, FaUserFriends, FaFutbol, FaTrophy, FaSignOutAlt, FaSignInAlt, FaUser, FaSpinner, FaBars, FaTimes } from 'react-icons/fa';

interface NavbarProps {
  toggleSidebar: () => void;
  sidebarOpen: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ toggleSidebar, sidebarOpen }) => {
  const { loginWithRedirect, logout } = useAuth0();
  const { user, isAuthenticated, isLoading } = useAuth();
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
    <>
      <header className="bg-green-700 text-white shadow-md fixed top-0 left-0 right-0 z-20">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <button 
              onClick={toggleSidebar} 
              className="mr-3 md:hidden text-white focus:outline-none"
            >
              {sidebarOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
            </button>
            <Link to="/" className="text-xl font-bold">Scorer</Link>
          </div>
          <div className="flex items-center space-x-4">
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <FaSpinner className="animate-spin text-lg" />
                <span className="hidden md:inline">Loading...</span>
              </div>
            ) : isAuthenticated ? (
              <>
                <div className="flex items-center space-x-2">
                  <FaUser className="text-lg" />
                  <span className="hidden md:inline">
                    {user?.username || 'User'}
                  </span>
                </div>
                <button
                  onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
                  className="flex items-center space-x-1 bg-green-600 hover:bg-green-800 px-3 py-1 rounded"
                >
                  <FaSignOutAlt />
                  <span>Logout</span>
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

      {showNavItems && (
        <nav className={`w-64 bg-gray-800 text-white fixed left-0 top-16 bottom-0 z-10 transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}>
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
                      onClick={() => {
                        if (window.innerWidth < 768) {
                          toggleSidebar();
                        }
                      }}
                    >
                      <span className="text-xl">{item.icon}</span>
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>
      )}
      
      {/* Overlay to close sidebar when clicked outside */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-0 md:hidden"
          onClick={toggleSidebar}
        ></div>
      )}
    </>
  );
};

export default Navbar; 