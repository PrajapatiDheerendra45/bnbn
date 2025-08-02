const express = require('express');
const router = express.Router();
const { authenticate, isJobSeeker, isEmployer, checkOwnership } = require('../middleware/auth');
const { validateApplication, validateObjectId } = require('../middleware/validation');
const { uploadResume } = require('../utils/cloudinary');
const Application = require('../models/Application');
const Job = require('../models/Job');
const SavedJob = require('../models/SavedJob');

// @desc    Apply for a job
// @route   POST /api/applications/jobs/:jobId/apply
// @access  Private (Job Seeker only)
router.post('/jobs/:jobId/apply', authenticate, isJobSeeker, validateObjectId('jobId'), async (req, res) => {
  try {
    // Handle file upload
    uploadResume.single('resume')(req, res, async (err) => {
      if (err) {
        return res.status(400).json({
          status: 'error',
          message: err.message
        });
      }

      const jobId = req.params.jobId;
      const userId = req.user._id;

      // Check if job exists and is active
      const job = await Job.findById(jobId);
      if (!job) {
        return res.status(404).json({
          status: 'error',
          message: 'Job not found'
        });
      }

      if (job.status !== 'active') {
        return res.status(400).json({
          status: 'error',
          message: 'Job is not active for applications'
        });
      }

      // Check if deadline has passed
      if (new Date() > job.deadline) {
        return res.status(400).json({
          status: 'error',
          message: 'Application deadline has passed'
        });
      }

      // Check if user has already applied
      const existingApplication = await Application.findOne({
        job: jobId,
        applicant: userId
      });

      if (existingApplication) {
        return res.status(400).json({
          status: 'error',
          message: 'You have already applied for this job'
        });
      }

      // Prepare application data
      const applicationData = {
        job: jobId,
        applicant: userId,
        resume: {
          url: req.file ? req.file.path : req.user.resumeUrl,
          filename: req.file ? req.file.filename : null,
          size: req.file ? req.file.size : null,
          mimetype: req.file ? req.file.mimetype : null
        }
      };

      // Add optional fields
      if (req.body.coverLetter) {
        applicationData.coverLetter = req.body.coverLetter;
      }
      if (req.body.expectedSalary) {
        applicationData.expectedSalary = req.body.expectedSalary;
      }
      if (req.body.availableFrom) {
        applicationData.availableFrom = req.body.availableFrom;
      }
      if (req.body.noticePeriod) {
        applicationData.noticePeriod = req.body.noticePeriod;
      }

      // Validate required resume
      if (!applicationData.resume.url) {
        return res.status(400).json({
          status: 'error',
          message: 'Resume is required to apply for this job'
        });
      }

      // Create application
      const application = await Application.create(applicationData);

      // Increment application count for the job
      await job.incrementApplications();

      // Populate application data
      const populatedApplication = await Application.findById(application._id)
        .populate('job', 'title company location salaryRange')
        .populate({
          path: 'job',
          populate: {
            path: 'company',
            select: 'companyName logoUrl'
          }
        });

      res.status(201).json({
        status: 'success',
        message: 'Application submitted successfully',
        data: { application: populatedApplication }
      });
    });
  } catch (error) {
    console.error('Application submission error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error submitting application'
    });
  }
});

// @desc    Get user's applications
// @route   GET /api/applications
// @access  Private (Job Seeker only)
router.get('/', authenticate, isJobSeeker, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const query = { applicant: req.user._id };
    if (status) {
      query.status = status;
    }

    const applications = await Application.find(query)
      .populate('job', 'title company location salaryRange jobType status deadline')
      .populate({
        path: 'job',
        populate: {
          path: 'company',
          select: 'companyName logoUrl'
        }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Application.countDocuments(query);

    res.status(200).json({
      status: 'success',
      data: {
        applications,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    console.error('Applications fetch error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching applications'
    });
  }
});

// @desc    Get application by ID
// @route   GET /api/applications/:id
// @access  Private (Owner only)
router.get('/:id', authenticate, validateObjectId(), checkOwnership('application'), async (req, res) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate('job', 'title description company location salaryRange jobType')
      .populate({
        path: 'job',
        populate: {
          path: 'company',
          select: 'companyName logoUrl companyDescription'
        }
      })
      .populate('applicant', 'name email phone skills experience education location');

    res.status(200).json({
      status: 'success',
      data: { application }
    });
  } catch (error) {
    console.error('Application fetch error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching application'
    });
  }
});

