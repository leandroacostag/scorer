import React from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from './Sidebar';
import { FaSignOutAlt } from 'react-icons/fa';

const Layout: React.FC = () => {
  const auth = useAuth();
  
  // If auth.user is null, handle it
  if (!auth.user) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1">
        <header className="bg-white shadow p-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold">Welcome, {auth.user.username}</h1>
          <button
            onClick={() => auth.signOut ? auth.signOut() : null}
            className="flex items-center text-red-600 hover:text-red-800"
          >
            <FaSignOutAlt className="mr-2" />
            Logout
          </button>
        </header>
        <main className="p-6">
          {auth.user && (
            <Outlet />
          )}
        </main>
      </div>
    </div>
  );
};

export default Layout; 