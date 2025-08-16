const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
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
    console.log('✅ MongoDB Connected for seeding');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

// Download dataset from Kaggle (simulated - you'll need to manually download)
const downloadDataset = async () => {
  const dataDir = path.join(__dirname, '../../data');
  const csvPath = path.join(dataDir, 'imdb_user_reviews.csv');
  
  // Create data directory if it doesn't exist
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  // Check if file already exists
  if (fs.existsSync(csvPath)) {
    console.log('✅ Dataset file already exists');
    return csvPath;
  }
  
  console.log('⚠️  Please manually download the IMDB User Reviews dataset from:');
  console.log('   https://www.kaggle.com/datasets/sadmadlad/imdb-user-reviews');
  console.log(`   And place it at: ${csvPath}`);
  console.log('');
  console.log('   For now, creating a sample dataset for testing...');
  
  // Create a sample dataset for testing
  createSampleDataset(csvPath);
  
  return csvPath;
};

// Create a sample dataset for testing purposes
const createSampleDataset = (csvPath) => {
  const sampleData = [
    {
      user_id: 'user1',
      movie_title: 'The Shawshank Redemption',
      rating: 9,
      review_title: 'Masterpiece of cinema',
      review_content: 'This film is a true masterpiece that showcases the power of hope and friendship.',
      review_date: '2023-01-15',
      helpful_votes: 150,
      total_votes: 200,
      spoiler_tag: false,
      verified_purchase: true
    },
    {
      user_id: 'user2',
      movie_title: 'The Godfather',
      rating: 10,
      review_title: 'Perfect crime drama',
      review_content: 'An absolute classic that defines the crime genre. Marlon Brando delivers an unforgettable performance.',
      review_date: '2023-02-20',
      helpful_votes: 200,
      total_votes: 250,
      spoiler_tag: false,
      verified_purchase: true
    },
    {
      user_id: 'user3',
      movie_title: 'Pulp Fiction',
      rating: 8,
      review_title: 'Revolutionary storytelling',
      review_content: 'Tarantino\'s masterpiece redefined cinema with its non-linear narrative and unforgettable dialogue.',
      review_date: '2023-03-10',
      helpful_votes: 120,
      total_votes: 180,
      spoiler_tag: false,
      verified_purchase: false
    },
    {
      user_id: 'user1',
      movie_title: 'The Dark Knight',
      rating: 9,
      review_title: 'Redefines the superhero genre',
      review_content: 'Christopher Nolan\'s masterpiece elevates the superhero genre to new heights with complex themes.',
      review_date: '2023-04-05',
      helpful_votes: 180,
      total_votes: 220,
      spoiler_tag: false,
      verified_purchase: true
    },
    {
      user_id: 'user4',
      movie_title: 'Fight Club',
      rating: 8,
      review_title: 'Mind-bending thriller',
      review_content: 'A thought-provoking film that challenges societal norms and consumerism.',
      review_date: '2023-05-12',
      helpful_votes: 90,
      total_votes: 150,
      spoiler_tag: true,
      verified_purchase: false
    },
    {
      user_id: 'user2',
      movie_title: 'Inception',
      rating: 9,
      review_title: 'Visual and intellectual masterpiece',
      review_content: 'Nolan\'s dream-within-a-dream concept is executed flawlessly with stunning visuals.',
      review_date: '2023-06-18',
      helpful_votes: 160,
      total_votes: 200,
      spoiler_tag: false,
      verified_purchase: true
    },
    {
      user_id: 'user3',
      movie_title: 'The Matrix',
      rating: 9,
      review_title: 'Revolutionary sci-fi',
      review_content: 'Changed the landscape of action films with its innovative special effects and philosophical themes.',
      review_date: '2023-07-22',
      helpful_votes: 140,
      total_votes: 190,
      spoiler_tag: false,
      verified_purchase: true
    },
    {
      user_id: 'user4',
      movie_title: 'Goodfellas',
      rating: 8,
      review_title: 'Gritty crime masterpiece',
      review_content: 'Martin Scorsese\'s epic crime saga is both entertaining and brutally honest.',
      review_date: '2023-08-30',
      helpful_votes: 110,
      total_votes: 170,
      spoiler_tag: false,
      verified_purchase: false
    },
    {
      user_id: 'user1',
      movie_title: 'The Silence of the Lambs',
      rating: 9,
      review_title: 'Psychological thriller at its best',
      review_content: 'Anthony Hopkins\' performance as Hannibal Lecter is absolutely chilling and unforgettable.',
      review_date: '2023-09-14',
      helpful_votes: 130,
      total_votes: 180,
      spoiler_tag: false,
      verified_purchase: true
    },
    {
      user_id: 'user2',
      movie_title: 'Interstellar',
      rating: 8,
      review_title: 'Ambitious space epic',
      review_content: 'Nolan\'s exploration of space, time, and love is both visually stunning and emotionally powerful.',
      review_date: '2023-10-08',
      helpful_votes: 170,
      total_votes: 210,
      spoiler_tag: false,
      verified_purchase: true
    }
  ];

  // Write CSV header
  const csvHeader = 'user_id,movie_title,rating,review_title,review_content,review_date,helpful_votes,total_votes,spoiler_tag,verified_purchase\n';
  fs.writeFileSync(csvPath, csvHeader);

  // Write sample data
  sampleData.forEach(row => {
    const csvLine = `${row.user_id},"${row.movie_title}",${row.rating},"${row.review_title}","${row.review_content}",${row.review_date},${row.helpful_votes},${row.total_votes},${row.spoiler_tag},${row.verified_purchase}\n`;
    fs.appendFileSync(csvPath, csvLine);
  });

  console.log('✅ Sample dataset created successfully');
};

