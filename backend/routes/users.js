const express = require('express');
const router = express.Router();
const { authenticate, optionalAuth, isJobSeeker } = require('../middleware/auth');
const { validateObjectId } = require('../middleware/validation');
const User = require('../models/User');
const Job = require('../models/Job');
const Application = require('../models/Application');

// @desc    Get public user profile
// @route   GET /api/users/:id
// @access  Public
router.get('/:id', validateObjectId(), async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -emailVerificationToken -passwordResetToken -email -phone');

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    if (!user.isActive) {
      return res.status(404).json({
        status: 'error',
        message: 'User profile not available'
      });
    }

    // Return different data based on user role
    let publicProfile;
    
    if (user.role === 'employer') {
      publicProfile = {
        _id: user._id,
        name: user.name,
        role: user.role,
        companyName: user.companyName,
        companyDescription: user.companyDescription,
        companyWebsite: user.companyWebsite,
        companySize: user.companySize,
        industry: user.industry,
        logoUrl: user.logoUrl,
        location: user.location,
        createdAt: user.createdAt
      };

      // Get company's active jobs count
      const activeJobsCount = await Job.countDocuments({
        company: user._id,
        status: 'active'
      });
      
      publicProfile.activeJobsCount = activeJobsCount;
      
    } else if (user.role === 'jobseeker') {
      publicProfile = {
        _id: user._id,
        name: user.name,
        role: user.role,
        skills: user.skills,
        experience: user.experience,
        education: user.education,
        location: user.location,
        socialLinks: user.socialLinks,
        createdAt: user.createdAt
      };
    } else {
      publicProfile = {
        _id: user._id,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt
      };
    }

    res.status(200).json({
      status: 'success',
      data: { user: publicProfile }
    });
  } catch (error) {
    console.error('Public profile fetch error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching user profile'
    });
  }
});

// @desc    Get user's dashboard data
// @route   GET /api/users/dashboard
// @access  Private
router.get('/dashboard', authenticate, async (req, res) => {
  try {
    const user = req.user;
    let dashboardData = {};

    if (user.role === 'jobseeker') {
      // Get application statistics
      const applicationStats = await Application.aggregate([
        { $match: { applicant: user._id } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      // Get recent applications
      const recentApplications = await Application.find({ applicant: user._id })
        .populate('job', 'title company location')
        .populate({
          path: 'job',
          populate: {
            path: 'company',
            select: 'companyName logoUrl'
          }
        })
        .sort({ createdAt: -1 })
        .limit(5);

      // Get job suggestions
      const suggestions = await Job.find({
        status: 'active',
        $or: [
          { skills: { $in: user.skills || [] } },
          { location: { $regex: user.location?.city || '', $options: 'i' } }
        ]
      })
      .populate('company', 'companyName logoUrl')
      .sort({ createdAt: -1 })
      .limit(5);

      // Get saved jobs count
      const SavedJob = require('../models/SavedJob');
      const savedJobsCount = await SavedJob.countDocuments({ user: user._id });

      dashboardData = {
        applicationStats,
        recentApplications,
        suggestions,
        savedJobsCount,
        profileCompleteness: calculateProfileCompleteness(user)
      };

    } else if (user.role === 'employer') {
      // Get job statistics
      const jobStats = await Job.aggregate([
        { $match: { company: user._id } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      // Get total applications received
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

      // Get recent jobs
      const recentJobs = await Job.find({ company: user._id })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('title status applicationCount views createdAt deadline');

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
            'jobDetails.company': user._id
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
            createdAt: 1
          }
        },
        { $sort: { createdAt: -1 } },
        { $limit: 5 }
      ]);

      dashboardData = {
        jobStats,
        totalApplications: totalApplications[0]?.total || 0,
        recentJobs,
        recentApplications,
        profileCompleteness: calculateProfileCompleteness(user)
      };
    }

    res.status(200).json({
      status: 'success',
      data: dashboardData
    });
  } catch (error) {
    console.error('Dashboard fetch error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching dashboard data'
    });
  }
});

// @desc    Search users
// @route   GET /api/users/search
// @access  Public
router.get('/search', optionalAuth, async (req, res) => {
  try {
    const { 
      type = 'jobseeker', 
      skills, 
      location, 
      experience,
      page = 1, 
      limit = 10 
    } = req.query;

    const skip = (page - 1) * limit;
    
    // Build query
    const query = {
      role: type,
      isActive: true
    };

    if (skills) {
      const skillsArray = skills.split(',').map(skill => skill.trim());
      query.skills = { $in: skillsArray };
    }

    if (location) {
      query['location.city'] = { $regex: location, $options: 'i' };
    }

    if (experience && type === 'jobseeker') {
      query['experience.years'] = { $gte: parseInt(experience) };
    }

    // Select appropriate fields based on user type
    let selectFields;
    if (type === 'jobseeker') {
      selectFields = 'name skills experience education location socialLinks createdAt';
    } else if (type === 'employer') {
      selectFields = 'name companyName companyDescription companySize industry logoUrl location createdAt';
    } else {
      selectFields = 'name role createdAt';
    }

    const users = await User.find(query)
      .select(selectFields)
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
    console.error('User search error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error searching users'
    });
  }
});

// @desc    Get user statistics
// @route   GET /api/users/:id/stats
// @access  Public
router.get('/:id/stats', validateObjectId(), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user || !user.isActive) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    let stats = {};

    if (user.role === 'employer') {
      // Get job and application statistics
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

      // Get recent jobs
      const recentJobs = await Job.find({ company: user._id })
        .select('title applicationCount views createdAt')
        .sort({ createdAt: -1 })
        .limit(3);

      stats = {
        jobStats,
        totalApplications: totalApplications[0]?.total || 0,
        recentJobs,
        memberSince: user.createdAt
      };

    } else if (user.role === 'jobseeker') {
      // Get application statistics
      const applicationStats = await Application.aggregate([
        { $match: { applicant: user._id } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      stats = {
        applicationStats,
        memberSince: user.createdAt,
        skillsCount: user.skills?.length || 0,
        experienceYears: user.experience?.years || 0
      };
    }

    res.status(200).json({
      status: 'success',
      data: { stats }
    });
  } catch (error) {
    console.error('User stats error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching user statistics'
    });
  }
});

// Helper function to calculate profile completeness
function calculateProfileCompleteness(user) {
  const requiredFields = {
    jobseeker: ['name', 'email', 'phone', 'skills', 'experience', 'education', 'location'],
    employer: ['name', 'email', 'phone', 'companyName', 'companyDescription', 'industry', 'location'],
    admin: ['name', 'email']
  };

  const fields = requiredFields[user.role] || requiredFields.admin;
  let completed = 0;

  fields.forEach(field => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      if (user[parent] && user[parent][child]) completed++;
    } else {
      if (user[field] && (Array.isArray(user[field]) ? user[field].length > 0 : true)) {
        completed++;
      }
    }
  });

  return Math.round((completed / fields.length) * 100);
}

module.exports = router;