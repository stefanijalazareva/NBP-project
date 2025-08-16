const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
require('dotenv').config();

const Review = require('../models/Review');
const Movie = require('../models/Movie');
const User = require('../models/User');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://admin:password123@localhost:27017/imdb_reviews?authSource=admin');
    console.log('✅ MongoDB Connected for IBM data seeding');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

// Parse date string to Date object
const parseDate = (dateStr) => {
  if (!dateStr) return new Date();
  
  // Handle various date formats
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    // Try parsing different formats
    const parts = dateStr.split(' ');
    if (parts.length >= 3) {
      const day = parseInt(parts[0]);
      const month = parts[1];
      const year = parseInt(parts[2]);
      
      const monthMap = {
        'January': 0, 'February': 1, 'March': 2, 'April': 3, 'May': 4, 'June': 5,
        'July': 6, 'August': 7, 'September': 8, 'October': 9, 'November': 10, 'December': 11
      };
      
      if (monthMap[month] !== undefined) {
        return new Date(year, monthMap[month], day);
      }
    }
    return new Date();
  }
  return date;
};

// Clean and validate rating
const cleanRating = (ratingStr) => {
  if (!ratingStr) return 5;
  const rating = parseInt(ratingStr);
  return isNaN(rating) || rating < 1 || rating > 10 ? 5 : rating;
};

// Clean and validate votes
const cleanVotes = (votesStr) => {
  if (!votesStr) return 0;
  const votes = parseInt(votesStr);
  return isNaN(votes) || votes < 0 ? 0 : votes;
};

// Process a single movie folder
const processMovieFolder = async (movieFolderPath, movieName) => {
  const csvPath = path.join(movieFolderPath, 'movieReviews.csv');
  const metadataPath = path.join(movieFolderPath, 'metadata.json');
  
  if (!fs.existsSync(csvPath)) {
    console.log(`⚠️  No movieReviews.csv found in ${movieName}`);
    return [];
  }
  
  let movieMetadata = {};
  if (fs.existsSync(metadataPath)) {
    try {
      const metadataContent = fs.readFileSync(metadataPath, 'utf8');
      movieMetadata = JSON.parse(metadataContent);
    } catch (error) {
      console.log(`⚠️  Error reading metadata for ${movieName}:`, error.message);
    }
  }
  
  const reviews = [];
  
  return new Promise((resolve, reject) => {
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (row) => {
        try {
          // Skip rows with missing essential data
          if (!row.User || !row['User\'s Rating out of 10'] || !row.Review) {
            return;
          }
          
          const review = {
            user_id: row.User.trim(),
            movie_title: movieName,
            rating: cleanRating(row['User\'s Rating out of 10']),
            review_title: row['Review Title'] || 'No Title',
            review_content: row.Review.trim(),
            review_date: parseDate(row['Date of Review']),
            helpful_votes: cleanVotes(row['Usefulness Vote']),
            total_votes: cleanVotes(row['Total Votes']),
            spoiler_tag: false, // Not available in this dataset
            verified_purchase: false, // Not available in this dataset
            // Add movie metadata
            movie_imdb_rating: movieMetadata.movieIMDbRating || null,
            movie_genres: movieMetadata.movieGenres || [],
            movie_directors: movieMetadata.directors || [],
            movie_stars: movieMetadata.mainStars || [],
            movie_year: movieMetadata.datePublished ? new Date(movieMetadata.datePublished).getFullYear() : null
          };
          
          reviews.push(review);
        } catch (error) {
          console.log(`⚠️  Error processing row in ${movieName}:`, error.message);
        }
      })
      .on('end', () => {
        console.log(`✅ Processed ${reviews.length} reviews for ${movieName}`);
        resolve(reviews);
      })
      .on('error', (error) => {
        console.log(`❌ Error reading CSV for ${movieName}:`, error.message);
        reject(error);
      });
  });
};

