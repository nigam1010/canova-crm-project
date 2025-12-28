import React, { useState, useEffect } from 'react';
import { leadAPI } from '../../services/api';
import './EmployeeLeads.css';

const EmployeeLeads = ({ onBack }) => {
  const [leads, setLeads] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLead, setSelectedLead] = useState(null);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [scheduleData, setScheduleData] = useState({ date: '', time: '' });

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/leads/my-leads', {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setLeads(data);
      }
    } catch (error) {
      console.error('Failed to fetch leads:', error);
    }
  };

  const filteredLeads = leads.filter(lead =>
    lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'long', day: '2-digit', year: 'numeric' });
  };

  const getTypeColor = (type) => {
    if (!type) return '#00d4ff';
    switch (type.toLowerCase()) {
      case 'hot': return '#ff6b35';
      case 'warm': return '#ffc107';
      case 'cold': return '#00d4ff';
      default: return '#00d4ff';
    }
  };

  const getStatusColor = (status, type) => {
    if (status?.toLowerCase() === 'closed') return '#d4a574';
    return getTypeColor(type);
  };

  const handleTypeClick = (lead) => {
    setSelectedLead(lead);
    setShowTypeModal(true);
  };

  const handleScheduleClick = (lead) => {
    setSelectedLead(lead);
    setScheduleData({ date: '', time: '' });
    setShowScheduleModal(true);
  };

  const handleStatusClick = (lead) => {
    setSelectedLead(lead);
    setShowStatusModal(true);
  };

  const updateType = async (type) => {
    try {
      const response = await fetch(`http://localhost:5000/api/leads/${selectedLead._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        },
        body: JSON.stringify({ type })
      });
      if (response.ok) {
        fetchLeads();
        setShowTypeModal(false);
      }
    } catch (error) {
      alert('Failed to update type');
    }
  };

  const updateSchedule = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/leads/${selectedLead._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        },
        body: JSON.stringify({
          scheduledDate: scheduleData.date,
          scheduledTime: scheduleData.time
        })
      });
      if (response.ok) {
        fetchLeads();
        setShowScheduleModal(false);
      }
    } catch (error) {
      alert('Failed to update schedule');
    }
  };

  const updateStatus = async (status) => {
    try {
      const response = await fetch(`http://localhost:5000/api/leads/${selectedLead._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        },
        body: JSON.stringify({ status })
      });
      if (response.ok) {
        fetchLeads();
        setShowStatusModal(false);
      }
    } catch (error) {
      alert('Failed to update status');
    }
  };

  return (
    <div className="employee-leads">
      <div className="page-header-mobile">
        <div className="header-logo-mobile">Canova<span>CRM</span></div>
        <div className="page-title-mobile">
          <span className="back-arrow" onClick={onBack}>‹</span> Leads
        </div>
      </div>

      <div className="employee-content">
        <div className="search-bar-mobile">
          <img src="/src/assets/employee_search.svg" alt="Search" className="search-icon-mobile" />
          <input
            type="text"
            placeholder="Search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="leads-list-mobile">
          {filteredLeads.map(lead => (
            <div
              key={lead._id}
              className={`lead-card-mobile ${lead.status?.toLowerCase() === 'closed' ? 'closed' : ''}`}
              style={{ '--type-color': getTypeColor(lead.type) }}
            >
              <div className="lead-header-mobile">
                <div>
                  <div className="lead-name-mobile">{lead.name}</div>
                  <div className="lead-email-mobile">@{lead.email}</div>
                </div>
                <div
                  className="lead-status-circle"
                  style={{ borderColor: getStatusColor(lead.status, lead.type) }}
                >
                  <span>{lead.status || 'Ongoing'}</span>
                </div>
              </div>

              <div className="lead-footer-mobile">
                <div className="lead-date-mobile">
                  <img src="/src/assets/calendar-emp.svg" alt="Date" />
                  <span>{formatDate(lead.date)}</span>
                </div>
                <div className="lead-actions-mobile">
                  <button className="action-btn-circle" onClick={() => handleTypeClick(lead)}>
                    <img src="/src/assets/type.svg" alt="Type" />
                  </button>
                  <button className="action-btn-circle" onClick={() => handleScheduleClick(lead)}>
                    <img src="/src/assets/schedule.svg" alt="Schedule" />
                  </button>
                  <button className="action-btn-circle" onClick={() => handleStatusClick(lead)}>
                    <img src="/src/assets/status.svg" alt="Status" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Type Modal */}
      {showTypeModal && (
        <div className="modal-overlay" onClick={() => setShowTypeModal(false)}>
          <div className="popup-modal" onClick={e => e.stopPropagation()}>
            <div className="popup-title">Type</div>
            <div className="popup-options">
              <button className="type-btn hot" onClick={() => updateType('Hot')}>Hot</button>
              <button className="type-btn warm" onClick={() => updateType('Warm')}>Warm</button>
              <button className="type-btn cold" onClick={() => updateType('Cold')}>Cold</button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="modal-overlay" onClick={() => setShowScheduleModal(false)}>
          <div className="popup-modal" onClick={e => e.stopPropagation()}>
            <div className="popup-title">Date</div>
            <input
              type="date"
              className="popup-input"
              value={scheduleData.date}
              onChange={(e) => setScheduleData({ ...scheduleData, date: e.target.value })}
            />
            <div className="popup-title" style={{ marginTop: '12px' }}>Time</div>
            <input
              type="time"
              className="popup-input"
              value={scheduleData.time}
              onChange={(e) => setScheduleData({ ...scheduleData, time: e.target.value })}
            />
            <button className="popup-save-btn" onClick={updateSchedule}>Save</button>
          </div>
        </div>
      )}

      {/* Status Modal */}
      {showStatusModal && (
        <div className="modal-overlay" onClick={() => setShowStatusModal(false)}>
          <div className="popup-modal" onClick={e => e.stopPropagation()}>
            <div className="popup-header">
              <span className="popup-title">Lead Status</span>
              <span className="popup-info" title={selectedLead?.scheduledDate || selectedLead?.scheduledTime ? "Lead can not be closed if scheduled" : ""}>ⓘ</span>
            </div>
            <div className="popup-options-status">
              <button
                className={`status-option ${selectedLead?.status !== 'Closed' ? 'active' : ''}`}
                onClick={() => updateStatus('Ongoing')}
              >
                Ongoing
              </button>
              {!(selectedLead?.scheduledDate || selectedLead?.scheduledTime) && (
                <button
                  className={`status-option ${selectedLead?.status === 'Closed' ? 'active' : ''}`}
                  onClick={() => updateStatus('Closed')}
                >
                  Closed
                </button>
              )}
            </div>
            <button className="popup-save-btn" onClick={() => setShowStatusModal(false)}>Save</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeLeads;
