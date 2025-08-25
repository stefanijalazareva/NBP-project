const mongoose = require('mongoose');

const reviewSchemaB = new mongoose.Schema({
  movie_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MovieB',
    required: true,
    index: true
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserB',
    required: true,
    index: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 10,
    index: true
  },
  review_title: {
    type: String,
    maxlength: 500
  },
  review_content: {
    type: String,
    required: true,
    maxlength: 10000
  },
  review_date: {
    type: Date,
    required: true,
    index: true
  },
  helpful_votes: {
    type: Number,
    default: 0,
    min: 0,
    index: true
  },
  total_votes: {
    type: Number,
    default: 0,
    min: 0
  },
  spoiler_tag: {
    type: Boolean,
    default: false
  },
  verified_purchase: {
    type: Boolean,
    default: false
  },
  // Computed fields
  helpfulness_ratio: {
    type: Number,
    default: 0,
    min: 0,
    max: 1,
    index: true
  },
  review_length: {
    type: Number,
    default: 0
  },
  sentiment_score: {
    type: Number,
    min: -1,
    max: 1,
    default: null
  },
  sentiment_label: {
    type: String,
    enum: ['positive', 'negative', 'neutral', null],
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtuals
reviewSchemaB.virtual('movie', {
  ref: 'MovieB',
  localField: 'movie_id',
  foreignField: '_id',
  justOne: true
});

reviewSchemaB.virtual('user', {
  ref: 'UserB',
  localField: 'user_id',
  foreignField: '_id',
  justOne: true
});

// Pre-save middleware
reviewSchemaB.pre('save', function(next) {
  // Compute review length
  this.review_length = this.review_content ? this.review_content.length : 0;
  
  // Compute helpfulness ratio
  if (this.total_votes > 0) {
    this.helpfulness_ratio = this.helpful_votes / this.total_votes;
  }
  
  next();
});

// Static methods
reviewSchemaB.statics.findByMovie = function(movieId, limit = 10) {
  return this.find({ movie_id: movieId })
    .sort({ review_date: -1 })
    .limit(limit)
    .populate('movie user');
};

reviewSchemaB.statics.findByUser = function(userId, limit = 10) {
  return this.find({ user_id: userId })
    .sort({ review_date: -1 })
    .limit(limit)
    .populate('movie user');
};

reviewSchemaB.statics.findHelpful = function(minVotes = 5, limit = 10) {
  return this.find({
    total_votes: { $gte: minVotes }
  })
    .sort({ helpfulness_ratio: -1, total_votes: -1 })
    .limit(limit)
    .populate('movie user');
};

reviewSchemaB.statics.findByRating = function(minRating, maxRating, limit = 10) {
  return this.find({
    rating: { $gte: minRating, $lte: maxRating }
  })
    .sort({ review_date: -1 })
    .limit(limit)
    .populate('movie user');
};

reviewSchemaB.statics.findRecent = function(days = 30, limit = 10) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  return this.find({
    review_date: { $gte: cutoffDate }
  })
    .sort({ review_date: -1 })
    .limit(limit)
    .populate('movie user');
};

// Instance methods
reviewSchemaB.methods.isHelpful = function() {
  return this.helpfulness_ratio >= 0.7 && this.total_votes >= 5;
};

reviewSchemaB.methods.isVerifiedLongReview = function() {
  return this.verified_purchase && this.review_length >= 500;
};

// Compound indexes
reviewSchemaB.index({ movie_id: 1, review_date: -1 });
reviewSchemaB.index({ user_id: 1, review_date: -1 });
reviewSchemaB.index({ helpfulness_ratio: -1, total_votes: -1 });
reviewSchemaB.index({ rating: -1, review_date: -1 });

// Text index for review content with weights
reviewSchemaB.index(
  { review_content: 'text', review_title: 'text' },
  { weights: { review_content: 3, review_title: 2 } }
);

module.exports = mongoose.model('ReviewB', reviewSchemaB);