// @desc    Withdraw application
// @route   PUT /api/applications/:id/withdraw
// @access  Private (Job Seeker/Owner only)
router.put('/:id/withdraw', authenticate, isJobSeeker, validateObjectId(), checkOwnership('application'), async (req, res) => {
  try {
    const { reason } = req.body;
    const application = req.resource;

    if (application.status === 'rejected') {
      return res.status(400).json({
        status: 'error',
        message: 'Application is already withdrawn'
      });
    }

    await application.withdraw(reason);

    res.status(200).json({
      status: 'success',
      message: 'Application withdrawn successfully',
      data: { application }
    });
  } catch (error) {
    console.error('Application withdrawal error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error withdrawing application'
    });
  }
});

// @desc    Save/Bookmark a job
// @route   POST /api/applications/jobs/:jobId/save
// @access  Private (Job Seeker only)
router.post('/jobs/:jobId/save', authenticate, isJobSeeker, validateObjectId('jobId'), async (req, res) => {
  try {
    const jobId = req.params.jobId;
    const userId = req.user._id;

    // Check if job exists
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        status: 'error',
        message: 'Job not found'
      });
    }

    // Check if job is already saved
    const existingSavedJob = await SavedJob.findOne({
      user: userId,
      job: jobId
    });

    if (existingSavedJob) {
      return res.status(400).json({
        status: 'error',
        message: 'Job is already saved'
      });
    }

    // Create saved job
    const savedJob = await SavedJob.create({
      user: userId,
      job: jobId,
      notes: req.body.notes,
      tags: req.body.tags
    });

    res.status(201).json({
      status: 'success',
      message: 'Job saved successfully',
      data: { savedJob }
    });
  } catch (error) {
    console.error('Job save error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error saving job'
    });
  }
});

// @desc    Remove saved job
// @route   DELETE /api/applications/jobs/:jobId/save
// @access  Private (Job Seeker only)
router.delete('/jobs/:jobId/save', authenticate, isJobSeeker, validateObjectId('jobId'), async (req, res) => {
  try {
    const jobId = req.params.jobId;
    const userId = req.user._id;

    const savedJob = await SavedJob.findOneAndDelete({
      user: userId,
      job: jobId
    });

    if (!savedJob) {
      return res.status(404).json({
        status: 'error',
        message: 'Saved job not found'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Job removed from saved list'
    });
  } catch (error) {
    console.error('Job unsave error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error removing saved job'
    });
  }
});

// @desc    Get saved jobs
// @route   GET /api/applications/saved
// @access  Private (Job Seeker only)
router.get('/saved', authenticate, isJobSeeker, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const savedJobs = await SavedJob.getByUser(req.user._id, parseInt(page), parseInt(limit));

    const total = await SavedJob.countDocuments({ user: req.user._id });

    res.status(200).json({
      status: 'success',
      data: {
        savedJobs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    console.error('Saved jobs fetch error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching saved jobs'
    });
  }
});

// @desc    Upload resume
// @route   POST /api/applications/upload-resume
// @access  Private (Job Seeker only)
router.post('/upload-resume', authenticate, isJobSeeker, async (req, res) => {
  try {
    uploadResume.single('resume')(req, res, async (err) => {
      if (err) {
        return res.status(400).json({
          status: 'error',
          message: err.message
        });
      }

      if (!req.file) {
        return res.status(400).json({
          status: 'error',
          message: 'No resume file uploaded'
        });
      }

      // Update user's resume URL
      const user = await User.findByIdAndUpdate(
        req.user._id,
        { resumeUrl: req.file.path },
        { new: true }
      );

      res.status(200).json({
        status: 'success',
        message: 'Resume uploaded successfully',
        data: {
          resumeUrl: req.file.path,
          user: user.getProfileByRole()
        }
      });
    });
  } catch (error) {
    console.error('Resume upload error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error uploading resume'
    });
  }
});

module.exports = router;