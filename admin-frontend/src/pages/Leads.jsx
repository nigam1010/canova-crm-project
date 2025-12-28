import React, { useState, useEffect } from 'react';
import { leadAPI, userAPI } from '../services/api';
import { search, upload } from '../assets';
import './Leads.css';

const Leads = () => {
  const [leads, setLeads] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [showManualModal, setShowManualModal] = useState(false);
  const [showCSVModal, setShowCSVModal] = useState(false);
  const [csvFile, setCSVFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dragActive, setDragActive] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const itemsPerPage = 10;

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    source: '',
    date: '',
    location: '',
    language: ''
  });

  // Helper to capitalize first letter of each word
  const toTitleCase = (str) => {
    return str.replace(/\b\w/g, char => char.toUpperCase());
  };

  const handleInputChange = (field, value) => {
    // Apply title case to text fields (not email or date)
    const titleCaseFields = ['name', 'source', 'location', 'language'];
    const newValue = titleCaseFields.includes(field) ? toTitleCase(value) : value;
    setFormData({ ...formData, [field]: newValue });
  };

  useEffect(() => {
    fetchLeads();
    fetchEmployees();
  }, []);

  const fetchLeads = async () => {
    try {
      const data = await leadAPI.getAll();
      setLeads(data);
    } catch (error) {
      console.error('Failed to fetch leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const data = await userAPI.getAll(1, 100); // Get all employees
      setEmployees(data.users.filter(u => u.role === 'sales'));
    } catch (error) {
      console.error('Failed to fetch employees:', error);
    }
  };

  const handleAssignLead = async (leadId, userId) => {
    try {
      await leadAPI.assignLead(leadId, userId);
      fetchLeads(); // Refresh leads list
    } catch (error) {
      alert('Failed to assign lead');
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    try {
      await leadAPI.create(formData);
      setShowManualModal(false);
      setFormData({ name: '', email: '', source: '', date: '', location: '', language: '' });
      fetchLeads();
    } catch (error) {
      alert('Failed to create lead');
    }
  };

  const handleCSVUpload = async () => {
    if (!csvFile) {
      alert('Please select a CSV file');
      return;
    }

    setUploading(true);

    // Show verifying animation for a brief moment, then upload
    setTimeout(async () => {
      try {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const csvContent = e.target.result;
          await leadAPI.uploadCSV(csvContent);
          setShowCSVModal(false);
          setCSVFile(null);
          setUploading(false);
          fetchLeads();
        };
        reader.readAsText(csvFile);
      } catch (error) {
        alert('Failed to upload CSV');
        setUploading(false);
      }
    }, 1500);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        setCSVFile(file);
      } else {
        alert('Please upload a CSV file');
      }
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB');
  };

  // Filter leads
  const filteredLeads = leads.filter(lead =>
    lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (lead.location && lead.location.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="leads-page">
      <div className="search-section">
        <div className="search-box">
          <img src={search} alt="Search" />
          <input
            type="text"
            placeholder="Search here..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1); // Reset to page 1 on search
            }}
          />
        </div>
      </div>

      <div className="breadcrumb">
        <span>Home</span> &gt; <span>Leads</span>
      </div>

      <div className="page-header">
        <button className="btn-secondary" onClick={() => setShowManualModal(true)}>
          Add Manually
        </button>
        <button className="btn-secondary" onClick={() => setShowCSVModal(true)}>
          Add CSV
        </button>
      </div>

      <div className="leads-table-container">
        <table className="leads-table">
          <thead>
            <tr>
              <th>No.</th>
              <th>Name</th>
              <th>Email</th>
              <th>Source</th>
              <th>Date</th>
              <th>Location</th>
              <th>Language</th>
              <th>Assigned To</th>
              <th>Status</th>
              <th>Type</th>
              <th>Scheduled Date</th>
            </tr>
          </thead>
          <tbody>
            {(() => {
              const totalPages = Math.ceil(filteredLeads.length / itemsPerPage);
              const startIndex = (currentPage - 1) * itemsPerPage;
              const paginatedLeads = filteredLeads.slice(startIndex, startIndex + itemsPerPage);
              return paginatedLeads.map((lead, index) => (
                <tr key={lead._id}>
                  <td>{startIndex + index + 1}</td>
                  <td>{lead.name}</td>
                  <td>{lead.email}</td>
                  <td>{lead.source}</td>
                  <td>{formatDate(lead.date)}</td>
                  <td>{lead.location}</td>
                  <td>{lead.language}</td>
                  <td>
                    {lead.assignedTo ? (
                      <span className="assigned-badge">
                        {lead.assignedTo}
                      </span>
                    ) : (
                      <select
                        className="assign-dropdown"
                        onChange={(e) => handleAssignLead(lead._id, e.target.value)}
                        defaultValue=""
                      >
                        <option value="" disabled>Select...</option>
                        {employees.map(emp => (
                          <option key={emp._id} value={emp._id}>
                            {emp.firstName} {emp.lastName}
                          </option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td>
                    <span className={`status-badge ${lead.status.toLowerCase()}`}>
                      {lead.status}
                    </span>
                  </td>
                  <td>{lead.type || '-'}</td>
                  <td>{lead.scheduledDate ? formatDate(lead.scheduledDate) : '-'}</td>
                </tr>
              ));
            })()}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {(() => {
        const totalPages = Math.ceil(filteredLeads.length / itemsPerPage);
        if (totalPages <= 1) return null;
        return (
          <div className="pagination">
            <button
              className="pagination-btn"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              ← Previous
            </button>

            <div className="pagination-center">
              {(() => {
                let pages = [];
                if (totalPages <= 7) {
                  pages = [...Array(totalPages)].map((_, i) => i + 1);
                } else {
                  pages = [1, 2, 3, totalPages - 2, totalPages - 1, totalPages];
                  if (currentPage > 3 && currentPage < totalPages - 2) {
                    pages.push(currentPage - 1, currentPage, currentPage + 1);
                  }
                }

                // Deduplicate and sort
                const uniquePages = [...new Set(pages)].map(Number).sort((a, b) => a - b)
                  .filter(p => p > 0 && p <= totalPages);

                const rendered = [];
                for (let i = 0; i < uniquePages.length; i++) {
                  const pageNum = uniquePages[i];
                  if (i > 0 && pageNum - uniquePages[i - 1] > 1) {
                    rendered.push(<span key={`dots-${i}`} className="pagination-dots">...</span>);
                  }
                  rendered.push(
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`pagination-number ${currentPage === pageNum ? 'active' : ''}`}
                    >
                      {pageNum}
                    </button>
                  );
                }
                return rendered;
              })()}
            </div>

            <button
              className="pagination-btn"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next →
            </button>
          </div>
        );
      })()}
      {/* Manual Add Modal */}
      {showManualModal && (
        <div className="modal-overlay" onClick={() => setShowManualModal(false)}>
          <div className="modal-content leads-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New Lead</h2>
              <button className="close-btn" onClick={() => setShowManualModal(false)}>×</button>
            </div>
            <form onSubmit={handleManualSubmit}>
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Source</label>
                <input
                  type="text"
                  value={formData.source}
                  onChange={(e) => handleInputChange('source', e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Preferred Language</label>
                <input
                  type="text"
                  value={formData.language}
                  onChange={(e) => handleInputChange('language', e.target.value)}
                />
              </div>
              <div className="modal-footer">
                <button type="submit" className="btn-save">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Upload Modal */}
      {showCSVModal && (
        <div className="modal-overlay" onClick={() => !uploading && setShowCSVModal(false)}>
          <div className="modal-content csv-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>CSV Upload</h2>
              <button className="close-btn" onClick={() => !uploading && setShowCSVModal(false)}>×</button>
            </div>
            <p className="csv-subtitle">Add your documents here</p>

            <div
              className={`csv-upload-area ${uploading ? 'verifying' : ''} ${dragActive ? 'drag-active' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {uploading ? (
                <>
                  <div className="spinner"></div>
                  <p className="verifying-text">Verifying...</p>
                  <button
                    onClick={() => {
                      setUploading(false);
                      setCSVFile(null);
                    }}
                    className="btn-cancel verifying-cancel"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <div className="upload-icon"><img src={upload} alt="Upload Icon" /></div>
                  <p>Drag your file(s) to start uploading</p>
                  <p className="or-text">OR</p>
                  <label className="browse-btn">
                    Browse files
                    <input
                      type="file"
                      accept=".csv"
                      onChange={(e) => setCSVFile(e.target.files[0])}
                      style={{ display: 'none' }}
                    />
                  </label>
                  {csvFile && (
                    <div className="file-row">
                      <span className="file-text">{csvFile.name}</span>
                      <button
                        className="file-remove"
                        onClick={() => setCSVFile(null)}
                        type="button"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="modal-actions">
              <button
                onClick={() => {
                  if (uploading) {
                    setUploading(false);
                    setCSVFile(null);
                  } else {
                    setShowCSVModal(false);
                  }
                }}
                className="btn-cancel"
                disabled={uploading}
              >
                Cancel
              </button>
              {!uploading && (
                <button onClick={handleCSVUpload} className="btn-upload" disabled={!csvFile}>
                  Upload
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leads;
