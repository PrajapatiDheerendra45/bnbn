import { format, formatDistanceToNow } from 'date-fns';

// Format date
export const formatDate = (date, formatStr = 'MMM dd, yyyy') => {
  if (!date) return '';
  return format(new Date(date), formatStr);
};

// Format relative time
export const formatRelativeTime = (date) => {
  if (!date) return '';
  return formatDistanceToNow(new Date(date), { addSuffix: true });
};

// Format salary
export const formatSalary = (min, max, currency = 'USD', period = 'yearly') => {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  const minFormatted = formatter.format(min);
  const maxFormatted = formatter.format(max);
  
  const periodText = period === 'yearly' ? 'year' : period === 'monthly' ? 'month' : period;
  
  return `${minFormatted} - ${maxFormatted} per ${periodText}`;
};

// Format file size
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Get status badge color
export const getStatusColor = (status) => {
  switch (status) {
    case 'active':
    case 'applied':
    case 'shortlisted':
    case 'offered':
      return 'success';
    case 'pending':
    case 'reviewing':
    case 'interviewed':
      return 'warning';
    case 'closed':
    case 'rejected':
    case 'withdrawn':
      return 'danger';
    default:
      return 'gray';
  }
};

// Get experience level text
export const getExperienceText = (experience) => {
  switch (experience) {
    case 'Fresher':
      return 'Entry Level';
    case '1-2 years':
      return '1-2 Years';
    case '3-5 years':
      return '3-5 Years';
    case '5-10 years':
      return '5-10 Years';
    case '10+ years':
      return '10+ Years';
    default:
      return experience;
  }
};

// Get job type text
export const getJobTypeText = (jobType) => {
  switch (jobType) {
    case 'Full-time':
      return 'Full Time';
    case 'Part-time':
      return 'Part Time';
    case 'Contract':
      return 'Contract';
    case 'Internship':
      return 'Internship';
    case 'Freelance':
      return 'Freelance';
    default:
      return jobType;
  }
};

// Truncate text
export const truncateText = (text, maxLength = 100) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// Generate initials from name
export const getInitials = (name) => {
  if (!name) return '';
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

// Validate email
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate phone number
export const isValidPhone = (phone) => {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

// Debounce function
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Generate random ID
export const generateId = () => {
  return Math.random().toString(36).substr(2, 9);
};

// Check if user can apply for job
export const canApplyForJob = (job, user) => {
  if (!user || user.role !== 'jobseeker') return false;
  if (job.status !== 'active') return false;
  if (new Date(job.deadline) < new Date()) return false;
  return true;
};

// Check if user can manage job
export const canManageJob = (job, user) => {
  if (!user || user.role !== 'employer') return false;
  return job.postedBy === user.id;
};

// Check if user is admin
export const isAdmin = (user) => {
  return user && user.role === 'admin';
};

// Check if user is employer
export const isEmployer = (user) => {
  return user && user.role === 'employer';
};

// Check if user is job seeker
export const isJobSeeker = (user) => {
  return user && user.role === 'jobseeker';
};