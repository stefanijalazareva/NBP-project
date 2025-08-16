const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user_id: {
    type: String,
    required: true,
    index: true
  },
  movie_title: {
    type: String,
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
    required: true,
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
    min: 0
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
  // Computed fields for analytics
  helpfulness_ratio: {
    type: Number,
    default: 0,
    min: 0,
    max: 1
  },
  review_length: {
    type: Number,
    default: 0
  },
  // Sentiment analysis fields (if available)
  sentiment_score: {
    type: Number,
    default: null,
    min: -1,
    max: 1
  },
  sentiment_label: {
    type: String,
    enum: ['positive', 'negative', 'neutral', null],
    default: null
  },
  // Movie metadata fields (from IBM dataset)
  movie_imdb_rating: {
    type: Number,
    default: null,
    min: 0,
    max: 10
  },
  movie_genres: [{
    type: String
  }],
  movie_directors: [{
    type: String
  }],
  movie_stars: [{
    type: String
  }],
  movie_year: {
    type: Number,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for helpfulness ratio removed - using schema field instead

// Pre-save middleware to compute derived fields
reviewSchema.pre('save', function(next) {
  // Compute review length
  this.review_length = this.review_content ? this.review_content.length : 0;
  
  // Compute helpfulness ratio
  if (this.total_votes > 0) {
    this.helpfulness_ratio = this.helpful_votes / this.total_votes;
  }
  
  next();
});

// Static method to get reviews by movie
reviewSchema.statics.findByMovie = function(movieTitle, limit = 10) {
  return this.find({ 
    movie_title: { $regex: movieTitle, $options: 'i' } 
  })
  .sort({ review_date: -1 })
  .limit(limit);
};

// Static method to get reviews by user
reviewSchema.statics.findByUser = function(userId, limit = 10) {
  return this.find({ user_id: userId })
  .sort({ review_date: -1 })
  .limit(limit);
};

// Static method to get reviews by rating range
reviewSchema.statics.findByRatingRange = function(minRating, maxRating, limit = 10) {
  return this.find({
    rating: { $gte: minRating, $lte: maxRating }
  })
  .sort({ review_date: -1 })
  .limit(limit);
};

// Instance method to check if review is helpful
reviewSchema.methods.isHelpful = function() {
  return this.helpfulness_ratio >= 0.5;
};

module.exports = mongoose.model('Review', reviewSchema);
