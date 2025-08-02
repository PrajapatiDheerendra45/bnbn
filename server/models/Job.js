const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Job title is required'],
    trim: true,
    maxlength: [100, 'Job title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Job description is required'],
    maxlength: [2000, 'Job description cannot exceed 2000 characters']
  },
  requirements: {
    type: String,
    required: [true, 'Job requirements are required'],
    maxlength: [1000, 'Job requirements cannot exceed 1000 characters']
  },
  location: {
    type: String,
    required: [true, 'Job location is required'],
    trim: true
  },
  salaryRange: {
    min: {
      type: Number,
      required: [true, 'Minimum salary is required']
    },
    max: {
      type: Number,
      required: [true, 'Maximum salary is required']
    },
    currency: {
      type: String,
      default: 'USD'
    },
    period: {
      type: String,
      enum: ['hourly', 'daily', 'weekly', 'monthly', 'yearly'],
      default: 'yearly'
    }
  },
  experience: {
    type: String,
    enum: ['Fresher', '1-2 years', '3-5 years', '5-10 years', '10+ years'],
    required: [true, 'Experience level is required']
  },
  jobType: {
    type: String,
    enum: ['Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance'],
    required: [true, 'Job type is required']
  },
  category: {
    type: String,
    required: [true, 'Job category is required'],
    trim: true
  },
  industry: {
    type: String,
    required: [true, 'Industry is required'],
    trim: true
  },
  skills: [{
    type: String,
    trim: true
  }],
  benefits: [{
    type: String,
    trim: true
  }],
  deadline: {
    type: Date,
    required: [true, 'Application deadline is required']
  },
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'closed', 'rejected'],
    default: 'pending'
  },
  isRemote: {
    type: Boolean,
    default: false
  },
  isUrgent: {
    type: Boolean,
    default: false
  },
  views: {
    type: Number,
    default: 0
  },
  applications: {
    type: Number,
    default: 0
  },
  tags: [{
    type: String,
    trim: true
  }],
  company: {
    name: {
      type: String,
      required: true
    },
    logo: String,
    website: String,
    size: String,
    industry: String
  }
}, {
  timestamps: true
});

// Index for search functionality
jobSchema.index({ 
  title: 'text', 
  description: 'text', 
  requirements: 'text',
  location: 'text',
  category: 'text',
  industry: 'text',
  skills: 'text'
});

// Virtual for time since posted
jobSchema.virtual('timeSincePosted').get(function() {
  return Date.now() - this.createdAt;
});

// Virtual for days until deadline
jobSchema.virtual('daysUntilDeadline').get(function() {
  return Math.ceil((this.deadline - Date.now()) / (1000 * 60 * 60 * 24));
});

// Method to check if job is expired
jobSchema.methods.isExpired = function() {
  return this.deadline < new Date();
};

// Method to increment views
jobSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

// Method to increment applications
jobSchema.methods.incrementApplications = function() {
  this.applications += 1;
  return this.save();
};

module.exports = mongoose.model('Job', jobSchema);