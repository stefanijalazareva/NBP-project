const mongoose = require('mongoose');
const ReviewA = require('../models/ReviewA');
const ReviewB = require('../models/ReviewB');
const MovieB = require('../models/MovieB');
const UserB = require('../models/UserB');

// Query definitions with implementations for both models
const queries = {
  // Q1: Latest 20 reviews for a given movie title
  Q1: {
    modelA: async ({ title, limit = 20 }) => {
      return ReviewA.find({ 'movie.title': { $regex: title, $options: 'i' } })
        .sort({ review_date: -1 })
        .limit(parseInt(limit));
    },
    modelB: async ({ title, limit = 20 }) => {
      const movie = await MovieB.findOne({ title: { $regex: title, $options: 'i' } });
      if (!movie) return [];
      return ReviewB.find({ movie_id: movie._id })
        .sort({ review_date: -1 })
        .limit(parseInt(limit));
    }
  },

  // Q2: All reviews by a specific user
  Q2: {
    modelA: async ({ userId, username, limit = 100 }) => {
      const query = userId ? { 'user.id': userId } : { 'user.name': username };
      return ReviewA.find(query)
        .sort({ review_date: -1 })
        .limit(parseInt(limit));
    },
    modelB: async ({ userId, username, limit = 100 }) => {
      let user;
      if (username) {
        user = await UserB.findOne({ name: username });
        if (!user) return [];
      }
      return ReviewB.find({ user_id: userId || user._id })
        .sort({ review_date: -1 })
        .limit(parseInt(limit));
    }
  },

  // Q3: Reviews with rating >= X in a date range
  Q3: {
    modelA: async ({ minRating, startDate, endDate, limit = 100 }) => {
      return ReviewA.find({
        rating: { $gte: parseInt(minRating) },
        review_date: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      })
      .sort({ review_date: -1 })
      .limit(parseInt(limit));
    },
    modelB: async ({ minRating, startDate, endDate, limit = 100 }) => {
      return ReviewB.find({
        rating: { $gte: parseInt(minRating) },
        review_date: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      })
      .sort({ review_date: -1 })
      .limit(parseInt(limit));
    }
  },

  // Q4: Top 10 movies by average rating (min N reviews)
  Q4: {
    modelA: async ({ minReviews = 50, limit = 10 }) => {
      return ReviewA.aggregate([
        {
          $group: {
            _id: '$movie.title',
            avgRating: { $avg: '$rating' },
            numReviews: { $sum: 1 }
          }
        },
        {
          $match: {
            numReviews: { $gte: parseInt(minReviews) }
          }
        },
        {
          $sort: { avgRating: -1, numReviews: -1 }
        },
        {
          $limit: parseInt(limit)
        }
      ]);
    },
    modelB: async ({ minReviews = 50, limit = 10 }) => {
      return MovieB.aggregate([
        {
          $lookup: {
            from: 'reviews',
            localField: '_id',
            foreignField: 'movie_id',
            as: 'reviews'
          }
        },
        {
          $project: {
            title: 1,
            avgRating: { $avg: '$reviews.rating' },
            numReviews: { $size: '$reviews' }
          }
        },
        {
          $match: {
            numReviews: { $gte: parseInt(minReviews) }
          }
        },
        {
          $sort: { avgRating: -1, numReviews: -1 }
        },
        {
          $limit: parseInt(limit)
        }
      ]);
    }
  },

  // Q5: Most active 10 reviewers
  Q5: {
    modelA: async ({ limit = 10 }) => {
      return ReviewA.aggregate([
        {
          $group: {
            _id: '$user.id',
            username: { $first: '$user.name' },
            reviewCount: { $sum: 1 }
          }
        },
        {
          $sort: { reviewCount: -1 }
        },
        {
          $limit: parseInt(limit)
        }
      ]);
    },
    modelB: async ({ limit = 10 }) => {
      return UserB.aggregate([
        {
          $lookup: {
            from: 'reviews',
            localField: '_id',
            foreignField: 'user_id',
            as: 'reviews'
          }
        },
        {
          $project: {
            name: 1,
            reviewCount: { $size: '$reviews' }
          }
        },
        {
          $sort: { reviewCount: -1 }
        },
        {
          $limit: parseInt(limit)
        }
      ]);
    }
  },

  // Q6: Text search "great acting" returning top 20 by textScore
  Q6: {
    modelA: async ({ searchText, limit = 20 }) => {
      return ReviewA.find(
        { $text: { $search: searchText } },
        { score: { $meta: 'textScore' } }
      )
      .sort({ score: { $meta: 'textScore' }, rating: -1 })
      .limit(parseInt(limit));
    },
    modelB: async ({ searchText, limit = 20 }) => {
      return ReviewB.find(
        { $text: { $search: searchText } },
        { score: { $meta: 'textScore' } }
      )
      .sort({ score: { $meta: 'textScore' }, rating: -1 })
      .limit(parseInt(limit));
    }
  },

  // Q7: Rating distribution per genre
  Q7: {
    modelA: async () => {
      return ReviewA.aggregate([
        {
          $unwind: '$movie.genres'
        },
        {
          $group: {
            _id: {
              genre: '$movie.genres',
              bucket: {
                $switch: {
                  branches: [
                    { case: { $lte: ['$rating', 2] }, then: '0-2' },
                    { case: { $lte: ['$rating', 4] }, then: '2-4' },
                    { case: { $lte: ['$rating', 6] }, then: '4-6' },
                    { case: { $lte: ['$rating', 8] }, then: '6-8' },
                    { case: { $lte: ['$rating', 10] }, then: '8-10' }
                  ],
                  default: 'invalid'
                }
              }
            },
            count: { $sum: 1 }
          }
        },
        {
          $group: {
            _id: '$_id.genre',
            distribution: {
              $push: {
                bucket: '$_id.bucket',
                count: '$count'
              }
            }
          }
        }
      ]);
    },
    modelB: async () => {
      return MovieB.aggregate([
        {
          $unwind: '$genres'
        },
        {
          $lookup: {
            from: 'reviews',
            localField: '_id',
            foreignField: 'movie_id',
            as: 'reviews'
          }
        },
        {
          $unwind: '$reviews'
        },
        {
          $group: {
            _id: {
              genre: '$genres',
              bucket: {
                $switch: {
                  branches: [
                    { case: { $lte: ['$reviews.rating', 2] }, then: '0-2' },
                    { case: { $lte: ['$reviews.rating', 4] }, then: '2-4' },
                    { case: { $lte: ['$reviews.rating', 6] }, then: '4-6' },
                    { case: { $lte: ['$reviews.rating', 8] }, then: '6-8' },
                    { case: { $lte: ['$reviews.rating', 10] }, then: '8-10' }
                  ],
                  default: 'invalid'
                }
              }
            },
            count: { $sum: 1 }
          }
        },
        {
          $group: {
            _id: '$_id.genre',
            distribution: {
              $push: {
                bucket: '$_id.bucket',
                count: '$count'
              }
            }
          }
        }
      ]);
    }
  },

  // Q8: Monthly trend for a selected movie
  Q8: {
    modelA: async ({ title }) => {
      return ReviewA.aggregate([
        {
          $match: {
            'movie.title': { $regex: title, $options: 'i' }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$review_date' },
              month: { $month: '$review_date' }
            },
            count: { $sum: 1 },
            avgRating: { $avg: '$rating' }
          }
        },
        {
          $sort: { '_id.year': 1, '_id.month': 1 }
        }
      ]);
    },
    modelB: async ({ title }) => {
      const movie = await MovieB.findOne({ title: { $regex: title, $options: 'i' } });
      if (!movie) return [];

      return ReviewB.aggregate([
        {
          $match: {
            movie_id: movie._id
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$review_date' },
              month: { $month: '$review_date' }
            },
            count: { $sum: 1 },
            avgRating: { $avg: '$rating' }
          }
        },
        {
          $sort: { '_id.year': 1, '_id.month': 1 }
        }
      ]);
    }
  },

  // Q9: Top 10 movies by helpfulness
  Q9: {
    modelA: async ({ minVotes = 10, limit = 10 }) => {
      return ReviewA.aggregate([
        {
          $match: {
            total_votes: { $gte: parseInt(minVotes) }
          }
        },
        {
          $group: {
            _id: '$movie.title',
            avgRating: { $avg: '$rating' },
            totalHelpfulVotes: { $sum: '$helpful_votes' },
            totalVotes: { $sum: '$total_votes' }
          }
        },
        {
          $project: {
            _id: 1,
            avgRating: 1,
            helpfulnessScore: {
              $divide: ['$totalHelpfulVotes', '$totalVotes']
            }
          }
        },
        {
          $sort: { helpfulnessScore: -1, avgRating: -1 }
        },
        {
          $limit: parseInt(limit)
        }
      ]);
    },
    modelB: async ({ minVotes = 10, limit = 10 }) => {
      return MovieB.aggregate([
        {
          $lookup: {
            from: 'reviews',
            localField: '_id',
            foreignField: 'movie_id',
            as: 'reviews'
          }
        },
        {
          $unwind: '$reviews'
        },
        {
          $match: {
            'reviews.total_votes': { $gte: parseInt(minVotes) }
          }
        },
        {
          $group: {
            _id: '$title',
            avgRating: { $avg: '$reviews.rating' },
            totalHelpfulVotes: { $sum: '$reviews.helpful_votes' },
            totalVotes: { $sum: '$reviews.total_votes' }
          }
        },
        {
          $project: {
            _id: 1,
            avgRating: 1,
            helpfulnessScore: {
              $divide: ['$totalHelpfulVotes', '$totalVotes']
            }
          }
        },
        {
          $sort: { helpfulnessScore: -1, avgRating: -1 }
        },
        {
          $limit: parseInt(limit)
        }
      ]);
    }
  },

  // Q10: "Cold start" movie discovery
  Q10: {
    modelA: async ({ minReviews = 3, minRating = 8.5, limit = 10 }) => {
      return ReviewA.aggregate([
        {
          $group: {
            _id: {
              title: '$movie.title',
              year: '$movie.year'
            },
            avgRating: { $avg: '$rating' },
            numReviews: { $sum: 1 }
          }
        },
        {
          $match: {
            numReviews: { $gte: parseInt(minReviews) },
            avgRating: { $gte: parseFloat(minRating) }
          }
        },
        {
          $sort: { '_id.year': -1, avgRating: -1 }
        },
        {
          $limit: parseInt(limit)
        }
      ]);
    },
    modelB: async ({ minReviews = 3, minRating = 8.5, limit = 10 }) => {
      return MovieB.aggregate([
        {
          $lookup: {
            from: 'reviews',
            localField: '_id',
            foreignField: 'movie_id',
            as: 'reviews'
          }
        },
        {
          $project: {
            title: 1,
            year: 1,
            avgRating: { $avg: '$reviews.rating' },
            numReviews: { $size: '$reviews' }
          }
        },
        {
          $match: {
            numReviews: { $gte: parseInt(minReviews) },
            avgRating: { $gte: parseFloat(minRating) }
          }
        },
        {
          $sort: { year: -1, avgRating: -1 }
        },
        {
          $limit: parseInt(limit)
        }
      ]);
    }
  }
};

// Execute a specific query
async function executeQuery(queryId, model, params) {
  const queryFunction = queries[queryId]?.[`model${model}`];
  
  if (!queryFunction) {
    throw new Error(`Query ${queryId} for model ${model} not found`);
  }

  return queryFunction(params);
}

module.exports = {
  executeQuery,
  queries
};
