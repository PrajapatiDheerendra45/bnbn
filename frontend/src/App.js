import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';

// Components
import Layout from './components/layout/Layout';
import HomePage from './pages/HomePage';
import JobsPage from './pages/JobsPage';
import JobDetailPage from './pages/JobDetailPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminJobs from './pages/admin/AdminJobs';

// Employer pages
import EmployerDashboard from './pages/employer/EmployerDashboard';
import EmployerJobs from './pages/employer/EmployerJobs';
import PostJobPage from './pages/employer/PostJobPage';
import EmployerApplications from './pages/employer/EmployerApplications';

// Job Seeker pages
import ApplicationsPage from './pages/jobseeker/ApplicationsPage';
import SavedJobsPage from './pages/jobseeker/SavedJobsPage';

// Protected Route Component
import ProtectedRoute from './components/common/ProtectedRoute';

// Actions
import { setCredentials } from './store/slices/authSlice';

function App() {
  const dispatch = useDispatch();
  const { user, token } = useSelector((state) => state.auth);

  useEffect(() => {
    // Check if user is logged in on app start
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');
    
    if (savedUser && savedToken) {
      dispatch(setCredentials({
        user: JSON.parse(savedUser),
        token: savedToken
      }));
    }
  }, [dispatch]);

  return (
    <div className="App">
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="jobs" element={<JobsPage />} />
          <Route path="jobs/:id" element={<JobDetailPage />} />
          
          {/* Auth Routes */}
          <Route 
            path="login" 
            element={
              !token ? <LoginPage /> : <Navigate to="/dashboard" replace />
            } 
          />
          <Route 
            path="register" 
            element={
              !token ? <RegisterPage /> : <Navigate to="/dashboard" replace />
            } 
          />

          {/* Protected Routes */}
          <Route
            path="dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/users"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminUsers />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/jobs"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminJobs />
              </ProtectedRoute>
            }
          />

          {/* Employer Routes */}
          <Route
            path="employer"
            element={
              <ProtectedRoute allowedRoles={['employer']}>
                <EmployerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="employer/jobs"
            element={
              <ProtectedRoute allowedRoles={['employer']}>
                <EmployerJobs />
              </ProtectedRoute>
            }
          />
          <Route
            path="employer/post-job"
            element={
              <ProtectedRoute allowedRoles={['employer']}>
                <PostJobPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="employer/applications/:jobId?"
            element={
              <ProtectedRoute allowedRoles={['employer']}>
                <EmployerApplications />
              </ProtectedRoute>
            }
          />

          {/* Job Seeker Routes */}
          <Route
            path="applications"
            element={
              <ProtectedRoute allowedRoles={['jobseeker']}>
                <ApplicationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="saved-jobs"
            element={
              <ProtectedRoute allowedRoles={['jobseeker']}>
                <SavedJobsPage />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* 404 Route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;