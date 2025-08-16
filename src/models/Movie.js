const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema({
  title: {
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
  total_helpful_votes: {
    type: Number,
    default: 0
  },
  total_votes: {
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
movieSchema.pre('save', function(next) {
  // Compute helpfulness ratio
  if (this.total_votes > 0) {
    this.helpfulness_ratio = this.total_helpful_votes / this.total_votes;
  }
  
  // Set review count
  this.review_count = this.total_reviews;
  
  next();
});

// Static method to get top rated movies
movieSchema.statics.getTopRated = function(limit = 10, minReviews = 10) {
  return this.find({
    total_reviews: { $gte: minReviews }
  })
  .sort({ average_rating: -1, total_reviews: -1 })
  .limit(limit);
};

// Static method to get most reviewed movies
movieSchema.statics.getMostReviewed = function(limit = 10) {
  return this.find()
  .sort({ total_reviews: -1 })
  .limit(limit);
};

// Static method to get movies by rating range
movieSchema.statics.getByRatingRange = function(minRating, maxRating, limit = 10) {
  return this.find({
    average_rating: { $gte: minRating, $lte: maxRating }
  })
  .sort({ average_rating: -1 })
  .limit(limit);
};

// Static method to search movies by title
movieSchema.statics.searchByTitle = function(searchTerm, limit = 10) {
  return this.find({
    title: { $regex: searchTerm, $options: 'i' }
  })
  .sort({ average_rating: -1 })
  .limit(limit);
};

// Instance method to check if movie is highly rated
movieSchema.methods.isHighlyRated = function() {
  return this.average_rating >= 7.5 && this.total_reviews >= 10;
};

// Instance method to get rating percentage
movieSchema.methods.getRatingPercentage = function(rating) {
  if (this.total_reviews === 0) return 0;
  return (this.rating_distribution[rating] / this.total_reviews) * 100;
};

module.exports = mongoose.model('Movie', movieSchema);
