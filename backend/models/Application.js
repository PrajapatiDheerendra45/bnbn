const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  applicant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  resume: {
    url: {
      type: String,
      required: [true, 'Resume is required']
    },
    filename: String,
    size: Number,
    mimetype: String
  },
  coverLetter: {
    type: String,
    maxlength: [2000, 'Cover letter cannot exceed 2000 characters']
  },
  status: {
    type: String,
    enum: ['applied', 'reviewed', 'shortlisted', 'interviewed', 'selected', 'rejected'],
    default: 'applied'
  },
  
  // Additional information
  expectedSalary: {
    amount: Number,
    currency: {
      type: String,
      default: 'INR'
    }
  },
  availableFrom: {
    type: Date
  },
  noticePeriod: {
    type: String,
    enum: ['Immediate', '15 days', '1 month', '2 months', '3 months', 'Other']
  },
  
  // Employer actions
  employerNotes: {
    type: String,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  reviewedAt: {
    type: Date
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Interview scheduling
  interview: {
    scheduled: {
      type: Boolean,
      default: false
    },
    dateTime: Date,
    mode: {
      type: String,
      enum: ['In-person', 'Video call', 'Phone call']
    },
    location: String,
    meetingLink: String,
    interviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    feedback: String,
    result: {
      type: String,
      enum: ['pending', 'passed', 'failed']
    }
  },
  
  // Tracking
  source: {
    type: String,
    enum: ['direct', 'search', 'recommendation', 'notification'],
    default: 'direct'
  },
  withdrawnAt: {
    type: Date
  },
  withdrawalReason: {
    type: String
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate applications
applicationSchema.index({ job: 1, applicant: 1 }, { unique: true });

// Other indexes for performance
applicationSchema.index({ applicant: 1, createdAt: -1 });
applicationSchema.index({ job: 1, status: 1 });
applicationSchema.index({ status: 1, createdAt: -1 });
applicationSchema.index({ createdAt: -1 });

// Virtual for application age in days
applicationSchema.virtual('ageInDays').get(function() {
  const today = new Date();
  const applicationDate = new Date(this.createdAt);
  const diffTime = today - applicationDate;
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
});

// Method to update status with timestamp
applicationSchema.methods.updateStatus = function(newStatus, reviewerId = null) {
  this.status = newStatus;
  this.reviewedAt = new Date();
  if (reviewerId) {
    this.reviewedBy = reviewerId;
  }
  return this.save();
};

// Method to schedule interview
applicationSchema.methods.scheduleInterview = function(interviewData) {
  this.interview = {
    ...this.interview,
    ...interviewData,
    scheduled: true
  };
  this.status = 'interviewed';
  return this.save();
};

// Method to withdraw application
applicationSchema.methods.withdraw = function(reason = '') {
  this.status = 'rejected';
  this.withdrawnAt = new Date();
  this.withdrawalReason = reason;
  return this.save();
};

// Static method to get applications by job
applicationSchema.statics.getByJob = function(jobId, status = null) {
  const query = { job: jobId };
  if (status) query.status = status;
  
  return this.find(query)
    .populate('applicant', 'name email phone skills experience location')
    .sort({ createdAt: -1 });
};

// Static method to get applications by user
applicationSchema.statics.getByUser = function(userId, status = null) {
  const query = { applicant: userId };
  if (status) query.status = status;
  
  return this.find(query)
    .populate('job', 'title company location salaryRange jobType status')
    .populate({
      path: 'job',
      populate: {
        path: 'company',
        select: 'companyName logoUrl'
      }
    })
    .sort({ createdAt: -1 });
};

// Static method to get application statistics
applicationSchema.statics.getStats = function(filters = {}) {
  const pipeline = [
    { $match: filters },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ];
  
  return this.aggregate(pipeline);
};

// Pre-save middleware to validate application deadline
applicationSchema.pre('save', async function(next) {
  if (this.isNew) {
    try {
      const Job = mongoose.model('Job');
      const job = await Job.findById(this.job);
      
      if (!job) {
        return next(new Error('Job not found'));
      }
      
      if (new Date() > job.deadline) {
        return next(new Error('Application deadline has passed'));
      }
      
      if (job.status !== 'active') {
        return next(new Error('Job is not active for applications'));
      }
      
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

module.exports = mongoose.model('Application', applicationSchema);