// Parse and clean the CSV data
const parseCSV = (csvPath) => {
  return new Promise((resolve, reject) => {
    const reviews = [];
    
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (row) => {
        // Clean and transform the data
        const cleanedReview = {
          user_id: row.user_id?.trim() || `user_${Math.random().toString(36).substr(2, 9)}`,
          movie_title: row.movie_title?.trim() || 'Unknown Movie',
          rating: parseInt(row.rating) || Math.floor(Math.random() * 10) + 1,
          review_title: row.review_title?.trim() || 'No Title',
          review_content: row.review_content?.trim() || 'No content available',
          review_date: new Date(row.review_date) || new Date(),
          helpful_votes: parseInt(row.helpful_votes) || 0,
          total_votes: parseInt(row.total_votes) || 0,
          spoiler_tag: row.spoiler_tag === 'true' || false,
          verified_purchase: row.verified_purchase === 'true' || false
        };

        // Validate rating range
        if (cleanedReview.rating < 1 || cleanedReview.rating > 10) {
          cleanedReview.rating = Math.floor(Math.random() * 10) + 1;
        }

        // Validate date
        if (isNaN(cleanedReview.review_date.getTime())) {
          cleanedReview.review_date = new Date();
        }

        reviews.push(cleanedReview);
      })
      .on('end', () => {
        console.log(`✅ Parsed ${reviews.length} reviews from CSV`);
        resolve(reviews);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
};

// Load reviews into MongoDB
const loadReviews = async (reviews) => {
  try {
    console.log('🔄 Loading reviews into MongoDB...');
    
    // Clear existing reviews
    await Review.deleteMany({});
    console.log('✅ Cleared existing reviews');
    
    // Insert reviews in batches
    const batchSize = 1000;
    for (let i = 0; i < reviews.length; i += batchSize) {
      const batch = reviews.slice(i, i + batchSize);
      await Review.insertMany(batch);
      console.log(`✅ Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(reviews.length / batchSize)}`);
    }
    
    console.log(`✅ Successfully loaded ${reviews.length} reviews`);
  } catch (error) {
    console.error('❌ Error loading reviews:', error.message);
    throw error;
  }
};

// Create aggregated movie data
const createMovieAggregations = async () => {
  try {
    console.log('🔄 Creating movie aggregations...');
    
    // Clear existing movies
    await Movie.deleteMany({});
    
    const movieStats = await Review.aggregate([
      {
        $group: {
          _id: '$movie_title',
          total_reviews: { $sum: 1 },
          average_rating: { $avg: '$rating' },
          total_helpful_votes: { $sum: '$helpful_votes' },
          total_votes: { $sum: '$total_votes' },
          average_review_length: { $avg: '$review_length' },
          first_review_date: { $min: '$review_date' },
          last_review_date: { $max: '$review_date' },
          rating_distribution: {
            $push: '$rating'
          }
        }
      }
    ]);

    const movies = movieStats.map(movie => {
      // Calculate rating distribution
      const ratingDist = {};
      for (let i = 1; i <= 10; i++) {
        ratingDist[i] = movie.rating_distribution.filter(r => r === i).length;
      }

      return new Movie({
        title: movie._id,
        total_reviews: movie.total_reviews,
        average_rating: Math.round(movie.average_rating * 100) / 100,
        total_helpful_votes: movie.total_helpful_votes,
        total_votes: movie.total_votes,
        average_review_length: Math.round(movie.average_review_length || 0),
        first_review_date: movie.first_review_date,
        last_review_date: movie.last_review_date,
        rating_distribution: ratingDist
      });
    });

    await Movie.insertMany(movies);
    console.log(`✅ Created ${movies.length} movie aggregations`);
  } catch (error) {
    console.error('❌ Error creating movie aggregations:', error.message);
    throw error;
  }
};

// Create aggregated user data
const createUserAggregations = async () => {
  try {
    console.log('🔄 Creating user aggregations...');
    
    // Clear existing users
    await User.deleteMany({});
    
    const userStats = await Review.aggregate([
      {
        $group: {
          _id: '$user_id',
          total_reviews: { $sum: 1 },
          average_rating: { $avg: '$rating' },
          total_helpful_votes_received: { $sum: '$helpful_votes' },
          total_votes_received: { $sum: '$total_votes' },
          average_review_length: { $avg: '$review_length' },
          first_review_date: { $min: '$review_date' },
          last_review_date: { $max: '$review_date' },
          rating_distribution: {
            $push: '$rating'
          }
        }
      }
    ]);

    const users = userStats.map(user => {
      // Calculate rating distribution
      const ratingDist = {};
      for (let i = 1; i <= 10; i++) {
        ratingDist[i] = user.rating_distribution.filter(r => r === i).length;
      }

      return new User({
        user_id: user._id,
        total_reviews: user.total_reviews,
        average_rating: Math.round(user.average_rating * 100) / 100,
        total_helpful_votes_received: user.total_helpful_votes_received,
        total_votes_received: user.total_votes_received,
        average_review_length: Math.round(user.average_review_length || 0),
        first_review_date: user.first_review_date,
        last_review_date: user.last_review_date,
        rating_distribution: ratingDist
      });
    });

    await User.insertMany(users);
    console.log(`✅ Created ${users.length} user aggregations`);
  } catch (error) {
    console.error('❌ Error creating user aggregations:', error.message);
    throw error;
  }
};

// Main seeding function
const seedDatabase = async () => {
  try {
    console.log('🚀 Starting database seeding...');
    
    // Connect to database
    await connectDB();
    
    // Download/check dataset
    const csvPath = await downloadDataset();
    
    // Parse CSV
    const reviews = await parseCSV(csvPath);
    
    // Load reviews
    await loadReviews(reviews);
    
    // Create aggregations
    await createMovieAggregations();
    await createUserAggregations();
    
    console.log('✅ Database seeding completed successfully!');
    console.log('');
    console.log('📊 Summary:');
    console.log(`   - Reviews loaded: ${reviews.length}`);
    console.log(`   - Movies aggregated: ${await Movie.countDocuments()}`);
    console.log(`   - Users aggregated: ${await User.countDocuments()}`);
    console.log('');
    console.log('🎉 You can now start the API server with: npm start');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  }
};

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };
