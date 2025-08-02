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
    maxlength: [5000, 'Job description cannot exceed 5000 characters']
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  location: {
    type: String,
    required: [true, 'Job location is required'],
    trim: true
  },
  salaryRange: {
    min: {
      type: Number,
      min: 0
    },
    max: {
      type: Number,
      min: 0
    },
    currency: {
      type: String,
      default: 'INR',
      enum: ['INR', 'USD', 'EUR', 'GBP']
    },
    period: {
      type: String,
      default: 'annual',
      enum: ['hourly', 'monthly', 'annual']
    }
  },
  experience: {
    min: {
      type: Number,
      min: 0,
      max: 50
    },
    max: {
      type: Number,
      min: 0,
      max: 50
    }
  },
  jobType: {
    type: String,
    required: [true, 'Job type is required'],
    enum: ['Full-time', 'Part-time', 'Contract', 'Freelance', 'Internship']
  },
  workMode: {
    type: String,
    enum: ['Remote', 'On-site', 'Hybrid'],
    default: 'On-site'
  },
  category: {
    type: String,
    required: [true, 'Job category is required'],
    enum: [
      'Technology',
      'Finance',
      'Healthcare',
      'Education',
      'Marketing',
      'Sales',
      'Design',
      'Operations',
      'Human Resources',
      'Legal',
      'Consulting',
      'Manufacturing',
      'Retail',
      'Other'
    ]
  },
  skills: [{
    type: String,
    trim: true
  }],
  requirements: [{
    type: String,
    trim: true
  }],
  responsibilities: [{
    type: String,
    trim: true
  }],
  benefits: [{
    type: String,
    trim: true
  }],
  deadline: {
    type: Date,
    required: [true, 'Application deadline is required'],
    validate: {
      validator: function(value) {
        return value > new Date();
      },
      message: 'Deadline must be in the future'
    }
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'closed', 'rejected'],
    default: 'pending'
  },
  isUrgent: {
    type: Boolean,
    default: false
  },
  applicationCount: {
    type: Number,
    default: 0
  },
  views: {
    type: Number,
    default: 0
  },
  
  // SEO and search optimization
  slug: {
    type: String,
    unique: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  
  // Additional details
  companySize: {
    type: String,
    enum: ['1-10', '11-50', '51-200', '201-1000', '1000+']
  },
  educationLevel: {
    type: String,
    enum: ['High School', 'Bachelor\'s', 'Master\'s', 'PhD', 'Any']
  },
  
  // Admin fields
  featuredJob: {
    type: Boolean,
    default: false
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  },
  rejectionReason: {
    type: String
  }
}, {
  timestamps: true
});

// Indexes for performance and search
jobSchema.index({ title: 'text', description: 'text', skills: 'text' });
jobSchema.index({ status: 1 });
jobSchema.index({ category: 1 });
jobSchema.index({ location: 1 });
jobSchema.index({ jobType: 1 });
jobSchema.index({ workMode: 1 });
jobSchema.index({ company: 1 });
jobSchema.index({ deadline: 1 });
jobSchema.index({ createdAt: -1 });
jobSchema.index({ featuredJob: 1, createdAt: -1 });
jobSchema.index({ 'salaryRange.min': 1, 'salaryRange.max': 1 });

// Generate slug before saving
jobSchema.pre('save', function(next) {
  if (this.isNew || this.isModified('title')) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') + '-' + this._id.toString().slice(-6);
  }
  next();
});

// Virtual for checking if job is expired
jobSchema.virtual('isExpired').get(function() {
  return new Date() > this.deadline;
});

// Virtual for days remaining
jobSchema.virtual('daysRemaining').get(function() {
  const today = new Date();
  const deadline = new Date(this.deadline);
  const diffTime = deadline - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
});

// Method to increment view count
jobSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

// Method to increment application count
jobSchema.methods.incrementApplications = function() {
  this.applicationCount += 1;
  return this.save();
};

// Static method to get popular jobs
jobSchema.statics.getPopularJobs = function(limit = 10) {
  return this.find({ status: 'active' })
    .sort({ applicationCount: -1, views: -1 })
    .limit(limit)
    .populate('company', 'companyName logoUrl location');
};

// Static method to get recent jobs
jobSchema.statics.getRecentJobs = function(limit = 10) {
  return this.find({ status: 'active' })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('company', 'companyName logoUrl location');
};

// Static method to get featured jobs
jobSchema.statics.getFeaturedJobs = function(limit = 5) {
  return this.find({ status: 'active', featuredJob: true })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('company', 'companyName logoUrl location');
};

module.exports = mongoose.model('Job', jobSchema);