const mongoose = require('mongoose');
const axios = require('axios');
require('dotenv').config();

const Review = require('../models/Review');
const Movie = require('../models/Movie');
const User = require('../models/User');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB Connected for performance testing');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

// Performance test results storage
const testResults = {
  simple: {},
  medium: {},
  complex: {},
  indexing: {},
  api: {}
};

// Utility function to measure execution time
const measureExecutionTime = async (testName, testFunction) => {
  const startTime = Date.now();
  const result = await testFunction();
  const executionTime = Date.now() - startTime;
  
  return {
    executionTime: `${executionTime}ms`,
    resultCount: Array.isArray(result) ? result.length : 1,
    result: result
  };
};

// ===== SIMPLE QUERY TESTS =====

const testSimpleQueries = async () => {
  console.log('\n🔍 Testing Simple Queries...');
  
  // Test 1: Get all reviews with pagination
  testResults.simple['Get all reviews (100)'] = await measureExecutionTime(
    'Get all reviews (100)',
    () => Review.find().limit(100).select('movie_title rating review_date')
  );

  // Test 2: Get reviews by movie title
  testResults.simple['Get reviews by movie title'] = await measureExecutionTime(
    'Get reviews by movie title',
    () => Review.find({ movie_title: { $regex: 'The', $options: 'i' } }).limit(100)
  );

  // Test 3: Get reviews by rating
  testResults.simple['Get reviews by rating (>=8)'] = await measureExecutionTime(
    'Get reviews by rating (>=8)',
    () => Review.find({ rating: { $gte: 8 } }).limit(100)
  );

  // Test 4: Get reviews by user
  testResults.simple['Get reviews by user'] = await measureExecutionTime(
    'Get reviews by user',
    () => Review.find({ user_id: { $exists: true } }).limit(100)
  );

  console.log('✅ Simple query tests completed');
};

// ===== MEDIUM COMPLEXITY QUERY TESTS =====

const testMediumQueries = async () => {
  console.log('\n🔍 Testing Medium Complexity Queries...');
  
  // Test 1: Get helpful reviews
  testResults.medium['Get helpful reviews'] = await measureExecutionTime(
    'Get helpful reviews',
    () => Review.find({
      total_votes: { $gte: 10 },
      helpfulness_ratio: { $gte: 0.5 }
    }).sort({ helpfulness_ratio: -1 }).limit(100)
  );

  // Test 2: Get recent reviews
  testResults.medium['Get recent reviews (30 days)'] = await measureExecutionTime(
    'Get recent reviews (30 days)',
    () => Review.find({
      review_date: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    }).sort({ review_date: -1 }).limit(100)
  );

  // Test 3: Get reviews with multiple criteria
  testResults.medium['Get reviews with multiple criteria'] = await measureExecutionTime(
    'Get reviews with multiple criteria',
    () => Review.find({
      rating: { $gte: 7, $lte: 10 },
      review_length: { $gte: 100 },
      total_votes: { $gte: 5 }
    }).sort({ rating: -1, review_date: -1 }).limit(100)
  );

  console.log('✅ Medium complexity query tests completed');
};

// ===== COMPLEX QUERY TESTS =====

const testComplexQueries = async () => {
  console.log('\n🔍 Testing Complex Queries...');
  
  // Test 1: Movie statistics aggregation
  testResults.complex['Movie statistics aggregation'] = await measureExecutionTime(
    'Movie statistics aggregation',
    () => Review.aggregate([
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
    ])
  );

  // Test 2: User statistics aggregation
  testResults.complex['User statistics aggregation'] = await measureExecutionTime(
    'User statistics aggregation',
    () => Review.aggregate([
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
    ])
  );

  // Test 3: Rating distribution aggregation
  testResults.complex['Rating distribution aggregation'] = await measureExecutionTime(
    'Rating distribution aggregation',
    () => Review.aggregate([
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ])
  );

  // Test 4: Monthly trends aggregation
  testResults.complex['Monthly trends aggregation'] = await measureExecutionTime(
    'Monthly trends aggregation',
    () => Review.aggregate([
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
    ])
  );

  console.log('✅ Complex query tests completed');
};

// ===== INDEXING PERFORMANCE TESTS =====

