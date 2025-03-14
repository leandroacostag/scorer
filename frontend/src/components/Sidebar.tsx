import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaHome, FaUserFriends, FaClipboardList, FaTrophy } from 'react-icons/fa';

const Sidebar: React.FC = () => {
  const location = useLocation();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };
  
  // Only 4 navigation items: HOME, FRIENDS, MATCHES, LEADERBOARD
  const navItems = [
    { path: '/', icon: <FaHome />, label: 'HOME' },
    { path: '/friends', icon: <FaUserFriends />, label: 'FRIENDS' },
    { path: '/matches', icon: <FaClipboardList />, label: 'MATCHES' },
    { path: '/leaderboard', icon: <FaTrophy />, label: 'LEADERBOARD' }
  ];
  
  return (
    <aside className="bg-gray-800 text-white w-64 min-h-screen p-4">
      <div className="text-2xl font-bold mb-8 text-center">Match Scorer</div>
      <nav>
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`flex items-center p-3 rounded-lg transition-colors ${
                  isActive(item.path)
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                <span className="mr-3">{item.icon}</span>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar; 