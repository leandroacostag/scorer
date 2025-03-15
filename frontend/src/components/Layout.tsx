import React, { ReactNode, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

interface LayoutProps {
  children?: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar toggleSidebar={toggleSidebar} sidebarOpen={sidebarOpen} />
      <main className="md:ml-64 px-4 py-8 pt-24">
        {children || <Outlet />}
      </main>
    </div>
  );
};

export default Layout; 