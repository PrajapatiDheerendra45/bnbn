const express = require('express');
const router = express.Router();
const { authenticate, isAdmin } = require('../middleware/auth');
const { validateObjectId } = require('../middleware/validation');
const User = require('../models/User');
const Job = require('../models/Job');
const Application = require('../models/Application');

// @desc    Get admin dashboard data
// @route   GET /api/admin/dashboard
// @access  Private (Admin only)
router.get('/dashboard', authenticate, isAdmin, async (req, res) => {
  try {
    // Get user statistics
    const userStats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
          active: {
            $sum: { $cond: ['$isActive', 1, 0] }
          }
        }
      }
    ]);

    // Get job statistics
    const jobStats = await Job.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get application statistics
    const applicationStats = await Application.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get recent activities
    const recentJobs = await Job.find()
      .populate('company', 'companyName')
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title status createdAt company');

    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email role createdAt isActive');

    // Get monthly statistics for charts
    const monthlyStats = await Application.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(new Date().getFullYear(), new Date().getMonth() - 11, 1)
          }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          applications: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    // Format statistics
    const formattedUserStats = {
      total: 0,
      jobseekers: 0,
      employers: 0,
      admins: 0,
      activeUsers: 0
    };

    userStats.forEach(stat => {
      formattedUserStats.total += stat.count;
      formattedUserStats.activeUsers += stat.active;
      switch (stat._id) {
        case 'jobseeker':
          formattedUserStats.jobseekers = stat.count;
          break;
        case 'employer':
          formattedUserStats.employers = stat.count;
          break;
        case 'admin':
          formattedUserStats.admins = stat.count;
          break;
      }
    });

    const formattedJobStats = {
      total: 0,
      active: 0,
      pending: 0,
      closed: 0,
      rejected: 0
    };

    jobStats.forEach(stat => {
      formattedJobStats.total += stat.count;
      formattedJobStats[stat._id] = stat.count;
    });

    res.status(200).json({
      status: 'success',
      data: {
        userStats: formattedUserStats,
        jobStats: formattedJobStats,
        applicationStats,
        recentJobs,
        recentUsers,
        monthlyStats
      }
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching dashboard data'
    });
  }
});

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private (Admin only)
router.get('/users', authenticate, isAdmin, async (req, res) => {
  try {
    const { role, status, search, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    // Build query
    const query = {};
    
    if (role && role !== 'all') {
      query.role = role;
    }
    
    if (status === 'active') {
      query.isActive = true;
    } else if (status === 'inactive') {
      query.isActive = false;
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { companyName: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password -emailVerificationToken -passwordResetToken')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.status(200).json({
      status: 'success',
      data: {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    console.error('Users fetch error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching users'
    });
  }
});

// @desc    Get user by ID
// @route   GET /api/admin/users/:id
// @access  Private (Admin only)
router.get('/users/:id', authenticate, isAdmin, validateObjectId(), async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -emailVerificationToken -passwordResetToken');

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Get additional stats for the user
    let additionalData = {};

    if (user.role === 'employer') {
      const jobStats = await Job.aggregate([
        { $match: { company: user._id } },
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
            localField: 'job',
            foreignField: '_id',
            as: 'jobDetails'
          }
        },
        {
          $match: {
            'jobDetails.company': user._id
          }
        },
        {
          $count: 'total'
        }
      ]);

      additionalData = {
        jobStats,
        totalApplicationsReceived: totalApplications[0]?.total || 0
      };
    } else if (user.role === 'jobseeker') {
      const applicationStats = await Application.aggregate([
        { $match: { applicant: user._id } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      additionalData = {
        applicationStats
      };
    }

    res.status(200).json({
      status: 'success',
      data: {
        user,
        ...additionalData
      }
    });
  } catch (error) {
    console.error('User fetch error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching user'
    });
  }
});

// @desc    Update user status (activate/deactivate)
// @route   PUT /api/admin/users/:id/status
// @access  Private (Admin only)
router.put('/users/:id/status', authenticate, isAdmin, validateObjectId(), async (req, res) => {
  try {
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        status: 'error',
        message: 'isActive must be a boolean value'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    res.status(200).json({
      status: 'success',
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: { user }
    });
  } catch (error) {
    console.error('User status update error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error updating user status'
    });
  }
});

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin only)
router.delete('/users/:id', authenticate, isAdmin, validateObjectId(), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Prevent deletion of admin users
    if (user.role === 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Cannot delete admin users'
      });
    }

    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({
      status: 'success',
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('User deletion error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error deleting user'
    });
  }
});

