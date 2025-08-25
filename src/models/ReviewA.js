const mongoose = require('mongoose');

const reviewSchemaA = new mongoose.Schema({
  movie: {
    id: String,
    title: { type: String, required: true },
    year: Number,
    genres: [String],
    directors: [String],
    stars: [String],
    imdb_rating: Number
  },
  user: {
    id: { type: String, required: true },
    name: String
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 10
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
    required: true
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
  // Computed fields
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
  timestamps: true
});

// Pre-save middleware
reviewSchemaA.pre('save', function(next) {
  // Compute review length
  this.review_length = this.review_content ? this.review_content.length : 0;
  
  // Compute helpfulness ratio
  if (this.total_votes > 0) {
    this.helpfulness_ratio = this.helpful_votes / this.total_votes;
  }
  
  next();
});

// Text index
reviewSchemaA.index(
  { review_content: 'text', 'movie.title': 'text' },
  { weights: { review_content: 3, 'movie.title': 2 } }
);

// Other indexes
reviewSchemaA.index({ 'movie.title': 1 });
reviewSchemaA.index({ 'movie.id': 1 });
reviewSchemaA.index({ 'user.id': 1 });
reviewSchemaA.index({ rating: -1 });
reviewSchemaA.index({ review_date: -1 });
reviewSchemaA.index({ 'movie.genres': 1 });
reviewSchemaA.index({ helpful_votes: -1 });
reviewSchemaA.index({ total_votes: -1 });

module.exports = mongoose.model('ReviewA', reviewSchemaA);