const testIndexingPerformance = async () => {
  console.log('\n🔍 Testing Indexing Performance...');
  
  // Test 1: Query without specific index
  testResults.indexing['Query without specific index'] = await measureExecutionTime(
    'Query without specific index',
    () => Review.find().sort({ _id: -1 }).limit(1000).select('movie_title rating')
  );

  // Test 2: Query with movie_title index
  testResults.indexing['Query with movie_title index'] = await measureExecutionTime(
    'Query with movie_title index',
    () => Review.find({ movie_title: { $regex: 'The', $options: 'i' } })
      .sort({ movie_title: 1 }).limit(1000).select('movie_title rating')
  );

  // Test 3: Query with rating index
  testResults.indexing['Query with rating index'] = await measureExecutionTime(
    'Query with rating index',
    () => Review.find({ rating: { $gte: 8 } })
      .sort({ rating: -1 }).limit(1000).select('movie_title rating')
  );

  // Test 4: Query with compound index
  testResults.indexing['Query with compound index'] = await measureExecutionTime(
    'Query with compound index',
    () => Review.find({ 
      movie_title: { $regex: 'The', $options: 'i' },
      rating: { $gte: 8 }
    }).sort({ movie_title: 1, rating: -1 }).limit(1000).select('movie_title rating')
  );

  // Test 5: Query with date index
  testResults.indexing['Query with date index'] = await measureExecutionTime(
    'Query with date index',
    () => Review.find({
      review_date: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    }).sort({ review_date: -1 }).limit(1000).select('movie_title rating review_date')
  );

  console.log('✅ Indexing performance tests completed');
};

// ===== API ENDPOINT TESTS =====

const testAPIEndpoints = async () => {
  console.log('\n🔍 Testing API Endpoints...');
  
  const baseURL = 'http://localhost:3000/api/v1';
  
  try {
    // Test 1: Health check
    testResults.api['Health check'] = await measureExecutionTime(
      'Health check',
      () => axios.get(`${baseURL.replace('/api/v1', '')}/health`)
    );

    // Test 2: Get all reviews
    testResults.api['Get all reviews'] = await measureExecutionTime(
      'Get all reviews',
      () => axios.get(`${baseURL}/reviews?limit=10`)
    );

    // Test 3: Get reviews by movie
    testResults.api['Get reviews by movie'] = await measureExecutionTime(
      'Get reviews by movie',
      () => axios.get(`${baseURL}/reviews/movie/The`)
    );

    // Test 4: Get analytics overview
    testResults.api['Get analytics overview'] = await measureExecutionTime(
      'Get analytics overview',
      () => axios.get(`${baseURL}/analytics/overview`)
    );

    // Test 5: Get top movies
    testResults.api['Get top movies'] = await measureExecutionTime(
      'Get top movies',
      () => axios.get(`${baseURL}/analytics/top-movies?limit=10`)
    );

    console.log('✅ API endpoint tests completed');
  } catch (error) {
    console.log('⚠️  API tests skipped (server may not be running)');
    console.log('   Start the server with: npm start');
  }
};

// ===== DATABASE STATISTICS =====

