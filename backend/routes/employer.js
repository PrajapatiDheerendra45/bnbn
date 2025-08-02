const express = require('express');
const router = express.Router();
const { authenticate, isEmployer } = require('../middleware/auth');
const { validateObjectId } = require('../middleware/validation');
const Job = require('../models/Job');
const Application = require('../models/Application');
const User = require('../models/User');

// @desc    Get employer dashboard data
// @route   GET /api/employer/dashboard
// @access  Private (Employer only)
router.get('/dashboard', authenticate, isEmployer, async (req, res) => {
  try {
    const employerId = req.user._id;

    // Get job statistics
    const jobStats = await Job.aggregate([
      { $match: { company: employerId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get total applications count
    const totalApplications = await Application.aggregate([
      {
        $lookup: {
          from: 'jobs',
          localField: 'job',
          foreignField: '_id',
          as: 'jobDetails'
        }
      },
      {
        $match: {
          'jobDetails.company': employerId
        }
      },
      {
        $count: 'total'
      }
    ]);

    // Get recent applications
    const recentApplications = await Application.aggregate([
      {
        $lookup: {
          from: 'jobs',
          localField: 'job',
          foreignField: '_id',
          as: 'jobDetails'
        }
      },
      {
        $match: {
          'jobDetails.company': employerId
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'applicant',
          foreignField: '_id',
          as: 'applicantDetails'
        }
      },
      {
        $project: {
          job: { $arrayElemAt: ['$jobDetails', 0] },
          applicant: { $arrayElemAt: ['$applicantDetails', 0] },
          status: 1,
          createdAt: 1,
          coverLetter: 1
        }
      },
      { $sort: { createdAt: -1 } },
      { $limit: 5 }
    ]);

    // Get active jobs with application counts
    const activeJobs = await Job.find({
      company: employerId,
      status: 'active'
    })
    .select('title applicationCount views createdAt deadline')
    .sort({ createdAt: -1 })
    .limit(5);

    // Format statistics
    const stats = {
      totalJobs: 0,
      activeJobs: 0,
      pendingJobs: 0,
      closedJobs: 0,
      totalApplications: totalApplications[0]?.total || 0
    };

    jobStats.forEach(stat => {
      stats.totalJobs += stat.count;
      switch (stat._id) {
        case 'active':
          stats.activeJobs = stat.count;
          break;
        case 'pending':
          stats.pendingJobs = stat.count;
          break;
        case 'closed':
          stats.closedJobs = stat.count;
          break;
      }
    });

    res.status(200).json({
      status: 'success',
      data: {
        stats,
        recentApplications,
        activeJobs
      }
    });
  } catch (error) {
    console.error('Employer dashboard error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching dashboard data'
    });
  }
});

// @desc    Get employer's posted jobs
// @route   GET /api/employer/jobs
// @access  Private (Employer only)
router.get('/jobs', authenticate, isEmployer, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const query = { company: req.user._id };
    if (status) {
      query.status = status;
    }

    const jobs = await Job.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Job.countDocuments(query);

    res.status(200).json({
      status: 'success',
      data: {
        jobs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    console.error('Employer jobs fetch error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching jobs'
    });
  }
});

// @desc    Get applications for a specific job
// @route   GET /api/employer/jobs/:jobId/applications
// @access  Private (Employer only)
router.get('/jobs/:jobId/applications', authenticate, isEmployer, validateObjectId('jobId'), async (req, res) => {
  try {
    const jobId = req.params.jobId;
    const { status, page = 1, limit = 10 } = req.query;

    // Verify job belongs to employer
    const job = await Job.findOne({
      _id: jobId,
      company: req.user._id
    });

    if (!job) {
      return res.status(404).json({
        status: 'error',
        message: 'Job not found or you do not have permission to view its applications'
      });
    }

    const skip = (page - 1) * limit;
    const query = { job: jobId };
    
    if (status) {
      query.status = status;
    }

    const applications = await Application.find(query)
      .populate('applicant', 'name email phone skills experience education location resumeUrl')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Application.countDocuments(query);

    // Get application statistics
    const applicationStats = await Application.aggregate([
      { $match: { job: job._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        job,
        applications,
        stats: applicationStats,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    console.error('Job applications fetch error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching job applications'
    });
  }
});

// @desc    Update application status
// @route   PUT /api/employer/applications/:applicationId/status
// @access  Private (Employer only)
router.put('/applications/:applicationId/status', authenticate, isEmployer, validateObjectId('applicationId'), async (req, res) => {
  try {
    const { status, notes } = req.body;
    const applicationId = req.params.applicationId;

    const validStatuses = ['applied', 'reviewed', 'shortlisted', 'interviewed', 'selected', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid application status'
      });
    }

    // Get application with job details
    const application = await Application.findById(applicationId)
      .populate('job', 'company title');

    if (!application) {
      return res.status(404).json({
        status: 'error',
        message: 'Application not found'
      });
    }

    // Verify job belongs to employer
    if (application.job.company.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to update this application'
      });
    }

    // Update application
    await application.updateStatus(status, req.user._id);
    
    if (notes) {
      application.employerNotes = notes;
      await application.save();
    }

    // Populate updated application
    const updatedApplication = await Application.findById(applicationId)
      .populate('applicant', 'name email phone')
      .populate('job', 'title');

    res.status(200).json({
      status: 'success',
      message: 'Application status updated successfully',
      data: { application: updatedApplication }
    });
  } catch (error) {
    console.error('Application status update error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error updating application status'
    });
  }
});

// @desc    Schedule interview for application
// @route   PUT /api/employer/applications/:applicationId/interview
// @access  Private (Employer only)
router.put('/applications/:applicationId/interview', authenticate, isEmployer, validateObjectId('applicationId'), async (req, res) => {
  try {
    const applicationId = req.params.applicationId;
    const { dateTime, mode, location, meetingLink } = req.body;

    if (!dateTime || !mode) {
      return res.status(400).json({
        status: 'error',
        message: 'Interview date/time and mode are required'
      });
    }

    // Get application with job details
    const application = await Application.findById(applicationId)
      .populate('job', 'company title');

    if (!application) {
      return res.status(404).json({
        status: 'error',
        message: 'Application not found'
      });
    }

    // Verify job belongs to employer
    if (application.job.company.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to schedule interview for this application'
      });
    }

    // Schedule interview
    const interviewData = {
      dateTime: new Date(dateTime),
      mode,
      interviewer: req.user._id
    };

    if (location) interviewData.location = location;
    if (meetingLink) interviewData.meetingLink = meetingLink;

    await application.scheduleInterview(interviewData);

    // Populate updated application
    const updatedApplication = await Application.findById(applicationId)
      .populate('applicant', 'name email phone')
      .populate('job', 'title')
      .populate('interview.interviewer', 'name email');

    res.status(200).json({
      status: 'success',
      message: 'Interview scheduled successfully',
      data: { application: updatedApplication }
    });
  } catch (error) {
    console.error('Interview scheduling error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error scheduling interview'
    });
  }
});

