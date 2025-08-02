const express = require('express');
const { body } = require('express-validator');
const {
  applyForJob,
  getUserApplications,
  getJobApplicants,
  updateApplicationStatus,
  withdrawApplication,
  getApplicationStats
} = require('../controllers/applicationController');
const { protect, authorize } = require('../middleware/auth');
const { uploadResumeMiddleware } = require('../middleware/upload');

const router = express.Router();

// Validation middleware
const applyForJobValidation = [
  body('coverLetter')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Cover letter cannot exceed 1000 characters'),
  body('salaryExpectation')
    .optional()
    .isJSON()
    .withMessage('Salary expectation must be valid JSON'),
  body('availability')
    .optional()
    .isIn(['immediate', '2-weeks', '1-month', '3-months', 'negotiable'])
    .withMessage('Invalid availability option')
];

const updateStatusValidation = [
  body('status')
    .isIn(['applied', 'reviewing', 'shortlisted', 'interviewed', 'offered', 'rejected', 'withdrawn'])
    .withMessage('Invalid status'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters'),
  body('interviewDate')
    .optional()
    .isISO8601()
    .withMessage('Interview date must be a valid date'),
  body('interviewLocation')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Interview location cannot exceed 200 characters'),
  body('interviewType')
    .optional()
    .isIn(['phone', 'video', 'in-person'])
    .withMessage('Invalid interview type')
];

const withdrawValidation = [
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Reason cannot exceed 200 characters')
];

// Job Seeker routes
router.post('/:jobId', 
  protect, 
  authorize('jobseeker'), 
  uploadResumeMiddleware,
  applyForJobValidation, 
  applyForJob
);

router.get('/user', 
  protect, 
  authorize('jobseeker'), 
  getUserApplications
);

router.put('/:id/withdraw', 
  protect, 
  authorize('jobseeker'), 
  withdrawValidation,
  withdrawApplication
);

// Employer routes
router.get('/job/:jobId', 
  protect, 
  authorize('employer'), 
  getJobApplicants
);

router.put('/:id/status', 
  protect, 
  authorize('employer'), 
  updateStatusValidation,
  updateApplicationStatus
);

router.get('/stats', 
  protect, 
  authorize('employer'), 
  getApplicationStats
);

module.exports = router;