const getDatabaseStats = async () => {
  console.log('\n📊 Database Statistics...');
  
  try {
    const reviewStats = await Review.collection.stats();
    const movieStats = await Movie.collection.stats();
    const userStats = await User.collection.stats();
    
    const stats = {
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

    console.log('📈 Collection Statistics:');
    console.log(`   Reviews: ${stats.reviews.count} documents, ${stats.reviews.size}, ${stats.reviews.indexes} indexes`);
    console.log(`   Movies: ${stats.movies.count} documents, ${stats.movies.size}, ${stats.movies.indexes} indexes`);
    console.log(`   Users: ${stats.users.count} documents, ${stats.users.size}, ${stats.users.indexes} indexes`);
    
    return stats;
  } catch (error) {
    console.error('❌ Error getting database stats:', error.message);
    return null;
  }
};

// ===== GENERATE PERFORMANCE REPORT =====

const generateReport = () => {
  console.log('\n📋 PERFORMANCE TEST REPORT');
  console.log('=' .repeat(50));
  
  // Simple queries summary
  console.log('\n🔍 SIMPLE QUERIES:');
  console.log('-'.repeat(30));
  Object.entries(testResults.simple).forEach(([test, result]) => {
    console.log(`${test}: ${result.executionTime} (${result.resultCount} results)`);
  });
  
  const simpleAvg = Object.values(testResults.simple).reduce((sum, r) => 
    sum + parseInt(r.executionTime), 0) / Object.keys(testResults.simple).length;
  console.log(`Average: ${Math.round(simpleAvg)}ms`);

  // Medium queries summary
  console.log('\n🔍 MEDIUM COMPLEXITY QUERIES:');
  console.log('-'.repeat(30));
  Object.entries(testResults.medium).forEach(([test, result]) => {
    console.log(`${test}: ${result.executionTime} (${result.resultCount} results)`);
  });
  
  const mediumAvg = Object.values(testResults.medium).reduce((sum, r) => 
    sum + parseInt(r.executionTime), 0) / Object.keys(testResults.medium).length;
  console.log(`Average: ${Math.round(mediumAvg)}ms`);

  // Complex queries summary
  console.log('\n🔍 COMPLEX QUERIES:');
  console.log('-'.repeat(30));
  Object.entries(testResults.complex).forEach(([test, result]) => {
    console.log(`${test}: ${result.executionTime} (${result.resultCount} results)`);
  });
  
  const complexAvg = Object.values(testResults.complex).reduce((sum, r) => 
    sum + parseInt(r.executionTime), 0) / Object.keys(testResults.complex).length;
  console.log(`Average: ${Math.round(complexAvg)}ms`);

  // Indexing performance summary
  console.log('\n🔍 INDEXING PERFORMANCE:');
  console.log('-'.repeat(30));
  Object.entries(testResults.indexing).forEach(([test, result]) => {
    console.log(`${test}: ${result.executionTime} (${result.resultCount} results)`);
  });
  
  const indexingAvg = Object.values(testResults.indexing).reduce((sum, r) => 
    sum + parseInt(r.executionTime), 0) / Object.keys(testResults.indexing).length;
  console.log(`Average: ${Math.round(indexingAvg)}ms`);

  // Find fastest and slowest queries
  const allResults = {
    ...testResults.simple,
    ...testResults.medium,
    ...testResults.complex,
    ...testResults.indexing
  };

  const fastest = Object.entries(allResults).reduce((min, [key, value]) => 
    parseInt(value.executionTime) < parseInt(min[1].executionTime) ? [key, value] : min
  );

  const slowest = Object.entries(allResults).reduce((max, [key, value]) => 
    parseInt(value.executionTime) > parseInt(max[1].executionTime) ? [key, value] : max
  );

  console.log('\n🏆 PERFORMANCE SUMMARY:');
  console.log('-'.repeat(30));
  console.log(`Fastest query: ${fastest[0]} (${fastest[1].executionTime})`);
  console.log(`Slowest query: ${slowest[0]} (${slowest[1].executionTime})`);
  console.log(`Total queries tested: ${Object.keys(allResults).length}`);

  // API tests summary (if available)
  if (Object.keys(testResults.api).length > 0) {
    console.log('\n🌐 API ENDPOINT TESTS:');
    console.log('-'.repeat(30));
    Object.entries(testResults.api).forEach(([test, result]) => {
      console.log(`${test}: ${result.executionTime}`);
    });
  }

  console.log('\n' + '='.repeat(50));
  console.log('✅ Performance testing completed!');
};

// ===== MAIN TEST FUNCTION =====

const runPerformanceTests = async () => {
  try {
    console.log('🚀 Starting Performance Tests...');
    
    // Connect to database
    await connectDB();
    
    // Get database statistics
    await getDatabaseStats();
    
    // Run all test suites
    await testSimpleQueries();
    await testMediumQueries();
    await testComplexQueries();
    await testIndexingPerformance();
    await testAPIEndpoints();
    
    // Generate report
    generateReport();
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Performance testing failed:', error.message);
    process.exit(1);
  }
};

// Run tests if this file is executed directly
if (require.main === module) {
  runPerformanceTests();
}

module.exports = { runPerformanceTests };
