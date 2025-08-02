const express = require('express');
const { uploadAvatarMiddleware, uploadLogoMiddleware, uploadResumeMiddleware } = require('../middleware/upload');
const { uploadImage, uploadResume } = require('../utils/cloudinary');
const { protect } = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

// All routes require authentication
router.use(protect);

// @desc    Upload avatar
// @route   POST /api/users/avatar
// @access  Private
router.post('/avatar', uploadAvatarMiddleware, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image file'
      });
    }

    const uploadResult = await uploadImage(req.file, 'avatars');
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { avatar: uploadResult.url },
      { new: true }
    ).select('-password');

    res.status(200).json({
      success: true,
      message: 'Avatar uploaded successfully',
      data: user
    });
  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading avatar'
    });
  }
});

// @desc    Upload company logo (employer only)
// @route   POST /api/users/logo
// @access  Private (Employer)
router.post('/logo', uploadLogoMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'employer') {
      return res.status(403).json({
        success: false,
        message: 'Only employers can upload company logos'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image file'
      });
    }

    const uploadResult = await uploadImage(req.file, 'logos');
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { companyLogo: uploadResult.url },
      { new: true }
    ).select('-password');

    res.status(200).json({
      success: true,
      message: 'Company logo uploaded successfully',
      data: user
    });
  } catch (error) {
    console.error('Upload logo error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading company logo'
    });
  }
});

// @desc    Upload resume (job seeker only)
// @route   POST /api/users/resume
// @access  Private (Job Seeker)
router.post('/resume', uploadResumeMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'jobseeker') {
      return res.status(403).json({
        success: false,
        message: 'Only job seekers can upload resumes'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a resume file'
      });
    }

    const uploadResult = await uploadResume(req.file);
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { resumeUrl: uploadResult.url },
      { new: true }
    ).select('-password');

    res.status(200).json({
      success: true,
      message: 'Resume uploaded successfully',
      data: user
    });
  } catch (error) {
    console.error('Upload resume error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading resume'
    });
  }
});

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
router.get('/profile', async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching profile'
    });
  }
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
router.put('/profile', async (req, res) => {
  try {
    const { name, phone, location, skills, experience, education, companyName, companyDescription, companyWebsite, companySize, industry } = req.body;

    const updateData = { name };

    // Add role-specific fields
    if (req.user.role === 'jobseeker') {
      if (phone) updateData.phone = phone;
      if (location) updateData.location = location;
      if (skills) updateData.skills = skills;
      if (experience) updateData.experience = experience;
      if (education) updateData.education = education;
    } else if (req.user.role === 'employer') {
      if (companyName) updateData.companyName = companyName;
      if (companyDescription) updateData.companyDescription = companyDescription;
      if (companyWebsite) updateData.companyWebsite = companyWebsite;
      if (companySize) updateData.companySize = companySize;
      if (industry) updateData.industry = industry;
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile'
    });
  }
});

module.exports = router;