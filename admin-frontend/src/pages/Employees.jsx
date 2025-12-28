import React, { useState, useEffect } from 'react';
import { userAPI } from '../services/api';
import './Employees.css';

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    location: '',
    language: ''
  });

  // Helper to capitalize first letter of each word
  const toTitleCase = (str) => {
    return str.replace(/\b\w/g, char => char.toUpperCase());
  };

  const handleInputChange = (field, value) => {
    // Apply title case to text fields (not email)
    const titleCaseFields = ['firstName', 'lastName', 'location', 'language'];
    const newValue = titleCaseFields.includes(field) ? toTitleCase(value) : value;
    setFormData({ ...formData, [field]: newValue });
  };

  useEffect(() => {
    fetchEmployees();

    // Poll every 5 seconds for real-time status updates
    const interval = setInterval(() => {
      fetchEmployees(true);
    }, 5000);

    return () => clearInterval(interval);
  }, [currentPage]);

  const fetchEmployees = async (isBackground = false) => {
    try {
      if (!isBackground) {
        setLoading(true);
      }
      const response = await userAPI.getAll(currentPage, 8);
      setEmployees(response.users);
      setTotalPages(response.pages);
    } catch (error) {
      console.error('Failed to fetch employees:', error);
    } finally {
      if (!isBackground) {
        setLoading(false);
      }
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(employees.map(emp => emp._id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleAddEmployee = () => {
    setEditingEmployee(null);
    setFormData({ firstName: '', lastName: '', email: '', location: '', language: '' });
    setShowModal(true);
  };

  const handleEditEmployee = (employee) => {
    setEditingEmployee(employee);
    setFormData({
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      location: employee.location,
      language: employee.language
    });
    setShowModal(true);
  };

  const handleDeleteOne = async (id) => {
    if (confirm('Are you sure you want to delete this employee?')) {
      try {
        await userAPI.delete(id);
        fetchEmployees();
      } catch (error) {
        alert('Failed to delete employee');
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) {
      alert('Please select employees to delete');
      return;
    }
    setShowDeleteModal(true);
  };

  const confirmBulkDelete = async () => {
    try {
      await userAPI.bulkDelete(selectedIds);
      setSelectedIds([]);
      setShowDeleteModal(false);
      fetchEmployees();
    } catch (error) {
      alert('Failed to delete employees');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingEmployee) {
        await userAPI.update(editingEmployee._id, {
          firstName: formData.firstName,
          lastName: formData.lastName,
          location: formData.location
        });
      } else {
        await userAPI.create(formData);
      }
      setShowModal(false);
      fetchEmployees();
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Unknown error';
      alert(editingEmployee ? `Failed to update employee: ${errorMessage}` : `Failed to create employee: ${errorMessage}`);
    }
  };

  const filteredEmployees = employees.filter(employee =>
    `${employee.firstName} ${employee.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="employees-page">
      <div className="search-section">
        <div className="search-box">
          <img src="/src/assets/search.svg" alt="Search" />
          <input
            type="text"
            placeholder="Search here..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="breadcrumb">
        <span>Home</span> &gt; <span>Employees</span>
      </div>

      <div className="page-header">
        <button className="btn-primary" onClick={handleAddEmployee}>
          Add Employees
        </button>
      </div>

      <div className="employees-table-container">
        {selectedIds.length > 0 && (
          <div className="bulk-actions">
            <button onClick={handleBulkDelete} className="btn-delete">
              Delete Selected ({selectedIds.length})
            </button>
          </div>
        )}

        <table className="employees-table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={employees.length > 0 && selectedIds.length === employees.length}
                  onChange={handleSelectAll}
                />
              </th>
              <th>Name</th>
              <th>Employee ID</th>
              <th>Assigned Leads</th>
              <th>Closed Leads</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredEmployees.map((employee) => (
              <tr key={employee._id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(employee._id)}
                    onChange={() => handleSelectOne(employee._id)}
                  />
                </td>
                <td>
                  <div className="employee-info">
                    <div className="employee-avatar">
                      {employee.firstName.charAt(0)}{employee.lastName.charAt(0)}
                    </div>
                    <div>
                      <div className="employee-name">{employee.firstName} {employee.lastName}</div>
                      <div className="employee-email">{employee.email}</div>
                    </div>
                  </div>
                </td>
                <td><span className="id-badge">{employee.employeeId}</span></td>
                <td>{employee.assignedLeads || 0}</td>
                <td>{employee.closedLeads || 0}</td>
                <td>
                  <span className={`status-badge ${employee.timingStatus === 'Active' ? 'active' : 'inactive'}`}>
                    <span className="status-dot"></span>
                    {employee.timingStatus || 'Inactive'}
                  </span>
                </td>
                <td>
                  <div className="actions-menu">
                    <button
                      className="btn-menu"
                      onClick={() => setOpenMenuId(openMenuId === employee._id ? null : employee._id)}
                    >
                      ⋮
                    </button>
                    {openMenuId === employee._id && (
                      <div className="dropdown-menu">
                        <button onClick={() => { handleEditEmployee(employee); setOpenMenuId(null); }}>
                          <img src="/src/assets/edit.svg" alt="Edit" className="icon" /> Edit
                        </button>
                        <button onClick={() => { handleDeleteOne(employee._id); setOpenMenuId(null); }}>
                          <img src="/src/assets/delete.svg" alt="Delete" className="icon" /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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

      {
        showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content employee-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{editingEmployee ? 'Edit Employee' : 'Add New Employee'}</h2>
                <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>First name</label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Last name</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
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
                    disabled={!!editingEmployee}
                  />
                </div>
                <div className="form-group">
                  <label>Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="label-with-tooltip">
                    Preferred Language
                    <div className="tooltip-container">
                      <span className="info-icon">ⓘ</span>
                      <span className="tooltip-text">Lead will be assigned on biases on language</span>
                    </div>
                  </label>
                  <input
                    type="text"
                    value={formData.language}
                    onChange={(e) => handleInputChange('language', e.target.value)}
                    required
                  />
                </div>
                <div className="modal-footer">
                  <button type="submit" className="btn-save">Save</button>
                </div>
              </form>
            </div>
          </div>
        )
      }

      {
        showDeleteModal && (
          <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
            <div className="modal-content small" onClick={(e) => e.stopPropagation()}>
              <h3>Confirm Delete</h3>
              <p>Are you sure you want to delete {selectedIds.length} employee(s)?</p>
              <div className="modal-actions">
                <button onClick={() => setShowDeleteModal(false)} className="btn-cancel">Cancel</button>
                <button onClick={confirmBulkDelete} className="btn-delete">Delete</button>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
};

export default Employees;
