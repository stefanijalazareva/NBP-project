const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Movie = require('../models/Movie');
const User = require('../models/User');

// ===== PERFORMANCE TESTING ENDPOINTS =====

// 1. Test simple query performance
router.get('/test-simple', async (req, res) => {
  try {
    const results = {};
    
    // Test 1: Get all reviews with pagination
    const startTime1 = Date.now();
    const reviews1 = await Review.find()
      .sort({ review_date: -1 })
      .limit(100)
      .select('movie_title rating review_date');
    const time1 = Date.now() - startTime1;
    
    results['Get all reviews (100)'] = {
      executionTime: `${time1}ms`,
      resultCount: reviews1.length
    };

    // Test 2: Get reviews by movie title
    const startTime2 = Date.now();
    const reviews2 = await Review.find({ 
      movie_title: { $regex: 'The', $options: 'i' } 
    })
      .limit(100)
      .select('movie_title rating review_date');
    const time2 = Date.now() - startTime2;
    
    results['Get reviews by movie title'] = {
      executionTime: `${time2}ms`,
      resultCount: reviews2.length
    };

    // Test 3: Get reviews by rating
    const startTime3 = Date.now();
    const reviews3 = await Review.find({ rating: { $gte: 8 } })
      .limit(100)
      .select('movie_title rating review_date');
    const time3 = Date.now() - startTime3;
    
    results['Get reviews by rating (>=8)'] = {
      executionTime: `${time3}ms`,
      resultCount: reviews3.length
    };

    // Test 4: Get reviews by user
    const startTime4 = Date.now();
    const reviews4 = await Review.find({ user_id: { $exists: true } })
      .limit(100)
      .select('user_id movie_title rating');
    const time4 = Date.now() - startTime4;
    
    results['Get reviews by user'] = {
      executionTime: `${time4}ms`,
      resultCount: reviews4.length
    };

    res.json({
      success: true,
      data: results,
      summary: {
        totalTests: Object.keys(results).length,
        averageTime: `${Math.round(Object.values(results).reduce((sum, r) => sum + parseInt(r.executionTime), 0) / Object.keys(results).length)}ms`
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2. Test medium complexity query performance
router.get('/test-medium', async (req, res) => {
  try {
    const results = {};
    
    // Test 1: Get helpful reviews
    const startTime1 = Date.now();
    const reviews1 = await Review.find({
      total_votes: { $gte: 10 },
      helpfulness_ratio: { $gte: 0.5 }
    })
      .sort({ helpfulness_ratio: -1 })
      .limit(100)
      .select('movie_title rating helpfulness_ratio total_votes');
    const time1 = Date.now() - startTime1;
    
    results['Get helpful reviews'] = {
      executionTime: `${time1}ms`,
      resultCount: reviews1.length
    };

    // Test 2: Get recent reviews
    const startTime2 = Date.now();
    const reviews2 = await Review.find({
      review_date: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    })
      .sort({ review_date: -1 })
      .limit(100)
      .select('movie_title rating review_date');
    const time2 = Date.now() - startTime2;
    
    results['Get recent reviews (30 days)'] = {
      executionTime: `${time2}ms`,
      resultCount: reviews2.length
    };

    // Test 3: Get reviews with multiple criteria
    const startTime3 = Date.now();
    const reviews3 = await Review.find({
      rating: { $gte: 7, $lte: 10 },
      review_length: { $gte: 100 },
      total_votes: { $gte: 5 }
    })
      .sort({ rating: -1, review_date: -1 })
      .limit(100)
      .select('movie_title rating review_length total_votes');
    const time3 = Date.now() - startTime3;
    
    results['Get reviews with multiple criteria'] = {
      executionTime: `${time3}ms`,
      resultCount: reviews3.length
    };

    res.json({
      success: true,
      data: results,
      summary: {
        totalTests: Object.keys(results).length,
        averageTime: `${Math.round(Object.values(results).reduce((sum, r) => sum + parseInt(r.executionTime), 0) / Object.keys(results).length)}ms`
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 3. Test complex aggregation query performance
router.get('/test-complex', async (req, res) => {
  try {
    const results = {};
    
    // Test 1: Movie statistics aggregation
    const startTime1 = Date.now();
    const movieStats = await Review.aggregate([
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
        $match: {
          totalReviews: { $gte: 10 }
        }
      },
      {
        $sort: { averageRating: -1 }
      },
      {
        $limit: 50
      }
    ]);
    const time1 = Date.now() - startTime1;
    
    results['Movie statistics aggregation'] = {
      executionTime: `${time1}ms`,
      resultCount: movieStats.length
    };

    // Test 2: User statistics aggregation
    const startTime2 = Date.now();
    const userStats = await Review.aggregate([
      {
        $group: {
          _id: '$user_id',
          totalReviews: { $sum: 1 },
          averageRating: { $avg: '$rating' },
          totalHelpfulVotes: { $sum: '$helpful_votes' },
          totalVotes: { $sum: '$total_votes' }
        }
      },
      {
        $match: {
          totalReviews: { $gte: 5 }
        }
      },
      {
        $sort: { totalReviews: -1 }
      },
      {
        $limit: 50
      }
    ]);
    const time2 = Date.now() - startTime2;
    
    results['User statistics aggregation'] = {
      executionTime: `${time2}ms`,
      resultCount: userStats.length
    };

    // Test 3: Rating distribution aggregation
    const startTime3 = Date.now();
    const ratingDistribution = await Review.aggregate([
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);
    const time3 = Date.now() - startTime3;
    
    results['Rating distribution aggregation'] = {
      executionTime: `${time3}ms`,
      resultCount: ratingDistribution.length
    };

    // Test 4: Monthly trends aggregation
    const startTime4 = Date.now();
    const monthlyTrends = await Review.aggregate([
      {
        $match: {
          review_date: {
            $gte: new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000)
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
          averageRating: { $avg: '$rating' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);
    const time4 = Date.now() - startTime4;
    
    results['Monthly trends aggregation'] = {
      executionTime: `${time4}ms`,
      resultCount: monthlyTrends.length
    };

    res.json({
      success: true,
      data: results,
      summary: {
        totalTests: Object.keys(results).length,
        averageTime: `${Math.round(Object.values(results).reduce((sum, r) => sum + parseInt(r.executionTime), 0) / Object.keys(results).length)}ms`
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 4. Test indexing performance comparison
router.get('/test-indexing', async (req, res) => {
  try {
    const results = {};
    
    // Test 1: Query without specific index (should use default _id index)
    const startTime1 = Date.now();
    const reviews1 = await Review.find()
      .sort({ _id: -1 })
      .limit(1000)
      .select('movie_title rating');
    const time1 = Date.now() - startTime1;
    
    results['Query without specific index'] = {
      executionTime: `${time1}ms`,
      resultCount: reviews1.length
    };

    // Test 2: Query with movie_title index
    const startTime2 = Date.now();
    const reviews2 = await Review.find({ 
      movie_title: { $regex: 'The', $options: 'i' } 
    })
      .sort({ movie_title: 1 })
      .limit(1000)
      .select('movie_title rating');
    const time2 = Date.now() - startTime2;
    
    results['Query with movie_title index'] = {
      executionTime: `${time2}ms`,
      resultCount: reviews2.length
    };

    // Test 3: Query with rating index
    const startTime3 = Date.now();
    const reviews3 = await Review.find({ rating: { $gte: 8 } })
      .sort({ rating: -1 })
      .limit(1000)
      .select('movie_title rating');
    const time3 = Date.now() - startTime3;
    
    results['Query with rating index'] = {
      executionTime: `${time3}ms`,
      resultCount: reviews3.length
    };

    // Test 4: Query with compound index (movie_title + rating)
    const startTime4 = Date.now();
    const reviews4 = await Review.find({ 
      movie_title: { $regex: 'The', $options: 'i' },
      rating: { $gte: 8 }
    })
      .sort({ movie_title: 1, rating: -1 })
      .limit(1000)
      .select('movie_title rating');
    const time4 = Date.now() - startTime4;
    
    results['Query with compound index'] = {
      executionTime: `${time4}ms`,
      resultCount: reviews4.length
    };

    // Test 5: Query with date index
    const startTime5 = Date.now();
    const reviews5 = await Review.find({
      review_date: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    })
      .sort({ review_date: -1 })
      .limit(1000)
      .select('movie_title rating review_date');
    const time5 = Date.now() - startTime5;
    
    results['Query with date index'] = {
      executionTime: `${time5}ms`,
      resultCount: reviews5.length
    };

    res.json({
      success: true,
      data: results,
      summary: {
        totalTests: Object.keys(results).length,
        averageTime: `${Math.round(Object.values(results).reduce((sum, r) => sum + parseInt(r.executionTime), 0) / Object.keys(results).length)}ms`,
        fastestQuery: Object.entries(results).reduce((min, [key, value]) => 
          parseInt(value.executionTime) < parseInt(min[1].executionTime) ? [key, value] : min
        )[0]
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 5. Get database statistics and index information
router.get('/database-stats', async (req, res) => {
  try {
    const stats = {};
    
    // Collection statistics
    const reviewStats = await Review.collection.stats();
    const movieStats = await Movie.collection.stats();
    const userStats = await User.collection.stats();
    
    stats.collections = {
      reviews: {
        count: reviewStats.count,
        size: `${Math.round(reviewStats.size / 1024 / 1024 * 100) / 100} MB`,
        avgObjSize: `${Math.round(reviewStats.avgObjSize)} bytes`,
        indexes: reviewStats.nindexes
      },
      movies: {
        count: movieStats.count,
        size: `${Math.round(movieStats.size / 1024 / 1024 * 100) / 100} MB`,
        avgObjSize: `${Math.round(movieStats.avgObjSize)} bytes`,
        indexes: movieStats.nindexes
      },
      users: {
        count: userStats.count,
        size: `${Math.round(userStats.size / 1024 / 1024 * 100) / 100} MB`,
        avgObjSize: `${Math.round(userStats.avgObjSize)} bytes`,
        indexes: userStats.nindexes
      }
    };

    // Index information
    const reviewIndexes = await Review.collection.indexes();
    const movieIndexes = await Movie.collection.indexes();
    const userIndexes = await User.collection.indexes();
    
    stats.indexes = {
      reviews: reviewIndexes.map(idx => ({
        name: idx.name,
        keys: idx.key,
        unique: idx.unique || false,
        sparse: idx.sparse || false
      })),
      movies: movieIndexes.map(idx => ({
        name: idx.name,
        keys: idx.key,
        unique: idx.unique || false,
        sparse: idx.sparse || false
      })),
      users: userIndexes.map(idx => ({
        name: idx.name,
        keys: idx.key,
        unique: idx.unique || false,
        sparse: idx.sparse || false
      }))
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 6. Run comprehensive performance test suite
router.get('/comprehensive-test', async (req, res) => {
  try {
    const testResults = {};
    const startTime = Date.now();

    // Simple queries
    const simpleStart = Date.now();
    const simpleResults = await testSimpleQueries();
    const simpleTime = Date.now() - simpleStart;
    
    testResults.simple = {
      executionTime: `${simpleTime}ms`,
      results: simpleResults
    };

    // Medium complexity queries
    const mediumStart = Date.now();
    const mediumResults = await testMediumQueries();
    const mediumTime = Date.now() - mediumStart;
    
    testResults.medium = {
      executionTime: `${mediumTime}ms`,
      results: mediumResults
    };

    // Complex queries
    const complexStart = Date.now();
    const complexResults = await testComplexQueries();
    const complexTime = Date.now() - complexStart;
    
    testResults.complex = {
      executionTime: `${complexTime}ms`,
      results: complexResults
    };

    const totalTime = Date.now() - startTime;

    res.json({
      success: true,
      data: testResults,
      summary: {
        totalExecutionTime: `${totalTime}ms`,
        simpleQueriesTime: `${simpleTime}ms`,
        mediumQueriesTime: `${mediumTime}ms`,
        complexQueriesTime: `${complexTime}ms`,
        averageTimePerQuery: `${Math.round(totalTime / (Object.keys(simpleResults).length + Object.keys(mediumResults).length + Object.keys(complexResults).length))}ms`
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Helper functions for comprehensive testing
async function testSimpleQueries() {
  const results = {};
  
  // Test various simple queries
  const queries = [
    { name: 'Get all reviews (limit 100)', query: () => Review.find().limit(100) },
    { name: 'Get reviews by movie', query: () => Review.find({ movie_title: { $regex: 'The', $options: 'i' } }).limit(100) },
    { name: 'Get reviews by rating', query: () => Review.find({ rating: { $gte: 8 } }).limit(100) },
    { name: 'Get reviews by user', query: () => Review.find({ user_id: { $exists: true } }).limit(100) }
  ];

  for (const { name, query } of queries) {
    const startTime = Date.now();
    const result = await query();
    const executionTime = Date.now() - startTime;
    
    results[name] = {
      executionTime: `${executionTime}ms`,
      resultCount: result.length
    };
  }

  return results;
}

async function testMediumQueries() {
  const results = {};
  
  const queries = [
    { 
      name: 'Get helpful reviews', 
      query: () => Review.find({ total_votes: { $gte: 10 }, helpfulness_ratio: { $gte: 0.5 } }).limit(100) 
    },
    { 
      name: 'Get recent reviews', 
      query: () => Review.find({ review_date: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }).limit(100) 
    },
    { 
      name: 'Get reviews with multiple criteria', 
      query: () => Review.find({ rating: { $gte: 7, $lte: 10 }, review_length: { $gte: 100 } }).limit(100) 
    }
  ];

  for (const { name, query } of queries) {
    const startTime = Date.now();
    const result = await query();
    const executionTime = Date.now() - startTime;
    
    results[name] = {
      executionTime: `${executionTime}ms`,
      resultCount: result.length
    };
  }

  return results;
}

async function testComplexQueries() {
  const results = {};
  
  const queries = [
    {
      name: 'Movie statistics aggregation',
      query: () => Review.aggregate([
        { $group: { _id: '$movie_title', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
        { $match: { count: { $gte: 10 } } },
        { $sort: { avgRating: -1 } },
        { $limit: 50 }
      ])
    },
    {
      name: 'User statistics aggregation',
      query: () => Review.aggregate([
        { $group: { _id: '$user_id', totalReviews: { $sum: 1 }, avgRating: { $avg: '$rating' } } },
        { $match: { totalReviews: { $gte: 5 } } },
        { $sort: { totalReviews: -1 } },
        { $limit: 50 }
      ])
    },
    {
      name: 'Rating distribution aggregation',
      query: () => Review.aggregate([
        { $group: { _id: '$rating', count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ])
    }
  ];

  for (const { name, query } of queries) {
    const startTime = Date.now();
    const result = await query();
    const executionTime = Date.now() - startTime;
    
    results[name] = {
      executionTime: `${executionTime}ms`,
      resultCount: result.length
    };
  }

  return results;
}

module.exports = router;
