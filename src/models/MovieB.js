const mongoose = require('mongoose');

const movieSchemaB = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  year: {
    type: Number,
    index: true
  },
  genres: [String],
  directors: [String],
  stars: [String],
  imdb_rating: Number,
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
  // Additional metrics
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
  // Timestamps
  first_review_date: {
    type: Date,
    default: null
  },
  last_review_date: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Pre-save middleware
movieSchemaB.pre('save', function(next) {
  // Compute helpfulness ratio
  if (this.total_votes > 0) {
    this.helpfulness_ratio = this.total_helpful_votes / this.total_votes;
  }
  next();
});

// Static methods
movieSchemaB.statics.getTopRated = function(limit = 10, minReviews = 10) {
  return this.find({
    total_reviews: { $gte: minReviews }
  })
  .sort({ average_rating: -1, total_reviews: -1 })
  .limit(limit);
};

movieSchemaB.statics.getMostReviewed = function(limit = 10) {
  return this.find()
  .sort({ total_reviews: -1 })
  .limit(limit);
};

movieSchemaB.statics.getByRatingRange = function(minRating, maxRating, limit = 10) {
  return this.find({
    average_rating: { $gte: minRating, $lte: maxRating }
  })
  .sort({ average_rating: -1 })
  .limit(limit);
};

movieSchemaB.statics.searchByTitle = function(searchTerm, limit = 10) {
  return this.find({
    title: { $regex: searchTerm, $options: 'i' }
  })
  .sort({ average_rating: -1 })
  .limit(limit);
};

// Additional indexes
movieSchemaB.index({ genres: 1 });
movieSchemaB.index({ total_reviews: -1 });

module.exports = mongoose.model('MovieB', movieSchemaB);
