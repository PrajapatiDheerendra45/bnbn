const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  role: {
    type: String,
    enum: ['jobseeker', 'employer', 'admin'],
    default: 'jobseeker'
  },
  
  // Job Seeker specific fields
  phone: {
    type: String,
    match: [/^[+]?[\d\s-()]+$/, 'Please enter a valid phone number']
  },
  resumeUrl: {
    type: String
  },
  skills: [{
    type: String,
    trim: true
  }],
  experience: {
    years: {
      type: Number,
      min: 0,
      max: 50
    },
    description: String
  },
  education: [{
    degree: String,
    institution: String,
    year: Number,
    score: String
  }],
  location: {
    city: String,
    state: String,
    country: String
  },
  
  // Employer specific fields
  companyName: {
    type: String,
    maxlength: [100, 'Company name cannot exceed 100 characters']
  },
  companyDescription: {
    type: String,
    maxlength: [1000, 'Company description cannot exceed 1000 characters']
  },
  companyWebsite: {
    type: String,
    match: [/^https?:\/\/.+/, 'Please enter a valid website URL']
  },
  companySize: {
    type: String,
    enum: ['1-10', '11-50', '51-200', '201-1000', '1000+']
  },
  industry: {
    type: String
  },
  logoUrl: {
    type: String
  },
  
  // Common fields
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  passwordResetToken: String,
  passwordResetExpires: Date,
  
  // Social links
  socialLinks: {
    linkedin: String,
    github: String,
    portfolio: String
  },
  
  // Preferences
  jobAlerts: {
    type: Boolean,
    default: true
  },
  emailNotifications: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ 'location.city': 1 });
userSchema.index({ skills: 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Get public profile (exclude sensitive data)
userSchema.methods.getPublicProfile = function() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.emailVerificationToken;
  delete obj.passwordResetToken;
  delete obj.passwordResetExpires;
  return obj;
};

// Get profile based on role
userSchema.methods.getProfileByRole = function() {
  const profile = this.getPublicProfile();
  
  if (this.role === 'jobseeker') {
    return {
      _id: profile._id,
      name: profile.name,
      email: profile.email,
      phone: profile.phone,
      role: profile.role,
      resumeUrl: profile.resumeUrl,
      skills: profile.skills,
      experience: profile.experience,
      education: profile.education,
      location: profile.location,
      socialLinks: profile.socialLinks,
      isActive: profile.isActive,
      isVerified: profile.isVerified,
      jobAlerts: profile.jobAlerts,
      emailNotifications: profile.emailNotifications,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt
    };
  } else if (this.role === 'employer') {
    return {
      _id: profile._id,
      name: profile.name,
      email: profile.email,
      phone: profile.phone,
      role: profile.role,
      companyName: profile.companyName,
      companyDescription: profile.companyDescription,
      companyWebsite: profile.companyWebsite,
      companySize: profile.companySize,
      industry: profile.industry,
      logoUrl: profile.logoUrl,
      location: profile.location,
      isActive: profile.isActive,
      isVerified: profile.isVerified,
      emailNotifications: profile.emailNotifications,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt
    };
  }
  
  return profile;
};

module.exports = mongoose.model('User', userSchema);