// Main seeding function
const seedDatabase = async () => {
  console.log('🚀 Starting IBM movie reviews database seeding...');
  
  try {
    // Connect to database
    await connectDB();
    
    // Clear existing data
    console.log('🔄 Clearing existing data...');
    await Review.deleteMany({});
    await Movie.deleteMany({});
    await User.deleteMany({});
    console.log('✅ Cleared existing data');
    
    // Get all movie folders
    const dataPath = path.join(__dirname, '../../data/ibm-users-review');
    if (!fs.existsSync(dataPath)) {
      console.log('❌ IBM data folder not found. Please ensure the data/ibm-users-review folder exists.');
      return;
    }
    
    const movieFolders = fs.readdirSync(dataPath, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);
    
    console.log(`📁 Found ${movieFolders.length} movie folders`);
    
    // Process all movies
    let allReviews = [];
    for (const movieFolder of movieFolders) {
      const movieFolderPath = path.join(dataPath, movieFolder);
      const reviews = await processMovieFolder(movieFolderPath, movieFolder);
      allReviews = allReviews.concat(reviews);
    }
    
    if (allReviews.length === 0) {
      console.log('❌ No reviews found to import');
      return;
    }
    
    // Insert reviews in batches
    console.log(`🔄 Loading ${allReviews.length} reviews into MongoDB...`);
    const batchSize = 1000;
    for (let i = 0; i < allReviews.length; i += batchSize) {
      const batch = allReviews.slice(i, i + batchSize);
      await Review.insertMany(batch);
      console.log(`✅ Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(allReviews.length / batchSize)}`);
    }
    
    // Create movie aggregations
    console.log('🔄 Creating movie aggregations...');
    const movieAggregations = await Review.aggregate([
      {
        $group: {
          _id: '$movie_title',
          total_reviews: { $sum: 1 },
          average_rating: { $avg: '$rating' },
          rating_distribution: {
            $push: '$rating'
          },
          total_helpful_votes: { $sum: '$helpful_votes' },
          total_votes: { $sum: '$total_votes' },
          average_review_length: { $avg: { $strLenCP: '$review_content' } },
          first_review_date: { $min: '$review_date' },
          last_review_date: { $max: '$review_date' },
          movie_imdb_rating: { $first: '$movie_imdb_rating' },
          movie_genres: { $first: '$movie_genres' },
          movie_directors: { $first: '$movie_directors' },
          movie_stars: { $first: '$movie_stars' },
          movie_year: { $first: '$movie_year' }
        }
      }
    ]);
    
    // Process rating distribution
    const movies = movieAggregations.map(movie => {
      const ratingDist = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, '6': 0, '7': 0, '8': 0, '9': 0, '10': 0 };
      movie.rating_distribution.forEach(rating => {
        const key = rating.toString();
        if (ratingDist[key] !== undefined) {
          ratingDist[key]++;
        }
      });
      
      return {
        title: movie._id,
        total_reviews: movie.total_reviews,
        average_rating: Math.round(movie.average_rating * 100) / 100,
        rating_distribution: ratingDist,
        total_helpful_votes: movie.total_helpful_votes,
        total_votes: movie.total_votes,
        average_review_length: Math.round(movie.average_review_length),
        first_review_date: movie.first_review_date,
        last_review_date: movie.last_review_date,
        movie_imdb_rating: movie.movie_imdb_rating,
        movie_genres: movie.movie_genres,
        movie_directors: movie.movie_directors,
        movie_stars: movie.movie_stars,
        movie_year: movie.movie_year
      };
    });
    
    await Movie.insertMany(movies);
    console.log(`✅ Created ${movies.length} movie aggregations`);
    
    // Create user aggregations
    console.log('🔄 Creating user aggregations...');
    const userAggregations = await Review.aggregate([
      {
        $group: {
          _id: '$user_id',
          total_reviews: { $sum: 1 },
          average_rating: { $avg: '$rating' },
          rating_distribution: {
            $push: '$rating'
          },
          total_helpful_votes_received: { $sum: '$helpful_votes' },
          total_votes_received: { $sum: '$total_votes' },
          average_review_length: { $avg: { $strLenCP: '$review_content' } },
          first_review_date: { $min: '$review_date' },
          last_review_date: { $max: '$review_date' }
        }
      }
    ]);
    
    // Process user rating distribution
    const users = userAggregations.map(user => {
      const ratingDist = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, '6': 0, '7': 0, '8': 0, '9': 0, '10': 0 };
      user.rating_distribution.forEach(rating => {
        const key = rating.toString();
        if (ratingDist[key] !== undefined) {
          ratingDist[key]++;
        }
      });
      
      return {
        user_id: user._id,
        total_reviews: user.total_reviews,
        average_rating: Math.round(user.average_rating * 100) / 100,
        rating_distribution: ratingDist,
        total_helpful_votes_received: user.total_helpful_votes_received,
        total_votes_received: user.total_votes_received,
        average_review_length: Math.round(user.average_review_length),
        first_review_date: user.first_review_date,
        last_review_date: user.last_review_date
      };
    });
    
    await User.insertMany(users);
    console.log(`✅ Created ${users.length} user aggregations`);
    
    // Create indexes
    console.log('🔄 Creating database indexes...');
    await Review.createIndexes();
    await Movie.createIndexes();
    await User.createIndexes();
    console.log('✅ Database indexes created');
    
    console.log('\n✅ IBM Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Reviews loaded: ${allReviews.length}`);
    console.log(`   - Movies aggregated: ${movies.length}`);
    console.log(`   - Users aggregated: ${users.length}`);
    console.log(`   - Movie folders processed: ${movieFolders.length}`);
    
    console.log('\n🎉 You can now start the API server with: npm start');
    
  } catch (error) {
    console.error('❌ Seeding error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Database connection closed');
  }
};

// Run the seeding
seedDatabase();
