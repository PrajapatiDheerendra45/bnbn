const express = require('express');
const { body } = require('express-validator');
const {
  getUsers,
  getUser,
  updateUserStatus,
  deleteUser,
  getJobs,
  updateJobStatus,
  deleteJob,
  getDashboardStats
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes require admin access
router.use(protect, authorize('admin'));

// Validation middleware
const updateUserStatusValidation = [
  body('isActive')
    .isBoolean()
    .withMessage('isActive must be a boolean')
];

const updateJobStatusValidation = [
  body('status')
    .isIn(['pending', 'active', 'closed', 'rejected'])
    .withMessage('Invalid status'),
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Reason cannot exceed 500 characters')
];

// Dashboard routes
router.get('/dashboard', getDashboardStats);

// User management routes
router.get('/users', getUsers);
router.get('/users/:id', getUser);
router.put('/users/:id/status', updateUserStatusValidation, updateUserStatus);
router.delete('/users/:id', deleteUser);

// Job management routes
router.get('/jobs', getJobs);
router.put('/jobs/:id/status', updateJobStatusValidation, updateJobStatus);
router.delete('/jobs/:id', deleteJob);

module.exports = router;