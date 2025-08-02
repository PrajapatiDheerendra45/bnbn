import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

// Public pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import JobList from './pages/JobList';
import JobDetail from './pages/JobDetail';

// Protected pages
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import JobPost from './pages/JobPost';
import JobEdit from './pages/JobEdit';
import MyJobs from './pages/MyJobs';
import MyApplications from './pages/MyApplications';
import JobApplicants from './pages/JobApplicants';

// Admin pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminJobs from './pages/admin/Jobs';

function App() {
  const { user } = useAuth();

  return (
    <Layout>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/jobs" element={<JobList />} />
        <Route path="/jobs/:id" element={<JobDetail />} />

        {/* Protected routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />
        <Route path="/job/post" element={
          <ProtectedRoute allowedRoles={['employer']}>
            <JobPost />
          </ProtectedRoute>
        } />
        <Route path="/job/edit/:id" element={
          <ProtectedRoute allowedRoles={['employer']}>
            <JobEdit />
          </ProtectedRoute>
        } />
        <Route path="/my-jobs" element={
          <ProtectedRoute allowedRoles={['employer']}>
            <MyJobs />
          </ProtectedRoute>
        } />
        <Route path="/my-applications" element={
          <ProtectedRoute allowedRoles={['jobseeker']}>
            <MyApplications />
          </ProtectedRoute>
        } />
        <Route path="/job/:id/applicants" element={
          <ProtectedRoute allowedRoles={['employer']}>
            <JobApplicants />
          </ProtectedRoute>
        } />

        {/* Admin routes */}
        <Route path="/admin" element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        } />
        <Route path="/admin/users" element={
          <AdminRoute>
            <AdminUsers />
          </AdminRoute>
        } />
        <Route path="/admin/jobs" element={
          <AdminRoute>
            <AdminJobs />
          </AdminRoute>
        } />
      </Routes>
    </Layout>
  );
}

export default App;