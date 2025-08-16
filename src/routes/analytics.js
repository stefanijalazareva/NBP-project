const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Movie = require('../models/Movie');
const User = require('../models/User');

// ===== COMPLEX ANALYTICS QUERIES =====

// 1. Get overall platform statistics
router.get('/overview', async (req, res) => {
  try {
    const startTime = Date.now();

    const overview = await Review.aggregate([
      {
        $group: {
          _id: null,
          totalReviews: { $sum: 1 },
          averageRating: { $avg: '$rating' },
          totalUsers: { $addToSet: '$user_id' },
          totalMovies: { $addToSet: '$movie_title' },
          totalHelpfulVotes: { $sum: '$helpful_votes' },
          totalVotes: { $sum: '$total_votes' },
          averageReviewLength: { $avg: '$review_length' },
          minRating: { $min: '$rating' },
          maxRating: { $max: '$rating' },
          firstReviewDate: { $min: '$review_date' },
          lastReviewDate: { $max: '$review_date' }
        }
      },
      {
        $project: {
          _id: 0,
          totalReviews: 1,
          averageRating: { $round: ['$averageRating', 2] },
          uniqueUsers: { $size: '$totalUsers' },
          uniqueMovies: { $size: '$totalMovies' },
          totalHelpfulVotes: 1,
          totalVotes: 1,
          averageReviewLength: { $round: ['$averageReviewLength', 0] },
          minRating: 1,
          maxRating: 1,
          firstReviewDate: 1,
          lastReviewDate: 1,
          helpfulnessRatio: {
            $cond: [
              { $eq: ['$totalVotes', 0] },
              0,
              { $divide: ['$totalHelpfulVotes', '$totalVotes'] }
            ]
          }
        }
      }
    ]);

    const executionTime = Date.now() - startTime;

    res.json({
      success: true,
      data: overview[0] || {},
      performance: {
        executionTime: `${executionTime}ms`
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2. Get rating distribution across all reviews
router.get('/rating-distribution', async (req, res) => {
  try {
    const startTime = Date.now();

    const ratingDistribution = await Review.aggregate([
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 },
          percentage: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$count' },
          ratings: {
            $push: {
              rating: '$_id',
              count: '$count'
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          total: 1,
          ratings: {
            $map: {
              input: '$ratings',
              as: 'rating',
              in: {
                rating: '$$rating.rating',
                count: '$$rating.count',
                percentage: {
                  $round: [
                    { $multiply: [{ $divide: ['$$rating.count', '$total'] }, 100] },
                    2
                  ]
                }
              }
            }
          }
        }
      }
    ]);

    const executionTime = Date.now() - startTime;

    res.json({
      success: true,
      data: ratingDistribution[0] || {},
      performance: {
        executionTime: `${executionTime}ms`
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 3. Get top movies by average rating (with minimum review threshold)
router.get('/top-movies', async (req, res) => {
  try {
    const { limit = 10, minReviews = 10 } = req.query;
    const startTime = Date.now();

    const topMovies = await Review.aggregate([
      {
        $group: {
          _id: '$movie_title',
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
          totalHelpfulVotes: { $sum: '$helpful_votes' },
          totalVotes: { $sum: '$total_votes' },
          averageReviewLength: { $avg: '$review_length' }
        }
      },
      {
        $match: {
          totalReviews: { $gte: parseInt(minReviews) }
        }
      },
      {
        $project: {
          _id: 0,
          movieTitle: '$_id',
          averageRating: { $round: ['$averageRating', 2] },
          totalReviews: 1,
          totalHelpfulVotes: 1,
          totalVotes: 1,
          averageReviewLength: { $round: ['$averageReviewLength', 0] },
          helpfulnessRatio: {
            $cond: [
              { $eq: ['$totalVotes', 0] },
              0,
              { $divide: ['$totalHelpfulVotes', '$totalVotes'] }
            ]
          }
        }
      },
      {
        $sort: { averageRating: -1, totalReviews: -1 }
      },
      {
        $limit: parseInt(limit)
      }
    ]);

    const executionTime = Date.now() - startTime;

    res.json({
      success: true,
      data: topMovies,
      performance: {
        executionTime: `${executionTime}ms`
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 4. Get top reviewers by number of reviews and helpfulness
router.get('/top-reviewers', async (req, res) => {
  try {
    const { limit = 10, minReviews = 5 } = req.query;
    const startTime = Date.now();

    const topReviewers = await Review.aggregate([
      {
        $group: {
          _id: '$user_id',
          totalReviews: { $sum: 1 },
          averageRating: { $avg: '$rating' },
          totalHelpfulVotes: { $sum: '$helpful_votes' },
          totalVotes: { $sum: '$total_votes' },
          averageReviewLength: { $avg: '$review_length' },
          firstReviewDate: { $min: '$review_date' },
          lastReviewDate: { $max: '$review_date' }
        }
      },
      {
        $match: {
          totalReviews: { $gte: parseInt(minReviews) }
        }
      },
      {
        $project: {
          _id: 0,
          userId: '$_id',
          totalReviews: 1,
          averageRating: { $round: ['$averageRating', 2] },
          totalHelpfulVotes: 1,
          totalVotes: 1,
          averageReviewLength: { $round: ['$averageReviewLength', 0] },
          firstReviewDate: 1,
          lastReviewDate: 1,
          helpfulnessRatio: {
            $cond: [
              { $eq: ['$totalVotes', 0] },
              0,
              { $divide: ['$totalHelpfulVotes', '$totalVotes'] }
            ]
          },
          activityPeriodDays: {
            $ceil: {
              $divide: [
                { $subtract: ['$lastReviewDate', '$firstReviewDate'] },
                1000 * 60 * 60 * 24
              ]
            }
          }
        }
      },
      {
        $sort: { totalReviews: -1, helpfulnessRatio: -1 }
      },
      {
        $limit: parseInt(limit)
      }
    ]);

    const executionTime = Date.now() - startTime;

    res.json({
      success: true,
      data: topReviewers,
      performance: {
        executionTime: `${executionTime}ms`
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 5. Get monthly review trends
router.get('/monthly-trends', async (req, res) => {
  try {
    const { months = 12 } = req.query;
    const startTime = Date.now();

    const monthlyTrends = await Review.aggregate([
      {
        $match: {
          review_date: {
            $gte: new Date(Date.now() - parseInt(months) * 30 * 24 * 60 * 60 * 1000)
          }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$review_date' },
            month: { $month: '$review_date' }
          },
          totalReviews: { $sum: 1 },
          averageRating: { $avg: '$rating' },
          uniqueUsers: { $addToSet: '$user_id' },
          uniqueMovies: { $addToSet: '$movie_title' },
          totalHelpfulVotes: { $sum: '$helpful_votes' },
          totalVotes: { $sum: '$total_votes' }
        }
      },
      {
        $project: {
          _id: 0,
          year: '$_id.year',
          month: '$_id.month',
          totalReviews: 1,
          averageRating: { $round: ['$averageRating', 2] },
          uniqueUsers: { $size: '$uniqueUsers' },
          uniqueMovies: { $size: '$uniqueMovies' },
          totalHelpfulVotes: 1,
          totalVotes: 1,
          helpfulnessRatio: {
            $cond: [
              { $eq: ['$totalVotes', 0] },
              0,
              { $divide: ['$totalHelpfulVotes', '$totalVotes'] }
            ]
          }
        }
      },
      {
        $sort: { year: 1, month: 1 }
      }
    ]);

    const executionTime = Date.now() - startTime;

    res.json({
      success: true,
      data: monthlyTrends,
      performance: {
        executionTime: `${executionTime}ms`
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 6. Get sentiment analysis distribution (if available)
router.get('/sentiment-distribution', async (req, res) => {
  try {
    const startTime = Date.now();

    const sentimentDistribution = await Review.aggregate([
      {
        $match: {
          sentiment_label: { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: '$sentiment_label',
          count: { $sum: 1 },
          averageRating: { $avg: '$rating' },
          averageSentimentScore: { $avg: '$sentiment_score' }
        }
      },
      {
        $project: {
          _id: 0,
          sentiment: '$_id',
          count: 1,
          averageRating: { $round: ['$averageRating', 2] },
          averageSentimentScore: { $round: ['$averageSentimentScore', 3] }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    const executionTime = Date.now() - startTime;

    res.json({
      success: true,
      data: sentimentDistribution,
      performance: {
        executionTime: `${executionTime}ms`
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 7. Get movie genre analysis (based on title patterns)
router.get('/genre-analysis', async (req, res) => {
  try {
    const startTime = Date.now();

    // Define genre patterns (simplified)
    const genrePatterns = {
      'Action': /action|adventure|thriller|war/i,
      'Comedy': /comedy|funny|humor/i,
      'Drama': /drama|romance|romantic/i,
      'Horror': /horror|scary|frightening/i,
      'Sci-Fi': /sci-fi|science fiction|futuristic/i,
      'Documentary': /documentary|docu/i,
      'Animation': /animation|animated|cartoon/i
    };

    const genreAnalysis = await Review.aggregate([
      {
        $group: {
          _id: '$movie_title',
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
          totalHelpfulVotes: { $sum: '$helpful_votes' },
          totalVotes: { $sum: '$total_votes' }
        }
      },
      {
        $project: {
          _id: 0,
          movieTitle: '$_id',
          averageRating: { $round: ['$averageRating', 2] },
          totalReviews: 1,
          totalHelpfulVotes: 1,
          totalVotes: 1,
          helpfulnessRatio: {
            $cond: [
              { $eq: ['$totalVotes', 0] },
              0,
              { $divide: ['$totalHelpfulVotes', '$totalVotes'] }
            ]
          }
        }
      }
    ]);

    // Process genres manually since MongoDB doesn't support regex in aggregation easily
    const genreStats = {};
    
    for (const movie of genreAnalysis) {
      let matchedGenre = 'Other';
      
      for (const [genre, pattern] of Object.entries(genrePatterns)) {
        if (pattern.test(movie.movieTitle)) {
          matchedGenre = genre;
          break;
        }
      }
      
      if (!genreStats[matchedGenre]) {
        genreStats[matchedGenre] = {
          totalMovies: 0,
          totalReviews: 0,
          averageRating: 0,
          totalHelpfulVotes: 0,
          totalVotes: 0
        };
      }
      
      genreStats[matchedGenre].totalMovies++;
      genreStats[matchedGenre].totalReviews += movie.totalReviews;
      genreStats[matchedGenre].totalHelpfulVotes += movie.totalHelpfulVotes;
      genreStats[matchedGenre].totalVotes += movie.totalVotes;
    }

    // Calculate averages
    for (const genre in genreStats) {
      const stats = genreStats[genre];
      stats.averageRating = stats.totalReviews > 0 ? 
        (genreAnalysis
          .filter(m => {
            for (const [g, pattern] of Object.entries(genrePatterns)) {
              if (g === genre && pattern.test(m.movieTitle)) return true;
            }
            return genre === 'Other' && !Object.values(genrePatterns).some(p => p.test(m.movieTitle));
          })
          .reduce((sum, m) => sum + m.averageRating * m.totalReviews, 0) / stats.totalReviews) : 0;
      
      stats.averageRating = Math.round(stats.averageRating * 100) / 100;
      stats.helpfulnessRatio = stats.totalVotes > 0 ? 
        Math.round((stats.totalHelpfulVotes / stats.totalVotes) * 1000) / 1000 : 0;
    }

    const executionTime = Date.now() - startTime;

    res.json({
      success: true,
      data: genreStats,
      performance: {
        executionTime: `${executionTime}ms`
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 8. Get review length analysis
router.get('/review-length-analysis', async (req, res) => {
  try {
    const startTime = Date.now();

    const lengthAnalysis = await Review.aggregate([
      {
        $project: {
          reviewLength: '$review_length',
          rating: 1,
          helpful_votes: 1,
          total_votes: 1,
          helpfulness_ratio: 1
        }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $lt: ['$reviewLength', 100] },
              'Short (<100 chars)',
              {
                $cond: [
                  { $lt: ['$reviewLength', 500] },
                  'Medium (100-500 chars)',
                  {
                    $cond: [
                      { $lt: ['$reviewLength', 1000] },
                      'Long (500-1000 chars)',
                      'Very Long (>1000 chars)'
                    ]
                  }
                ]
              }
            ]
          },
          count: { $sum: 1 },
          averageRating: { $avg: '$rating' },
          averageHelpfulness: { $avg: '$helpfulness_ratio' },
          totalHelpfulVotes: { $sum: '$helpful_votes' },
          totalVotes: { $sum: '$total_votes' }
        }
      },
      {
        $project: {
          _id: 0,
          lengthCategory: '$_id',
          count: 1,
          averageRating: { $round: ['$averageRating', 2] },
          averageHelpfulness: { $round: ['$averageHelpfulness', 3] },
          totalHelpfulVotes: 1,
          totalVotes: 1,
          helpfulnessRatio: {
            $cond: [
              { $eq: ['$totalVotes', 0] },
              0,
              { $divide: ['$totalHelpfulVotes', '$totalVotes'] }
            ]
          }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    const executionTime = Date.now() - startTime;

    res.json({
      success: true,
      data: lengthAnalysis,
      performance: {
        executionTime: `${executionTime}ms`
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
