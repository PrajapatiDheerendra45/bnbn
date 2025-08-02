const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  applicantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  employerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  resume: {
    type: String,
    required: [true, 'Resume is required']
  },
  coverLetter: {
    type: String,
    maxlength: [1000, 'Cover letter cannot exceed 1000 characters']
  },
  status: {
    type: String,
    enum: ['applied', 'reviewing', 'shortlisted', 'interviewed', 'offered', 'rejected', 'withdrawn'],
    default: 'applied'
  },
  appliedAt: {
    type: Date,
    default: Date.now
  },
  reviewedAt: Date,
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  interviewDate: Date,
  interviewLocation: String,
  interviewType: {
    type: String,
    enum: ['phone', 'video', 'in-person']
  },
  salaryExpectation: {
    amount: Number,
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
  availability: {
    type: String,
    enum: ['immediate', '2-weeks', '1-month', '3-months', 'negotiable']
  },
  isWithdrawn: {
    type: Boolean,
    default: false
  },
  withdrawnAt: Date,
  withdrawnReason: String
}, {
  timestamps: true
});

// Compound index to prevent duplicate applications
applicationSchema.index({ jobId: 1, applicantId: 1 }, { unique: true });

// Virtual for application age
applicationSchema.virtual('applicationAge').get(function() {
  return Date.now() - this.appliedAt;
});

// Method to update status
applicationSchema.methods.updateStatus = function(newStatus, reviewedBy = null) {
  this.status = newStatus;
  this.reviewedAt = new Date();
  if (reviewedBy) {
    this.reviewedBy = reviewedBy;
  }
  return this.save();
};

// Method to withdraw application
applicationSchema.methods.withdraw = function(reason = '') {
  this.isWithdrawn = true;
  this.withdrawnAt = new Date();
  this.withdrawnReason = reason;
  this.status = 'withdrawn';
  return this.save();
};

// Pre-save middleware to populate employer ID
applicationSchema.pre('save', async function(next) {
  if (this.isNew) {
    try {
      const Job = mongoose.model('Job');
      const job = await Job.findById(this.jobId);
      if (job) {
        this.employerId = job.postedBy;
      }
    } catch (error) {
      next(error);
    }
  }
  next();
});

module.exports = mongoose.model('Application', applicationSchema);