const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  user_id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  // Aggregated statistics
  total_reviews: {
    type: Number,
    default: 0,
    min: 0
  },
  average_rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 10
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
  // Review statistics
  total_helpful_votes_received: {
    type: Number,
    default: 0
  },
  total_votes_received: {
    type: Number,
    default: 0
  },
  average_review_length: {
    type: Number,
    default: 0
  },
  // Sentiment analysis
  sentiment_distribution: {
    positive: { type: Number, default: 0 },
    negative: { type: Number, default: 0 },
    neutral: { type: Number, default: 0 }
  },
  average_sentiment_score: {
    type: Number,
    default: 0,
    min: -1,
    max: 1
  },
  // Metadata
  first_review_date: {
    type: Date,
    default: null
  },
  last_review_date: {
    type: Date,
    default: null
  },
  // Computed fields
  helpfulness_ratio: {
    type: Number,
    default: 0,
    min: 0,
    max: 1
  },
  review_count: {
    type: Number,
    default: 0,
    index: true
  },
  // User activity metrics
  review_frequency: {
    type: Number,
    default: 0 // reviews per month
  },
  activity_period_days: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for helpfulness ratio removed - using schema field instead

// Pre-save middleware to compute derived fields
userSchema.pre('save', function(next) {
  // Compute helpfulness ratio
  if (this.total_votes_received > 0) {
    this.helpfulness_ratio = this.total_helpful_votes_received / this.total_votes_received;
  }
  
  // Set review count
  this.review_count = this.total_reviews;
  
  // Compute activity period
  if (this.first_review_date && this.last_review_date) {
    const diffTime = Math.abs(this.last_review_date - this.first_review_date);
    this.activity_period_days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Compute review frequency (reviews per month)
    if (this.activity_period_days > 0) {
      this.review_frequency = (this.total_reviews / this.activity_period_days) * 30;
    }
  }
  
  next();
});

// Static method to get top reviewers
userSchema.statics.getTopReviewers = function(limit = 10, minReviews = 5) {
  return this.find({
    total_reviews: { $gte: minReviews }
  })
  .sort({ total_reviews: -1, helpfulness_ratio: -1 })
  .limit(limit);
};

// Static method to get most helpful reviewers
userSchema.statics.getMostHelpfulReviewers = function(limit = 10, minReviews = 5) {
  return this.find({
    total_reviews: { $gte: minReviews },
    total_votes_received: { $gt: 0 }
  })
  .sort({ helpfulness_ratio: -1, total_reviews: -1 })
  .limit(limit);
};

// Static method to get users by rating range
userSchema.statics.getByRatingRange = function(minRating, maxRating, limit = 10) {
  return this.find({
    average_rating: { $gte: minRating, $lte: maxRating }
  })
  .sort({ average_rating: -1 })
  .limit(limit);
};

// Static method to get active users
userSchema.statics.getActiveUsers = function(limit = 10, minReviews = 10) {
  return this.find({
    total_reviews: { $gte: minReviews }
  })
  .sort({ review_frequency: -1, total_reviews: -1 })
  .limit(limit);
};

// Instance method to check if user is a top reviewer
userSchema.methods.isTopReviewer = function() {
  return this.total_reviews >= 50 && this.helpfulness_ratio >= 0.7;
};

// Instance method to get rating percentage
userSchema.methods.getRatingPercentage = function(rating) {
  if (this.total_reviews === 0) return 0;
  return (this.rating_distribution[rating] / this.total_reviews) * 100;
};

// Instance method to get user activity level
userSchema.methods.getActivityLevel = function() {
  if (this.review_frequency >= 5) return 'Very Active';
  if (this.review_frequency >= 2) return 'Active';
  if (this.review_frequency >= 0.5) return 'Moderate';
  return 'Inactive';
};

module.exports = mongoose.model('User', userSchema);
