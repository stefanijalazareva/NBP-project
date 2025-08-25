const ReviewA = require('../models/ReviewA');
const ReviewB = require('../models/ReviewB');
const MovieB = require('../models/MovieB');
const UserB = require('../models/UserB');

// Index definitions for both models
const indexes = {
  A: {
    reviews: [
      { key: { 'movie.title': 1 } },
      { key: { 'movie.id': 1 } },
      { key: { 'user.id': 1 } },
      { key: { rating: -1 } },
      { key: { review_date: -1 } },
      { key: { 'movie.genres': 1 } },
      { key: { helpful_votes: -1 } },
      { key: { total_votes: -1 } },
      {
        key: { review_content: 'text', 'movie.title': 'text' },
        weights: { review_content: 3, 'movie.title': 2 }
      }
    ]
  },
  B: {
    reviews: [
      { key: { movie_id: 1 } },
      { key: { user_id: 1 } },
      { key: { rating: -1 } },
      { key: { review_date: -1 } },
      { key: { helpful_votes: -1 } },
      { key: { total_votes: -1 } },
      {
        key: { review_content: 'text' },
        weights: { review_content: 1 }
      }
    ],
    movies: [
      { key: { title: 1 } },
      { key: { year: -1 } },
      { key: { genres: 1 } }
    ],
    users: [
      { key: { name: 1 } }
    ]
  }
};

// Create indexes for a specific model
async function createIndexes(model) {
  console.log(`Creating indexes for Model ${model}...`);
  
  if (model === 'A') {
    for (const index of indexes.A.reviews) {
      await ReviewA.collection.createIndex(index.key, index.weights ? { weights: index.weights } : {});
    }
  } else {
    for (const index of indexes.B.reviews) {
      await ReviewB.collection.createIndex(index.key, index.weights ? { weights: index.weights } : {});
    }
    for (const index of indexes.B.movies) {
      await MovieB.collection.createIndex(index.key);
    }
    for (const index of indexes.B.users) {
      await UserB.collection.createIndex(index.key);
    }
  }
  
  console.log(`Indexes created for Model ${model}`);
}

// Drop indexes for a specific model
async function dropIndexes(model) {
  console.log(`Dropping indexes for Model ${model}...`);
  
  if (model === 'A') {
    await ReviewA.collection.dropIndexes();
  } else {
    await ReviewB.collection.dropIndexes();
    await MovieB.collection.dropIndexes();
    await UserB.collection.dropIndexes();
  }
  
  console.log(`Indexes dropped for Model ${model}`);
}

module.exports = {
  createIndexes,
  dropIndexes
};
