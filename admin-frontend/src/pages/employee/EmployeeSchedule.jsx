import React, { useState, useEffect } from 'react';
import { employeeSearch, filter, ping, profile } from '../../assets';
import './EmployeeSchedule.css';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const EmployeeSchedule = ({ onBack }) => {
  const [schedules, setSchedules] = useState([]);
  const [filter, setFilter] = useState('All');
  const [showFilter, setShowFilter] = useState(false);

  useEffect(() => {
    fetchSchedules();
  }, [filter]);

  const fetchSchedules = async () => {
    try {
      const response = await fetch(`${API_URL}/leads/scheduled?filter=${filter}`, {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setSchedules(data);
      }
    } catch (error) {
      console.error('Failed to fetch schedules:', error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB');
  };

  return (
    <div className="employee-schedule">
      <div className="page-header-mobile">
        <div className="header-logo-mobile">Canova<span>CRM</span></div>
        <div className="page-title-mobile">
          <span className="back-arrow" onClick={onBack}>‹</span> Schedule
        </div>
      </div>

      <div className="employee-content">
        <div className="schedule-header-mobile">
          <div className="search-bar-mobile">
            <img src={employeeSearch} alt="Search" className="search-icon-mobile" />
            <input type="text" placeholder="Search" />
          </div>
          <button className="filter-btn-mobile" onClick={() => setShowFilter(!showFilter)}>
            <img src={filter} alt="Filter" />
          </button>
        </div>

        {showFilter && (
          <div className="filter-modal">
            <div className="filter-title">Filter</div>
            <select value={filter} onChange={(e) => { setFilter(e.target.value); setShowFilter(false); }}>
              <option value="Today">Today</option>
              <option value="All">All</option>
            </select>
            <button className="btn-save" onClick={() => setShowFilter(false)}>Save</button>
          </div>
        )}

        <div className="schedule-list-mobile">
          {schedules.map((schedule, index) => (
            <div key={schedule._id} className={`schedule-card-mobile ${index > 0 ? 'inactive' : ''}`}>
              <div className="schedule-header">
                <div className="schedule-source-label">{schedule.source || 'Referral'}</div>
                <div className="schedule-date-section">
                  <span className="date-label">Date</span>
                  <span className="date-value">{new Date(schedule.scheduledDate || schedule.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' })}</span>
                </div>
              </div>

              <div className="schedule-contact-info">
                <div className="schedule-email">{schedule.email}</div>
              </div>

              <div className="schedule-info">
                <div className="schedule-info-row">
                  <img src={ping} alt="Type" className="schedule-icon" />
                  <span>{schedule.type || 'Call'}</span>
                </div>
                <div className="schedule-info-row">
                  <img src={profile} alt="Person" className="schedule-icon" />
                  <span>{schedule.name}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EmployeeSchedule;
