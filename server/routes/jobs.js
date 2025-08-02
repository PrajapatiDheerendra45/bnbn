const express = require('express');
const { body } = require('express-validator');
const {
  getJobs,
  getJob,
  createJob,
  updateJob,
  deleteJob,
  getEmployerJobs,
  getJobStats
} = require('../controllers/jobController');
const { protect, authorize, isEmployer } = require('../middleware/auth');

const router = express.Router();

// Validation middleware
const createJobValidation = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage('Job title must be between 5 and 100 characters'),
  body('description')
    .trim()
    .isLength({ min: 20, max: 2000 })
    .withMessage('Job description must be between 20 and 2000 characters'),
  body('requirements')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Job requirements must be between 10 and 1000 characters'),
  body('location')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Location must be between 2 and 100 characters'),
  body('salaryRange')
    .isJSON()
    .withMessage('Salary range must be valid JSON'),
  body('experience')
    .isIn(['Fresher', '1-2 years', '3-5 years', '5-10 years', '10+ years'])
    .withMessage('Invalid experience level'),
  body('jobType')
    .isIn(['Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance'])
    .withMessage('Invalid job type'),
  body('category')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Category must be between 2 and 50 characters'),
  body('industry')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Industry must be between 2 and 50 characters'),
  body('skills')
    .optional()
    .isJSON()
    .withMessage('Skills must be valid JSON array'),
  body('benefits')
    .optional()
    .isJSON()
    .withMessage('Benefits must be valid JSON array'),
  body('deadline')
    .isISO8601()
    .withMessage('Deadline must be a valid date'),
  body('isRemote')
    .optional()
    .isBoolean()
    .withMessage('isRemote must be a boolean'),
  body('isUrgent')
    .optional()
    .isBoolean()
    .withMessage('isUrgent must be a boolean')
];

const updateJobValidation = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage('Job title must be between 5 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 20, max: 2000 })
    .withMessage('Job description must be between 20 and 2000 characters'),
  body('requirements')
    .optional()
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Job requirements must be between 10 and 1000 characters'),
  body('location')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Location must be between 2 and 100 characters'),
  body('salaryRange')
    .optional()
    .isJSON()
    .withMessage('Salary range must be valid JSON'),
  body('experience')
    .optional()
    .isIn(['Fresher', '1-2 years', '3-5 years', '5-10 years', '10+ years'])
    .withMessage('Invalid experience level'),
  body('jobType')
    .optional()
    .isIn(['Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance'])
    .withMessage('Invalid job type'),
  body('category')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Category must be between 2 and 50 characters'),
  body('industry')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Industry must be between 2 and 50 characters'),
  body('skills')
    .optional()
    .isJSON()
    .withMessage('Skills must be valid JSON array'),
  body('benefits')
    .optional()
    .isJSON()
    .withMessage('Benefits must be valid JSON array'),
  body('deadline')
    .optional()
    .isISO8601()
    .withMessage('Deadline must be a valid date'),
  body('isRemote')
    .optional()
    .isBoolean()
    .withMessage('isRemote must be a boolean'),
  body('isUrgent')
    .optional()
    .isBoolean()
    .withMessage('isUrgent must be a boolean')
];

// Public routes
router.get('/', getJobs);
router.get('/:id', getJob);

// Protected routes (Employer only)
router.post('/', protect, authorize('employer'), createJobValidation, createJob);
router.put('/:id', protect, authorize('employer'), updateJobValidation, updateJob);
router.delete('/:id', protect, authorize('employer'), deleteJob);

// Employer specific routes
router.get('/employer/my-jobs', protect, authorize('employer'), getEmployerJobs);
router.get('/employer/stats', protect, authorize('employer'), getJobStats);

module.exports = router;