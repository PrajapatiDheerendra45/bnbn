const Application = require('../models/Application');
const Job = require('../models/Job');
const User = require('../models/User');
const { uploadResume } = require('../utils/cloudinary');
const { 
  sendApplicationConfirmation, 
  sendNewApplicationNotification,
  sendApplicationStatusUpdate 
} = require('../utils/emailService');
const { validationResult } = require('express-validator');

// @desc    Apply for a job
// @route   POST /api/applications/:jobId
// @access  Private (Job Seeker)
exports.applyForJob = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { jobId } = req.params;
    const { coverLetter, salaryExpectation, availability } = req.body;

    // Check if job exists and is active
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    if (job.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'This job is not accepting applications'
      });
    }

    // Check if job deadline has passed
    if (job.isExpired()) {
      return res.status(400).json({
        success: false,
        message: 'Application deadline has passed'
      });
    }

    // Check if user has already applied
    const existingApplication = await Application.findOne({
      jobId,
      applicantId: req.user.id
    });

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: 'You have already applied for this job'
      });
    }

    // Handle resume upload
    let resumeUrl = req.user.resumeUrl;
    if (req.file) {
      try {
        const uploadResult = await uploadResume(req.file);
        resumeUrl = uploadResult.url;
      } catch (uploadError) {
        return res.status(400).json({
          success: false,
          message: 'Error uploading resume'
        });
      }
    }

    if (!resumeUrl) {
      return res.status(400).json({
        success: false,
        message: 'Resume is required'
      });
    }

    // Create application
    const applicationData = {
      jobId,
      applicantId: req.user.id,
      resume: resumeUrl,
      coverLetter,
      salaryExpectation: salaryExpectation ? JSON.parse(salaryExpectation) : null,
      availability
    };

    const application = await Application.create(applicationData);

    // Increment job applications count
    await job.incrementApplications();

    // Send confirmation email to applicant
    try {
      await sendApplicationConfirmation(req.user.email, job.title, job.company.name);
    } catch (emailError) {
      console.error('Error sending application confirmation:', emailError);
    }

    // Send notification to employer
    try {
      const employer = await User.findById(job.postedBy);
      if (employer) {
        await sendNewApplicationNotification(employer.email, job.title, req.user.name);
      }
    } catch (emailError) {
      console.error('Error sending employer notification:', emailError);
    }

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      data: application
    });
  } catch (error) {
    console.error('Apply for job error:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting application'
    });
  }
};

// @desc    Get user's applications
// @route   GET /api/applications/user
// @access  Private (Job Seeker)
exports.getUserApplications = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const filter = { applicantId: req.user.id };
    if (status) {
      filter.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const applications = await Application.find(filter)
      .populate('jobId', 'title company location salaryRange jobType deadline')
      .populate('employerId', 'name companyName')
      .sort({ appliedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Application.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: applications.length,
      total,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        hasNext: skip + applications.length < total,
        hasPrev: parseInt(page) > 1
      },
      data: applications
    });
  } catch (error) {
    console.error('Get user applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching applications'
    });
  }
};

// @desc    Get applicants for a job
// @route   GET /api/applications/job/:jobId
// @access  Private (Employer)
exports.getJobApplicants = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { page = 1, limit = 10, status } = req.query;

    // Check if job exists and belongs to employer
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    if (job.postedBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view applicants for this job'
      });
    }

    const filter = { jobId };
    if (status) {
      filter.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const applications = await Application.find(filter)
      .populate('applicantId', 'name email phone location skills experience education')
      .sort({ appliedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Application.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: applications.length,
      total,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        hasNext: skip + applications.length < total,
        hasPrev: parseInt(page) > 1
      },
      data: applications
    });
  } catch (error) {
    console.error('Get job applicants error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching applicants'
    });
  }
};

// @desc    Update application status
// @route   PUT /api/applications/:id/status
// @access  Private (Employer)
exports.updateApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes, interviewDate, interviewLocation, interviewType } = req.body;

    const application = await Application.findById(id)
      .populate('jobId', 'title')
      .populate('applicantId', 'name email');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Check if employer owns the job
    const job = await Job.findById(application.jobId._id);
    if (job.postedBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this application'
      });
    }

    // Update application
    const updateData = { status };
    if (notes) updateData.notes = notes;
    if (interviewDate) updateData.interviewDate = interviewDate;
    if (interviewLocation) updateData.interviewLocation = interviewLocation;
    if (interviewType) updateData.interviewType = interviewType;

    await application.updateStatus(status, req.user.id);
    Object.assign(application, updateData);
    await application.save();

    // Send email notification to applicant
    try {
      await sendApplicationStatusUpdate(
        application.applicantId.email,
        application.jobId.title,
        status
      );
    } catch (emailError) {
      console.error('Error sending status update email:', emailError);
    }

    res.status(200).json({
      success: true,
      message: 'Application status updated successfully',
      data: application
    });
  } catch (error) {
    console.error('Update application status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating application status'
    });
  }
};

// @desc    Withdraw application
// @route   PUT /api/applications/:id/withdraw
// @access  Private (Job Seeker)
exports.withdrawApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const application = await Application.findById(id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Check if user owns the application
    if (application.applicantId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to withdraw this application'
      });
    }

    // Check if application can be withdrawn
    if (application.status === 'withdrawn') {
      return res.status(400).json({
        success: false,
        message: 'Application is already withdrawn'
      });
    }

    await application.withdraw(reason);

    res.status(200).json({
      success: true,
      message: 'Application withdrawn successfully'
    });
  } catch (error) {
    console.error('Withdraw application error:', error);
    res.status(500).json({
      success: false,
      message: 'Error withdrawing application'
    });
  }
};

// @desc    Get application statistics
// @route   GET /api/applications/stats
// @access  Private (Employer)
exports.getApplicationStats = async (req, res) => {
  try {
    const stats = await Application.aggregate([
      {
        $lookup: {
          from: 'jobs',
          localField: 'jobId',
          foreignField: '_id',
          as: 'job'
        }
      },
      {
        $unwind: '$job'
      },
      {
        $match: {
          'job.postedBy': req.user._id
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalApplications = await Application.aggregate([
      {
        $lookup: {
          from: 'jobs',
          localField: 'jobId',
          foreignField: '_id',
          as: 'job'
        }
      },
      {
        $unwind: '$job'
      },
      {
        $match: {
          'job.postedBy': req.user._id
        }
      },
      {
        $count: 'total'
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        total: totalApplications[0]?.total || 0,
        stats
      }
    });
  } catch (error) {
    console.error('Get application stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching application statistics'
    });
  }
};