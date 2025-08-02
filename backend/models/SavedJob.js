const mongoose = require('mongoose');

const savedJobSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  tags: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

// Compound index to prevent duplicate saves
savedJobSchema.index({ user: 1, job: 1 }, { unique: true });

// Index for user queries
savedJobSchema.index({ user: 1, createdAt: -1 });

// Static method to get saved jobs by user
savedJobSchema.statics.getByUser = function(userId, page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  
  return this.find({ user: userId })
    .populate({
      path: 'job',
      select: 'title company location salaryRange jobType deadline status createdAt',
      populate: {
        path: 'company',
        select: 'companyName logoUrl'
      }
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

// Static method to check if job is saved by user
savedJobSchema.statics.isSaved = function(userId, jobId) {
  return this.findOne({ user: userId, job: jobId });
};

module.exports = mongoose.model('SavedJob', savedJobSchema);