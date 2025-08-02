const { body, param, query, validationResult } = require('express-validator');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => error.msg);
    return res.status(400).json({
      status: 'error',
      message: 'Validation failed',
      errors: errorMessages
    });
  }
  
  next();
};

// User registration validation
const validateRegistration = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  
  body('role')
    .optional()
    .isIn(['jobseeker', 'employer'])
    .withMessage('Role must be either jobseeker or employer'),
  
  // Employer specific validations
  body('companyName')
    .if(body('role').equals('employer'))
    .notEmpty()
    .withMessage('Company name is required for employers')
    .isLength({ max: 100 })
    .withMessage('Company name cannot exceed 100 characters'),
  
  body('companyDescription')
    .if(body('role').equals('employer'))
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Company description cannot exceed 1000 characters'),
  
  body('companyWebsite')
    .if(body('role').equals('employer'))
    .optional()
    .isURL()
    .withMessage('Please provide a valid website URL'),
  
  handleValidationErrors
];

// User login validation
const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  handleValidationErrors
];

// Job posting validation
const validateJob = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Job title must be between 3 and 100 characters'),
  
  body('description')
    .trim()
    .isLength({ min: 50, max: 5000 })
    .withMessage('Job description must be between 50 and 5000 characters'),
  
  body('location')
    .trim()
    .notEmpty()
    .withMessage('Job location is required'),
  
  body('category')
    .notEmpty()
    .withMessage('Job category is required')
    .isIn([
      'Technology', 'Finance', 'Healthcare', 'Education', 'Marketing',
      'Sales', 'Design', 'Operations', 'Human Resources', 'Legal',
      'Consulting', 'Manufacturing', 'Retail', 'Other'
    ])
    .withMessage('Invalid job category'),
  
  body('jobType')
    .notEmpty()
    .withMessage('Job type is required')
    .isIn(['Full-time', 'Part-time', 'Contract', 'Freelance', 'Internship'])
    .withMessage('Invalid job type'),
  
  body('workMode')
    .optional()
    .isIn(['Remote', 'On-site', 'Hybrid'])
    .withMessage('Invalid work mode'),
  
  body('deadline')
    .isISO8601()
    .withMessage('Please provide a valid deadline date')
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('Deadline must be in the future');
      }
      return true;
    }),
  
  body('salaryRange.min')
    .optional()
    .isNumeric()
    .withMessage('Minimum salary must be a number')
    .custom((value, { req }) => {
      if (req.body.salaryRange?.max && Number(value) > Number(req.body.salaryRange.max)) {
        throw new Error('Minimum salary cannot be greater than maximum salary');
      }
      return true;
    }),
  
  body('salaryRange.max')
    .optional()
    .isNumeric()
    .withMessage('Maximum salary must be a number'),
  
  body('experience.min')
    .optional()
    .isInt({ min: 0, max: 50 })
    .withMessage('Minimum experience must be between 0 and 50 years'),
  
  body('experience.max')
    .optional()
    .isInt({ min: 0, max: 50 })
    .withMessage('Maximum experience must be between 0 and 50 years')
    .custom((value, { req }) => {
      if (req.body.experience?.min && Number(value) < Number(req.body.experience.min)) {
        throw new Error('Maximum experience cannot be less than minimum experience');
      }
      return true;
    }),
  
  body('skills')
    .optional()
    .isArray()
    .withMessage('Skills must be an array'),
  
  body('requirements')
    .optional()
    .isArray()
    .withMessage('Requirements must be an array'),
  
  body('responsibilities')
    .optional()
    .isArray()
    .withMessage('Responsibilities must be an array'),
  
  handleValidationErrors
];

// Job application validation
const validateApplication = [
  body('coverLetter')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Cover letter cannot exceed 2000 characters'),
  
  body('expectedSalary.amount')
    .optional()
    .isNumeric()
    .withMessage('Expected salary must be a number'),
  
  body('availableFrom')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid availability date'),
  
  body('noticePeriod')
    .optional()
    .isIn(['Immediate', '15 days', '1 month', '2 months', '3 months', 'Other'])
    .withMessage('Invalid notice period'),
  
  handleValidationErrors
];

// Profile update validation
const validateProfileUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  
  body('phone')
    .optional()
    .matches(/^[+]?[\d\s-()]+$/)
    .withMessage('Please provide a valid phone number'),
  
  body('skills')
    .optional()
    .isArray()
    .withMessage('Skills must be an array'),
  
  body('experience.years')
    .optional()
    .isInt({ min: 0, max: 50 })
    .withMessage('Experience years must be between 0 and 50'),
  
  body('education')
    .optional()
    .isArray()
    .withMessage('Education must be an array'),
  
  body('socialLinks.linkedin')
    .optional()
    .isURL()
    .withMessage('Please provide a valid LinkedIn URL'),
  
  body('socialLinks.github')
    .optional()
    .isURL()
    .withMessage('Please provide a valid GitHub URL'),
  
  body('socialLinks.portfolio')
    .optional()
    .isURL()
    .withMessage('Please provide a valid portfolio URL'),
  
  handleValidationErrors
];

// Search validation
const validateSearch = [
  query('keyword')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Keyword must be between 1 and 100 characters'),
  
  query('location')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Location cannot exceed 100 characters'),
  
  query('category')
    .optional()
    .isIn([
      'Technology', 'Finance', 'Healthcare', 'Education', 'Marketing',
      'Sales', 'Design', 'Operations', 'Human Resources', 'Legal',
      'Consulting', 'Manufacturing', 'Retail', 'Other'
    ])
    .withMessage('Invalid job category'),
  
  query('jobType')
    .optional()
    .isIn(['Full-time', 'Part-time', 'Contract', 'Freelance', 'Internship'])
    .withMessage('Invalid job type'),
  
  query('workMode')
    .optional()
    .isIn(['Remote', 'On-site', 'Hybrid'])
    .withMessage('Invalid work mode'),
  
  query('minSalary')
    .optional()
    .isNumeric()
    .withMessage('Minimum salary must be a number'),
  
  query('maxSalary')
    .optional()
    .isNumeric()
    .withMessage('Maximum salary must be a number'),
  
  query('minExperience')
    .optional()
    .isInt({ min: 0, max: 50 })
    .withMessage('Minimum experience must be between 0 and 50'),
  
  query('maxExperience')
    .optional()
    .isInt({ min: 0, max: 50 })
    .withMessage('Maximum experience must be between 0 and 50'),
  
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  handleValidationErrors
];

// ObjectId validation
const validateObjectId = (field = 'id') => [
  param(field)
    .isMongoId()
    .withMessage(`Invalid ${field} format`),
  
  handleValidationErrors
];

module.exports = {
  validateRegistration,
  validateLogin,
  validateJob,
  validateApplication,
  validateProfileUpdate,
  validateSearch,
  validateObjectId,
  handleValidationErrors
};