// @desc    Get all jobs for review
// @route   GET /api/admin/jobs
// @access  Private (Admin only)
router.get('/jobs', authenticate, isAdmin, async (req, res) => {
  try {
    const { status, search, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    // Build query
    const query = {};
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }

    const jobs = await Job.find(query)
      .populate('company', 'companyName email logoUrl')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

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
    console.error('Jobs fetch error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching jobs'
    });
  }
});

// @desc    Approve/Reject job
// @route   PUT /api/admin/jobs/:id/review
// @access  Private (Admin only)
router.put('/jobs/:id/review', authenticate, isAdmin, validateObjectId(), async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;

    if (!['active', 'rejected'].includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: 'Status must be either "active" or "rejected"'
      });
    }

    if (status === 'rejected' && !rejectionReason) {
      return res.status(400).json({
        status: 'error',
        message: 'Rejection reason is required when rejecting a job'
      });
    }

    const updateData = {
      status,
      approvedBy: req.user._id,
      approvedAt: new Date()
    };

    if (status === 'rejected') {
      updateData.rejectionReason = rejectionReason;
    }

    const job = await Job.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('company', 'companyName email');

    if (!job) {
      return res.status(404).json({
        status: 'error',
        message: 'Job not found'
      });
    }

    res.status(200).json({
      status: 'success',
      message: `Job ${status === 'active' ? 'approved' : 'rejected'} successfully`,
      data: { job }
    });
  } catch (error) {
    console.error('Job review error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error reviewing job'
    });
  }
});

// @desc    Delete job
// @route   DELETE /api/admin/jobs/:id
// @access  Private (Admin only)
router.delete('/jobs/:id', authenticate, isAdmin, validateObjectId(), async (req, res) => {
  try {
    const job = await Job.findByIdAndDelete(req.params.id);

    if (!job) {
      return res.status(404).json({
        status: 'error',
        message: 'Job not found'
      });
    }

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

// @desc    Toggle featured job status
// @route   PUT /api/admin/jobs/:id/featured
// @access  Private (Admin only)
router.put('/jobs/:id/featured', authenticate, isAdmin, validateObjectId(), async (req, res) => {
  try {
    const { featuredJob } = req.body;

    if (typeof featuredJob !== 'boolean') {
      return res.status(400).json({
        status: 'error',
        message: 'featuredJob must be a boolean value'
      });
    }

    const job = await Job.findByIdAndUpdate(
      req.params.id,
      { featuredJob },
      { new: true }
    ).populate('company', 'companyName');

    if (!job) {
      return res.status(404).json({
        status: 'error',
        message: 'Job not found'
      });
    }

    res.status(200).json({
      status: 'success',
      message: `Job ${featuredJob ? 'marked as featured' : 'removed from featured'}`,
      data: { job }
    });
  } catch (error) {
    console.error('Job featured status update error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error updating job featured status'
    });
  }
});

// @desc    Get platform analytics
// @route   GET /api/admin/analytics
// @access  Private (Admin only)
router.get('/analytics', authenticate, isAdmin, async (req, res) => {
  try {
    const { period = '30' } = req.query;
    const days = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // User registration trends
    const userRegistrations = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            date: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$createdAt'
              }
            },
            role: '$role'
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.date': 1 }
      }
    ]);

    // Job posting trends
    const jobPostings = await Job.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
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
      {
        $sort: { '_id': 1 }
      }
    ]);

    // Application trends
    const applications = await Application.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
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
      {
        $sort: { '_id': 1 }
      }
    ]);

    // Top job categories
    const topCategories = await Job.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 10
      }
    ]);

    // Top locations
    const topLocations = await Job.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$location',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 10
      }
    ]);

    // Most active companies
    const activeCompanies = await Job.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$company',
          jobsPosted: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'companyDetails'
        }
      },
      {
        $unwind: '$companyDetails'
      },
      {
        $project: {
          companyName: '$companyDetails.companyName',
          jobsPosted: 1
        }
      },
      {
        $sort: { jobsPosted: -1 }
      },
      {
        $limit: 10
      }
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        userRegistrations,
        jobPostings,
        applications,
        topCategories,
        topLocations,
        activeCompanies
      }
    });
  } catch (error) {
    console.error('Analytics fetch error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching analytics'
    });
  }
});

module.exports = router;