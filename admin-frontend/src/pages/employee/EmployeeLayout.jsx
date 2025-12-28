import React, { useEffect } from 'react';
import { Navigate, Routes, Route } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import EmployeeHome from './EmployeeHome';
import EmployeeLeads from './EmployeeLeads';
import EmployeeSchedule from './EmployeeSchedule';
import EmployeeProfile from './EmployeeProfile';
import { home, leads, calendar, profile } from '../../assets';
import './EmployeeLayout.css';

const EmployeeLayout = () => {
  useEffect(() => {
    document.title = 'CanovaCRM - Employee';
  }, []);

  const { user } = useAuth();
  const [activePage, setActivePage] = React.useState('home');

  if (!user || user.role === 'admin') {
    return <Navigate to="/dashboard" />;
  }

  return (
    <div className="employee-layout">
      <div className="employee-pages">
        {activePage === 'home' && <EmployeeHome />}
        {activePage === 'leads' && <EmployeeLeads onBack={() => setActivePage('home')} />}
        {activePage === 'schedule' && <EmployeeSchedule onBack={() => setActivePage('home')} />}
        {activePage === 'profile' && <EmployeeProfile onBack={() => setActivePage('home')} />}
      </div>

      <div className="bottom-nav">
        <button
          className={`nav-item ${activePage === 'home' ? 'active' : ''}`}
          onClick={() => setActivePage('home')}
        >
          <img src={home} alt="Home" className="nav-icon" />
          <div className="nav-label">Home</div>
        </button>
        <button
          className={`nav-item ${activePage === 'leads' ? 'active' : ''}`}
          onClick={() => setActivePage('leads')}
        >
          <img src={leads} alt="Leads" className="nav-icon" />
          <div className="nav-label">Leads</div>
        </button>
        <button
          className={`nav-item ${activePage === 'schedule' ? 'active' : ''}`}
          onClick={() => setActivePage('schedule')}
        >
          <img src={calendar} alt="Schedule" className="nav-icon" />
          <div className="nav-label">Schedule</div>
        </button>
        <button
          className={`nav-item ${activePage === 'profile' ? 'active' : ''}`}
          onClick={() => setActivePage('profile')}
        >
          <img src={profile} alt="Profile" className="nav-icon" />
          <div className="nav-label">Profile</div>
        </button>
      </div>
    </div>
  );
};

export default EmployeeLayout;
