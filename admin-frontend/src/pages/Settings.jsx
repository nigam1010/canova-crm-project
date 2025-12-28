import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { userAPI } from '../services/api';
import './Settings.css';

const Settings = () => {
  const { user, logout } = useAuth();
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    password: '',
    confirmPassword: ''
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (formData.password && formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      const updateData = {
        firstName: formData.firstName,
        lastName: formData.lastName
      };

      if (formData.password) {
        updateData.password = formData.password;
      }

      await userAPI.update(user._id, updateData);
      setMessage('Profile updated successfully');

      // Update local storage
      const updatedUser = { ...user, firstName: formData.firstName, lastName: formData.lastName };
      sessionStorage.setItem('user', JSON.stringify(updatedUser));

      // Clear password fields
      setFormData({ ...formData, password: '', confirmPassword: '' });
    } catch (err) {
      setError('Failed to update profile');
    }
  };

  return (
    <div className="settings-page">
      <div className="search">
      </div>
      <div className="breadcrumb">
        <span>Home</span> &gt; <span>Settings</span>
      </div>

      <div className="settings-container">
        <h2>Edit Profile</h2>
        <div class="settings-title-separator"></div>

        <form onSubmit={handleSubmit} className="settings-form">
          <div className="form-group">
            <label>First name</label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Last name</label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={formData.email}
              disabled
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Leave blank to keep current password"
            />
          </div>

          <div className="form-group">
            <label>Confirm Password</label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              placeholder="Confirm new password"
            />
          </div>

          {message && <div className="success-message">{message}</div>}
          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="btn-save-settings">Save</button>
        </form>
      </div>
    </div>
  );
};

export default Settings;
