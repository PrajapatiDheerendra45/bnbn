import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Briefcase, 
  FileText, 
  Plus, 
  Users, 
  TrendingUp,
  Calendar,
  MapPin,
  DollarSign
} from 'lucide-react';
import { isAdmin, isEmployer, isJobSeeker } from '../utils/helpers';

const Dashboard = () => {
  const { user } = useAuth();

  const getDashboardContent = () => {
    if (isAdmin(user)) {
      return (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Admin Dashboard</h2>
            <p className="text-gray-600 mb-6">Welcome to the admin panel. Manage users, jobs, and platform settings.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Link
                to="/admin/users"
                className="p-6 border border-gray-200 rounded-lg hover:border-primary-300 hover:shadow-md transition-all"
              >
                <Users className="w-8 h-8 text-primary-600 mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Manage Users</h3>
                <p className="text-gray-600">View and manage all users on the platform</p>
              </Link>
              
              <Link
                to="/admin/jobs"
                className="p-6 border border-gray-200 rounded-lg hover:border-primary-300 hover:shadow-md transition-all"
              >
                <Briefcase className="w-8 h-8 text-primary-600 mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Manage Jobs</h3>
                <p className="text-gray-600">Review and approve job postings</p>
              </Link>
              
              <Link
                to="/admin"
                className="p-6 border border-gray-200 rounded-lg hover:border-primary-300 hover:shadow-md transition-all"
              >
                <TrendingUp className="w-8 h-8 text-primary-600 mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Analytics</h3>
                <p className="text-gray-600">View platform statistics and insights</p>
              </Link>
            </div>
          </div>
        </div>
      );
    }

    if (isEmployer(user)) {
      return (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Employer Dashboard</h2>
            <p className="text-gray-600 mb-6">Welcome back! Manage your job postings and view applications.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Link
                to="/job/post"
                className="p-6 border border-gray-200 rounded-lg hover:border-primary-300 hover:shadow-md transition-all"
              >
                <Plus className="w-8 h-8 text-primary-600 mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Post New Job</h3>
                <p className="text-gray-600">Create a new job posting to attract talent</p>
              </Link>
              
              <Link
                to="/my-jobs"
                className="p-6 border border-gray-200 rounded-lg hover:border-primary-300 hover:shadow-md transition-all"
              >
                <Briefcase className="w-8 h-8 text-primary-600 mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">My Jobs</h3>
                <p className="text-gray-600">Manage your existing job postings</p>
              </Link>
              
              <Link
                to="/profile"
                className="p-6 border border-gray-200 rounded-lg hover:border-primary-300 hover:shadow-md transition-all"
              >
                <Users className="w-8 h-8 text-primary-600 mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Company Profile</h3>
                <p className="text-gray-600">Update your company information</p>
              </Link>
            </div>
          </div>
        </div>
      );
    }

    if (isJobSeeker(user)) {
      return (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Job Seeker Dashboard</h2>
            <p className="text-gray-600 mb-6">Welcome back! Find your next opportunity and track your applications.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Link
                to="/jobs"
                className="p-6 border border-gray-200 rounded-lg hover:border-primary-300 hover:shadow-md transition-all"
              >
                <Briefcase className="w-8 h-8 text-primary-600 mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Browse Jobs</h3>
                <p className="text-gray-600">Search and apply for job opportunities</p>
              </Link>
              
              <Link
                to="/my-applications"
                className="p-6 border border-gray-200 rounded-lg hover:border-primary-300 hover:shadow-md transition-all"
              >
                <FileText className="w-8 h-8 text-primary-600 mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">My Applications</h3>
                <p className="text-gray-600">Track your job applications and status</p>
              </Link>
              
              <Link
                to="/profile"
                className="p-6 border border-gray-200 rounded-lg hover:border-primary-300 hover:shadow-md transition-all"
              >
                <Users className="w-8 h-8 text-primary-600 mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">My Profile</h3>
                <p className="text-gray-600">Update your profile and resume</p>
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Dashboard</h2>
        <p className="text-gray-600">Welcome to your dashboard!</p>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white p-6 rounded-lg">
        <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.name}!</h1>
        <p className="text-primary-100">
          {isAdmin(user) && 'Manage the platform and oversee all activities.'}
          {isEmployer(user) && 'Post jobs and find the perfect candidates for your company.'}
          {isJobSeeker(user) && 'Find your dream job and advance your career.'}
        </p>
      </div>

      {/* Dashboard Content */}
      {getDashboardContent()}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Briefcase className="w-6 h-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Jobs</p>
              <p className="text-2xl font-semibold text-gray-900">0</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <FileText className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Applications</p>
              <p className="text-2xl font-semibold text-gray-900">0</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Calendar className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">This Month</p>
              <p className="text-2xl font-semibold text-gray-900">0</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Success Rate</p>
              <p className="text-2xl font-semibold text-gray-900">0%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;