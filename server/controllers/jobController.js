const Job = require('../models/Job');
const User = require('../models/User');
const { validationResult } = require('express-validator');

// @desc    Get all jobs (public)
// @route   GET /api/jobs
// @access  Public
exports.getJobs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      location,
      category,
      jobType,
      experience,
      salaryMin,
      salaryMax,
      isRemote,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = { status: 'active' };

    if (search) {
      filter.$text = { $search: search };
    }

    if (location) {
      filter.location = { $regex: location, $options: 'i' };
    }

    if (category) {
      filter.category = { $regex: category, $options: 'i' };
    }

    if (jobType) {
      filter.jobType = jobType;
    }

    if (experience) {
      filter.experience = experience;
    }

    if (salaryMin || salaryMax) {
      filter['salaryRange.min'] = {};
      if (salaryMin) filter['salaryRange.min'].$gte = parseInt(salaryMin);
      if (salaryMax) filter['salaryRange.max'] = { $lte: parseInt(salaryMax) };
    }

    if (isRemote !== undefined) {
      filter.isRemote = isRemote === 'true';
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const jobs = await Job.find(filter)
      .populate('postedBy', 'name companyName companyLogo')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await Job.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: jobs.length,
      total,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        hasNext: skip + jobs.length < total,
        hasPrev: parseInt(page) > 1
      },
      data: jobs
    });
  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching jobs'
    });
  }
};

// @desc    Get single job
// @route   GET /api/jobs/:id
// @access  Public
exports.getJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('postedBy', 'name companyName companyLogo companyDescription companyWebsite companySize industry');

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Increment views
    await job.incrementViews();

    res.status(200).json({
      success: true,
      data: job
    });
  } catch (error) {
    console.error('Get job error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching job'
    });
  }
};

// @desc    Create new job
// @route   POST /api/jobs
// @access  Private (Employer)
exports.createJob = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const {
      title,
      description,
      requirements,
      location,
      salaryRange,
      experience,
      jobType,
      category,
      industry,
      skills,
      benefits,
      deadline,
      isRemote,
      isUrgent
    } = req.body;

    // Get employer details
    const employer = await User.findById(req.user.id);

    const jobData = {
      title,
      description,
      requirements,
      location,
      salaryRange: JSON.parse(salaryRange),
      experience,
      jobType,
      category,
      industry,
      skills: skills ? JSON.parse(skills) : [],
      benefits: benefits ? JSON.parse(benefits) : [],
      deadline,
      postedBy: req.user.id,
      isRemote: isRemote || false,
      isUrgent: isUrgent || false,
      company: {
        name: employer.companyName,
        logo: employer.companyLogo,
        website: employer.companyWebsite,
        size: employer.companySize,
        industry: employer.industry
      }
    };

    const job = await Job.create(jobData);

    res.status(201).json({
      success: true,
      message: 'Job created successfully',
      data: job
    });
  } catch (error) {
    console.error('Create job error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating job'
    });
  }
};

// @desc    Update job
// @route   PUT /api/jobs/:id
// @access  Private (Employer)
exports.updateJob = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    let job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Check if user owns the job
    if (job.postedBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this job'
      });
    }

    const updateData = req.body;

    // Parse JSON fields if they exist
    if (updateData.salaryRange) {
      updateData.salaryRange = JSON.parse(updateData.salaryRange);
    }
    if (updateData.skills) {
      updateData.skills = JSON.parse(updateData.skills);
    }
    if (updateData.benefits) {
      updateData.benefits = JSON.parse(updateData.benefits);
    }

    job = await Job.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Job updated successfully',
      data: job
    });
  } catch (error) {
    console.error('Update job error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating job'
    });
  }
};

// @desc    Delete job
// @route   DELETE /api/jobs/:id
// @access  Private (Employer)
exports.deleteJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Check if user owns the job
    if (job.postedBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this job'
      });
    }

    await Job.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Job deleted successfully'
    });
  } catch (error) {
    console.error('Delete job error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting job'
    });
  }
};

// @desc    Get employer's jobs
// @route   GET /api/jobs/employer/my-jobs
// @access  Private (Employer)
exports.getEmployerJobs = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const filter = { postedBy: req.user.id };
    if (status) {
      filter.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const jobs = await Job.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Job.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: jobs.length,
      total,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        hasNext: skip + jobs.length < total,
        hasPrev: parseInt(page) > 1
      },
      data: jobs
    });
  } catch (error) {
    console.error('Get employer jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching jobs'
    });
  }
};

// @desc    Get job statistics
// @route   GET /api/jobs/stats
// @access  Private (Employer)
exports.getJobStats = async (req, res) => {
  try {
    const stats = await Job.aggregate([
      { $match: { postedBy: req.user._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalViews: { $sum: '$views' },
          totalApplications: { $sum: '$applications' }
        }
      }
    ]);

    const totalJobs = await Job.countDocuments({ postedBy: req.user._id });
    const activeJobs = await Job.countDocuments({ postedBy: req.user._id, status: 'active' });
    const pendingJobs = await Job.countDocuments({ postedBy: req.user._id, status: 'pending' });

    res.status(200).json({
      success: true,
      data: {
        totalJobs,
        activeJobs,
        pendingJobs,
        stats
      }
    });
  } catch (error) {
    console.error('Get job stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching job statistics'
    });
  }
};