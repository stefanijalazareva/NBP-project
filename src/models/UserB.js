const mongoose = require('mongoose');

const userSchemaB = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  // Aggregated statistics
  total_reviews: {
    type: Number,
    default: 0,
    index: true
  },
  average_rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 10,
    index: true
  },
  rating_distribution: {
    '1': { type: Number, default: 0 },
    '2': { type: Number, default: 0 },
    '3': { type: Number, default: 0 },
    '4': { type: Number, default: 0 },
    '5': { type: Number, default: 0 },
    '6': { type: Number, default: 0 },
    '7': { type: Number, default: 0 },
    '8': { type: Number, default: 0 },
    '9': { type: Number, default: 0 },
    '10': { type: Number, default: 0 }
  },
  // Review metrics
  total_helpful_votes: {
    type: Number,
    default: 0
  },
  total_votes: {
    type: Number,
    default: 0
  },
  helpfulness_ratio: {
    type: Number,
    default: 0,
    min: 0,
    max: 1,
    index: true
  },
  // Activity tracking
  first_review_date: {
    type: Date,
    default: null
  },
  last_review_date: {
    type: Date,
    default: null
  },
  activity_period_days: {
    type: Number,
    default: 0
  },
  review_frequency: {
    type: Number,
    default: 0,
    index: true
  }
}, {
  timestamps: true
});

// Pre-save middleware
userSchemaB.pre('save', function(next) {
  // Compute helpfulness ratio
  if (this.total_votes > 0) {
    this.helpfulness_ratio = this.total_helpful_votes / this.total_votes;
  }

  // Compute activity period and review frequency
  if (this.first_review_date && this.last_review_date) {
    const diffTime = Math.abs(this.last_review_date - this.first_review_date);
    this.activity_period_days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (this.activity_period_days > 0) {
      this.review_frequency = (this.total_reviews / this.activity_period_days) * 30; // Reviews per month
    }
  }

  next();
});

// Static methods
userSchemaB.statics.getTopReviewers = function(limit = 10, minReviews = 5) {
  return this.find({
    total_reviews: { $gte: minReviews }
  })
  .sort({ total_reviews: -1, helpfulness_ratio: -1 })
  .limit(limit);
};

userSchemaB.statics.getMostHelpfulReviewers = function(limit = 10, minReviews = 5) {
  return this.find({
    total_reviews: { $gte: minReviews },
    total_votes: { $gt: 0 }
  })
  .sort({ helpfulness_ratio: -1, total_votes: -1 })
  .limit(limit);
};

userSchemaB.statics.getByRatingRange = function(minRating, maxRating, limit = 10) {
  return this.find({
    average_rating: { $gte: minRating, $lte: maxRating }
  })
  .sort({ average_rating: -1 })
  .limit(limit);
};

userSchemaB.statics.getMostActive = function(limit = 10, minReviews = 5) {
  return this.find({
    total_reviews: { $gte: minReviews }
  })
  .sort({ review_frequency: -1, total_reviews: -1 })
  .limit(limit);
};

// Instance methods
userSchemaB.methods.isTopReviewer = function() {
  return this.total_reviews >= 50 && this.helpfulness_ratio >= 0.7;
};

userSchemaB.methods.getRatingPercentage = function(rating) {
  if (this.total_reviews === 0) return 0;
  return (this.rating_distribution[rating] / this.total_reviews) * 100;
};

// Additional indexes
userSchemaB.index({ 'average_rating': -1 });
userSchemaB.index({ 'last_review_date': -1 });

module.exports = mongoose.model('UserB', userSchemaB);
