const express = require('express');
const router = express.Router();
const { authenticate, isEmployer, checkOwnership, optionalAuth } = require('../middleware/auth');
const { validateJob, validateSearch, validateObjectId } = require('../middleware/validation');
const Job = require('../models/Job');
const SavedJob = require('../models/SavedJob');

// @desc    Get all jobs (with search and filters)
// @route   GET /api/jobs
// @access  Public
router.get('/', validateSearch, optionalAuth, async (req, res) => {
  try {
    const {
      keyword,
      location,
      category,
      jobType,
      workMode,
      minSalary,
      maxSalary,
      minExperience,
      maxExperience,
      page = 1,
      limit = 10,
      sort = 'createdAt',
      order = 'desc'
    } = req.query;

    // Build query
    const query = { status: 'active' };

    // Text search
    if (keyword) {
      query.$text = { $search: keyword };
    }

    // Location filter
    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }

    // Category filter
    if (category) {
      query.category = category;
    }

    // Job type filter
    if (jobType) {
      query.jobType = jobType;
    }

    // Work mode filter
    if (workMode) {
      query.workMode = workMode;
    }

    // Salary range filter
    if (minSalary || maxSalary) {
      query.$and = query.$and || [];
      if (minSalary) {
        query.$and.push({
          $or: [
            { 'salaryRange.min': { $gte: Number(minSalary) } },
            { 'salaryRange.max': { $gte: Number(minSalary) } }
          ]
        });
      }
      if (maxSalary) {
        query.$and.push({
          $or: [
            { 'salaryRange.max': { $lte: Number(maxSalary) } },
            { 'salaryRange.min': { $lte: Number(maxSalary) } }
          ]
        });
      }
    }

    // Experience filter
    if (minExperience || maxExperience) {
      query.$and = query.$and || [];
      if (minExperience) {
        query.$and.push({
          $or: [
            { 'experience.min': { $gte: Number(minExperience) } },
            { 'experience.max': { $gte: Number(minExperience) } }
          ]
        });
      }
      if (maxExperience) {
        query.$and.push({
          $or: [
            { 'experience.max': { $lte: Number(maxExperience) } },
            { 'experience.min': { $lte: Number(maxExperience) } }
          ]
        });
      }
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Sorting
    const sortField = sort === 'salary' ? 'salaryRange.max' : sort;
    const sortOrder = order === 'desc' ? -1 : 1;
    const sortObj = { [sortField]: sortOrder };

    // Add score sorting for text search
    if (keyword) {
      sortObj.score = { $meta: 'textScore' };
    }

    // Execute query
    const jobs = await Job.find(query)
      .populate('company', 'companyName logoUrl location')
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Get total count
    const total = await Job.countDocuments(query);

    // Add saved status for authenticated users
    if (req.user && req.user.role === 'jobseeker') {
      const savedJobs = await SavedJob.find({
        user: req.user._id,
        job: { $in: jobs.map(job => job._id) }
      }).select('job');
      
      const savedJobIds = new Set(savedJobs.map(saved => saved.job.toString()));
      
      jobs.forEach(job => {
        job.isSaved = savedJobIds.has(job._id.toString());
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        jobs,
        pagination: {
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum),
          total
        }
      }
    });
  } catch (error) {
    console.error('Jobs fetch error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching jobs'
    });
  }
});

// @desc    Get featured jobs
// @route   GET /api/jobs/featured
// @access  Public
router.get('/featured', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const jobs = await Job.getFeaturedJobs(limit);

    res.status(200).json({
      status: 'success',
      data: { jobs }
    });
  } catch (error) {
    console.error('Featured jobs fetch error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching featured jobs'
    });
  }
});

// @desc    Get popular jobs
// @route   GET /api/jobs/popular
// @access  Public
router.get('/popular', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const jobs = await Job.getPopularJobs(limit);

    res.status(200).json({
      status: 'success',
      data: { jobs }
    });
  } catch (error) {
    console.error('Popular jobs fetch error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching popular jobs'
    });
  }
});

// @desc    Get recent jobs
// @route   GET /api/jobs/recent
// @access  Public
router.get('/recent', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const jobs = await Job.getRecentJobs(limit);

    res.status(200).json({
      status: 'success',
      data: { jobs }
    });
  } catch (error) {
    console.error('Recent jobs fetch error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching recent jobs'
    });
  }
});