// @desc    Search job seekers
// @route   GET /api/employer/candidates
// @access  Private (Employer only)
router.get('/candidates', authenticate, isEmployer, async (req, res) => {
  try {
    const {
      skills,
      location,
      experience,
      education,
      page = 1,
      limit = 10
    } = req.query;

    const skip = (page - 1) * limit;
    const query = { 
      role: 'jobseeker',
      isActive: true
    };

    // Build search query
    if (skills) {
      const skillsArray = skills.split(',').map(skill => skill.trim());
      query.skills = { $in: skillsArray };
    }

    if (location) {
      query['location.city'] = { $regex: location, $options: 'i' };
    }

    if (experience) {
      query['experience.years'] = { $gte: parseInt(experience) };
    }

    if (education) {
      query['education.degree'] = { $regex: education, $options: 'i' };
    }

    const candidates = await User.find(query)
      .select('name email phone skills experience education location resumeUrl createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.status(200).json({
      status: 'success',
      data: {
        candidates,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    console.error('Candidates search error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error searching candidates'
    });
  }
});

// @desc    Get job analytics
// @route   GET /api/employer/jobs/:jobId/analytics
// @access  Private (Employer only)
router.get('/jobs/:jobId/analytics', authenticate, isEmployer, validateObjectId('jobId'), async (req, res) => {
  try {
    const jobId = req.params.jobId;

    // Verify job belongs to employer
    const job = await Job.findOne({
      _id: jobId,
      company: req.user._id
    });

    if (!job) {
      return res.status(404).json({
        status: 'error',
        message: 'Job not found'
      });
    }

    // Get application statistics
    const applicationStats = await Application.aggregate([
      { $match: { job: job._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get applications over time (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const applicationsOverTime = await Application.aggregate([
      {
        $match: {
          job: job._id,
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt'
            }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    // Get top skills from applicants
    const topSkills = await Application.aggregate([
      { $match: { job: job._id } },
      {
        $lookup: {
          from: 'users',
          localField: 'applicant',
          foreignField: '_id',
          as: 'applicantDetails'
        }
      },
      { $unwind: '$applicantDetails' },
      { $unwind: '$applicantDetails.skills' },
      {
        $group: {
          _id: '$applicantDetails.skills',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        job: {
          title: job.title,
          views: job.views,
          applicationCount: job.applicationCount,
          createdAt: job.createdAt,
          deadline: job.deadline
        },
        applicationStats,
        applicationsOverTime,
        topSkills
      }
    });
  } catch (error) {
    console.error('Job analytics error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching job analytics'
    });
  }
});

module.exports = router;