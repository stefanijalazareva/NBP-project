const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Movie = require('../models/Movie');
const User = require('../models/User');

// ===== SIMPLE QUERIES =====

// 1. Get all reviews with pagination
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const reviews = await Review.find()
      .sort({ review_date: -1 })
      .skip(skip)
      .limit(limit)
      .select('-__v');

    const total = await Review.countDocuments();

    res.json({
      success: true,
      data: reviews,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2. Get reviews by movie title (simple filtering)
router.get('/movie/:title', async (req, res) => {
  try {
    const { title } = req.params;
    const { page = 1, limit = 10, rating } = req.query;
    const skip = (page - 1) * limit;

    let query = { movie_title: { $regex: title, $options: 'i' } };
    
    if (rating) {
      query.rating = parseInt(rating);
    }

    const reviews = await Review.find(query)
      .sort({ review_date: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-__v');

    const total = await Review.countDocuments(query);

    res.json({
      success: true,
      data: reviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 3. Get reviews by user ID
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const reviews = await Review.find({ user_id: userId })
      .sort({ review_date: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-__v');

    const total = await Review.countDocuments({ user_id: userId });

    res.json({
      success: true,
      data: reviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 4. Get reviews by rating range
router.get('/rating/:min/:max', async (req, res) => {
  try {
    const { min, max } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const reviews = await Review.find({
      rating: { $gte: parseInt(min), $lte: parseInt(max) }
    })
      .sort({ review_date: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-__v');

    const total = await Review.countDocuments({
      rating: { $gte: parseInt(min), $lte: parseInt(max) }
    });

    res.json({
      success: true,
      data: reviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== MEDIUM COMPLEXITY QUERIES =====

// 5. Get helpful reviews (combining multiple criteria)
router.get('/helpful', async (req, res) => {
  try {
    const { page = 1, limit = 10, minVotes = 10 } = req.query;
    const skip = (page - 1) * limit;

    const reviews = await Review.find({
      total_votes: { $gte: parseInt(minVotes) },
      helpfulness_ratio: { $gte: 0.5 }
    })
      .sort({ helpfulness_ratio: -1, total_votes: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-__v');

    const total = await Review.countDocuments({
      total_votes: { $gte: parseInt(minVotes) },
      helpfulness_ratio: { $gte: 0.5 }
    });

    res.json({
      success: true,
      data: reviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 6. Get recent reviews with sentiment analysis
router.get('/recent/sentiment', async (req, res) => {
  try {
    const { page = 1, limit = 10, sentiment } = req.query;
    const skip = (page - 1) * limit;

    let query = {
      review_date: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
    };

    if (sentiment) {
      query.sentiment_label = sentiment;
    }

    const reviews = await Review.find(query)
      .sort({ review_date: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-__v');

    const total = await Review.countDocuments(query);

    res.json({
      success: true,
      data: reviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== COMPLEX QUERIES =====

// 7. Get reviews with movie and user aggregation
router.get('/detailed/:reviewId', async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ success: false, error: 'Review not found' });
    }

    // Get movie statistics
    const movieStats = await Movie.findOne({ title: review.movie_title });
    
    // Get user statistics
    const userStats = await User.findOne({ user_id: review.user_id });

    // Get similar reviews for the same movie
    const similarReviews = await Review.find({
      movie_title: review.movie_title,
      rating: { $gte: review.rating - 1, $lte: review.rating + 1 },
      _id: { $ne: reviewId }
    })
      .limit(5)
      .select('rating review_title review_date');

    res.json({
      success: true,
      data: {
        review,
        movieStats,
        userStats,
        similarReviews
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 8. Get reviews with advanced filtering and sorting
router.get('/advanced', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      movieTitle,
      minRating,
      maxRating,
      minDate,
      maxDate,
      minHelpfulness,
      sortBy = 'review_date',
      sortOrder = 'desc'
    } = req.query;

    const skip = (page - 1) * limit;

    // Build query
    let query = {};
    
    if (movieTitle) {
      query.movie_title = { $regex: movieTitle, $options: 'i' };
    }
    
    if (minRating || maxRating) {
      query.rating = {};
      if (minRating) query.rating.$gte = parseInt(minRating);
      if (maxRating) query.rating.$lte = parseInt(maxRating);
    }
    
    if (minDate || maxDate) {
      query.review_date = {};
      if (minDate) query.review_date.$gte = new Date(minDate);
      if (maxDate) query.review_date.$lte = new Date(maxDate);
    }
    
    if (minHelpfulness) {
      query.helpfulness_ratio = { $gte: parseFloat(minHelpfulness) };
    }

    // Build sort object
    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const reviews = await Review.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit))
      .select('-__v');

    const total = await Review.countDocuments(query);

    res.json({
      success: true,
      data: reviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 9. Get review statistics by movie
router.get('/stats/movie/:title', async (req, res) => {
  try {
    const { title } = req.params;

    const stats = await Review.aggregate([
      { $match: { movie_title: { $regex: title, $options: 'i' } } },
      {
        $group: {
          _id: null,
          totalReviews: { $sum: 1 },
          averageRating: { $avg: '$rating' },
          minRating: { $min: '$rating' },
          maxRating: { $max: '$rating' },
          totalHelpfulVotes: { $sum: '$helpful_votes' },
          totalVotes: { $sum: '$total_votes' },
          averageReviewLength: { $avg: '$review_length' },
          averageHelpfulness: { $avg: '$helpfulness_ratio' }
        }
      },
      {
        $project: {
          _id: 0,
          totalReviews: 1,
          averageRating: { $round: ['$averageRating', 2] },
          minRating: 1,
          maxRating: 1,
          totalHelpfulVotes: 1,
          totalVotes: 1,
          averageReviewLength: { $round: ['$averageReviewLength', 0] },
          averageHelpfulness: { $round: ['$averageHelpfulness', 3] },
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

    // Get rating distribution
    const ratingDistribution = await Review.aggregate([
      { $match: { movie_title: { $regex: title, $options: 'i' } } },
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: {
        stats: stats[0] || {},
        ratingDistribution
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 10. Get review statistics by user
router.get('/stats/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const stats = await Review.aggregate([
      { $match: { user_id: userId } },
      {
        $group: {
          _id: null,
          totalReviews: { $sum: 1 },
          averageRating: { $avg: '$rating' },
          minRating: { $min: '$rating' },
          maxRating: { $max: '$rating' },
          totalHelpfulVotes: { $sum: '$helpful_votes' },
          totalVotes: { $sum: '$total_votes' },
          averageReviewLength: { $avg: '$review_length' },
          averageHelpfulness: { $avg: '$helpfulness_ratio' },
          firstReviewDate: { $min: '$review_date' },
          lastReviewDate: { $max: '$review_date' }
        }
      },
      {
        $project: {
          _id: 0,
          totalReviews: 1,
          averageRating: { $round: ['$averageRating', 2] },
          minRating: 1,
          maxRating: 1,
          totalHelpfulVotes: 1,
          totalVotes: 1,
          averageReviewLength: { $round: ['$averageReviewLength', 0] },
          averageHelpfulness: { $round: ['$averageHelpfulness', 3] },
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

    // Get rating distribution
    const ratingDistribution = await Review.aggregate([
      { $match: { user_id: userId } },
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: {
        stats: stats[0] || {},
        ratingDistribution
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