// @desc    Get job by ID
// @route   GET /api/jobs/:id
// @access  Public
router.get('/:id', validateObjectId(), optionalAuth, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('company', 'companyName companyDescription logoUrl location companyWebsite companySize industry');

    if (!job) {
      return res.status(404).json({
        status: 'error',
        message: 'Job not found'
      });
    }

    // Increment view count (don't wait for it)
    if (job.status === 'active') {
      job.incrementViews().catch(err => console.error('Error incrementing views:', err));
    }

    // Check if job is saved by authenticated user
    let isSaved = false;
    if (req.user && req.user.role === 'jobseeker') {
      const savedJob = await SavedJob.findOne({
        user: req.user._id,
        job: job._id
      });
      isSaved = !!savedJob;
    }

    const jobData = job.toObject();
    jobData.isSaved = isSaved;

    res.status(200).json({
      status: 'success',
      data: { job: jobData }
    });
  } catch (error) {
    console.error('Job fetch error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching job'
    });
  }
});

// @desc    Create new job
// @route   POST /api/jobs
// @access  Private (Employer only)
router.post('/', authenticate, isEmployer, validateJob, async (req, res) => {
  try {
    const jobData = {
      ...req.body,
      company: req.user._id
    };

    const job = await Job.create(jobData);
    const populatedJob = await Job.findById(job._id)
      .populate('company', 'companyName logoUrl location');

    res.status(201).json({
      status: 'success',
      message: 'Job created successfully',
      data: { job: populatedJob }
    });
  } catch (error) {
    console.error('Job creation error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error creating job'
    });
  }
});

// @desc    Update job
// @route   PUT /api/jobs/:id
// @access  Private (Employer/Owner only)
router.put('/:id', authenticate, isEmployer, validateObjectId(), checkOwnership('job'), validateJob, async (req, res) => {
  try {
    const allowedFields = [
      'title', 'description', 'location', 'salaryRange', 'experience',
      'jobType', 'workMode', 'category', 'skills', 'requirements',
      'responsibilities', 'benefits', 'deadline', 'isUrgent',
      'companySize', 'educationLevel'
    ];

    // Filter only allowed fields
    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const job = await Job.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('company', 'companyName logoUrl location');

    res.status(200).json({
      status: 'success',
      message: 'Job updated successfully',
      data: { job }
    });
  } catch (error) {
    console.error('Job update error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error updating job'
    });
  }
});

// @desc    Delete job
// @route   DELETE /api/jobs/:id
// @access  Private (Employer/Owner only)
router.delete('/:id', authenticate, isEmployer, validateObjectId(), checkOwnership('job'), async (req, res) => {
  try {
    await Job.findByIdAndDelete(req.params.id);

    res.status(200).json({
      status: 'success',
      message: 'Job deleted successfully'
    });
  } catch (error) {
    console.error('Job deletion error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error deleting job'
    });
  }
});

// @desc    Close job (stop accepting applications)
// @route   PUT /api/jobs/:id/close
// @access  Private (Employer/Owner only)
router.put('/:id/close', authenticate, isEmployer, validateObjectId(), checkOwnership('job'), async (req, res) => {
  try {
    const job = await Job.findByIdAndUpdate(
      req.params.id,
      { status: 'closed' },
      { new: true }
    ).populate('company', 'companyName logoUrl location');

    res.status(200).json({
      status: 'success',
      message: 'Job closed successfully',
      data: { job }
    });
  } catch (error) {
    console.error('Job close error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error closing job'
    });
  }
});

// @desc    Get job suggestions based on user profile
// @route   GET /api/jobs/suggestions
// @access  Private (Job Seeker only)
router.get('/suggestions', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'jobseeker') {
      return res.status(403).json({
        status: 'error',
        message: 'Only job seekers can get job suggestions'
      });
    }

    const user = req.user;
    const query = { status: 'active' };
    const limit = parseInt(req.query.limit) || 10;

    // Build suggestions based on user profile
    const suggestions = [];

    // Skills-based suggestions
    if (user.skills && user.skills.length > 0) {
      suggestions.push({
        skills: { $in: user.skills }
      });
    }

    // Location-based suggestions
    if (user.location && user.location.city) {
      suggestions.push({
        location: { $regex: user.location.city, $options: 'i' }
      });
    }

    // Experience-based suggestions
    if (user.experience && user.experience.years !== undefined) {
      suggestions.push({
        $or: [
          { 'experience.min': { $lte: user.experience.years } },
          { 'experience.max': { $gte: user.experience.years } }
        ]
      });
    }

    if (suggestions.length > 0) {
      query.$or = suggestions;
    }

    const jobs = await Job.find(query)
      .populate('company', 'companyName logoUrl location')
      .sort({ createdAt: -1 })
      .limit(limit);

    res.status(200).json({
      status: 'success',
      data: { jobs }
    });
  } catch (error) {
    console.error('Job suggestions error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching job suggestions'
    });
  }
});

module.exports = router;