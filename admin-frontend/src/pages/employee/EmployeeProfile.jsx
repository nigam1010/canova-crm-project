import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import './EmployeeProfile.css';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const EmployeeProfile = ({ onBack }) => {
  const { user, logout } = useAuth();
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    password: '',
    confirmPassword: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password && formData.password !== formData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    const updateData = {
      firstName: formData.firstName,
      lastName: formData.lastName
    };

    if (formData.password) {
      updateData.password = formData.password;
    }

    try {
      const response = await fetch(`${API_URL}/users/${user._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        alert('Profile updated successfully');
        setFormData({ ...formData, password: '', confirmPassword: '' });
      }
    } catch (error) {
      alert('Failed to update profile');
    }
  };

  return (
    <div className="employee-profile">
      <div className="page-header-mobile">
        <div className="header-logo-mobile">Canova<span>CRM</span></div>
        <div className="page-title-mobile">
          <span className="back-arrow" onClick={onBack}>‹</span> Profile
        </div>
      </div>

      <div className="employee-content">
        <form onSubmit={handleSubmit} className="profile-form-mobile">
          <div className="form-group-mobile">
            <label className="form-label-mobile">First name</label>
            <input
              type="text"
              className="form-input-mobile"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              required
            />
          </div>

          <div className="form-group-mobile">
            <label className="form-label-mobile">Last name</label>
            <input
              type="text"
              className="form-input-mobile"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              required
            />
          </div>

          <div className="form-group-mobile">
            <label className="form-label-mobile">Email</label>
            <input
              type="email"
              className="form-input-mobile"
              value={formData.email}
              disabled
            />
          </div>

          <div className="form-group-mobile">
            <label className="form-label-mobile">Password</label>
            <input
              type="password"
              className="form-input-mobile"
              placeholder="••••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          <div className="form-group-mobile">
            <label className="form-label-mobile">Confirm Password</label>
            <input
              type="password"
              className="form-input-mobile"
              placeholder="••••••••••"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            />
          </div>

          <div className="profile-actions-mobile">
            <button type="submit" className="btn-save-mobile">Save</button>
            <button type="button" className="btn-logout-mobile" onClick={logout}>Logout</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmployeeProfile;
