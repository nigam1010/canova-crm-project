import React, { useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Layout.css';

const Layout = () => {
  useEffect(() => {
    document.title = 'CanovaCRM - Admin';
  }, []);

  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="logo">
          <h3>Canova<span>CRM</span></h3>
        </div>

        <nav className="nav-menu">
          <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            Dashboard
          </NavLink>
          <NavLink to="/leads" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            Leads
          </NavLink>
          <NavLink to="/employees" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            Employees
          </NavLink>
          <NavLink to="/settings" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            Settings
          </NavLink>
        </nav>

        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
