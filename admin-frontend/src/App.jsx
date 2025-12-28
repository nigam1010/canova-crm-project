import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import Leads from './pages/Leads';
import Settings from './pages/Settings';
import Login from './pages/Login';
import EmployeeLayout from './pages/employee/EmployeeLayout';
import { AuthProvider, useAuth } from './context/AuthContext';

const PrivateRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();

  // Wait for auth to load from localStorage
  if (loading) {
    return null; // Or a loading spinner
  }

  if (!user) return <Navigate to="/login" />;

  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/employee" />;
  }

  if (!adminOnly && user.role === 'admin') {
    return <Navigate to="/dashboard" />;
  }

  return children;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Admin Routes */}
          <Route path="/" element={
            <PrivateRoute adminOnly={true}>
              <Layout />
            </PrivateRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="employees" element={<Employees />} />
            <Route path="leads" element={<Leads />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          {/* Employee Routes */}
          <Route path="/employee" element={
            <PrivateRoute adminOnly={false}>
              <EmployeeLayout />
            </PrivateRoute>
          } />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
