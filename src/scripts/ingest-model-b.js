const mongoose = require('mongoose');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const ReviewB = require('../models/ReviewB');
const MovieB = require('../models/MovieB');
const UserB = require('../models/UserB');

async function seedModelB() {
  try {
    console.log('Starting Model B ingestion...');
    
    // Clear existing data
    await Promise.all([
      ReviewB.deleteMany({}),
      MovieB.deleteMany({}),
      UserB.deleteMany({})
    ]);
    console.log('Cleared existing data');
    
    const results = [];
    const csvPath = path.join(__dirname, '../../data/imdb_user_reviews.csv');
    
    // Read and parse CSV
    await new Promise((resolve, reject) => {
      fs.createReadStream(csvPath)
        .pipe(csv())
        .on('data', (data) => {
          // Clean and transform data
          const review = {
            movie: {
              title: data.movie_title?.trim(),
              year: parseInt(data.year) || null,
              genres: (data.genres || '').split(',').map(g => g.trim()).filter(Boolean),
              directors: (data.directors || '').split(',').map(d => d.trim()).filter(Boolean),
              stars: (data.stars || '').split(',').map(s => s.trim()).filter(Boolean),
              imdb_rating: parseFloat(data.imdb_rating) || null
            },
            user: {
              name: data.username?.trim()
            },
            review: {
              rating: parseInt(data.rating) || Math.floor(Math.random() * 10) + 1,
              review_title: data.review_title?.trim() || 'No Title',
              review_content: data.review_content?.trim() || 'No content',
              review_date: new Date(data.review_date) || new Date(),
              helpful_votes: parseInt(data.helpful_votes) || 0,
              total_votes: parseInt(data.total_votes) || 0,
              spoiler_tag: data.spoiler_tag === 'true',
              verified_purchase: data.verified_purchase === 'true'
            }
          };
          
          // Validate data
          if (review.movie.title && review.review.review_content) {
            results.push(review);
          }
        })
        .on('end', () => {
          console.log(`Parsed ${results.length} reviews`);
          resolve();
        })
        .on('error', reject);
    });
    
    // Process data in memory for unique movies and users
    const movies = new Map();
    const users = new Map();
    
    results.forEach(result => {
      // Aggregate movie stats
      if (!movies.has(result.movie.title)) {
        movies.set(result.movie.title, {
          ...result.movie,
          total_reviews: 0,
          rating_sum: 0,
          rating_distribution: {
            '1': 0, '2': 0, '3': 0, '4': 0, '5': 0,
            '6': 0, '7': 0, '8': 0, '9': 0, '10': 0
          }
        });
      }
      const movie = movies.get(result.movie.title);
      movie.total_reviews++;
      movie.rating_sum += result.review.rating;
      movie.rating_distribution[result.review.rating]++;
      
      // Aggregate user stats
      if (!users.has(result.user.name)) {
        users.set(result.user.name, {
          name: result.user.name,
          total_reviews: 0,
          rating_sum: 0,
          total_helpful_votes: 0,
          total_votes: 0,
          rating_distribution: {
            '1': 0, '2': 0, '3': 0, '4': 0, '5': 0,
            '6': 0, '7': 0, '8': 0, '9': 0, '10': 0
          }
        });
      }
      const user = users.get(result.user.name);
      user.total_reviews++;
      user.rating_sum += result.review.rating;
      user.total_helpful_votes += result.review.helpful_votes;
      user.total_votes += result.review.total_votes;
      user.rating_distribution[result.review.rating]++;
    });
    
    // Insert movies
    console.log('Inserting movies...');
    const movieDocs = await MovieB.insertMany(
      Array.from(movies.values()).map(movie => ({
        ...movie,
        average_rating: movie.rating_sum / movie.total_reviews,
        rating_distribution: movie.rating_distribution
      }))
    );
    console.log(`Inserted ${movieDocs.length} movies`);
    
    // Create movie title to ID map
    const movieMap = movieDocs.reduce((map, movie) => {
      map[movie.title] = movie._id;
      return map;
    }, {});
    
    // Insert users
    console.log('Inserting users...');
    const userDocs = await UserB.insertMany(
      Array.from(users.values()).map(user => ({
        ...user,
        average_rating: user.rating_sum / user.total_reviews,
        helpfulness_ratio: user.total_votes > 0 ? 
          user.total_helpful_votes / user.total_votes : 0,
        rating_distribution: user.rating_distribution
      }))
    );
    console.log(`Inserted ${userDocs.length} users`);
    
    // Create username to ID map
    const userMap = userDocs.reduce((map, user) => {
      map[user.name] = user._id;
      return map;
    }, {});
    
    // Insert reviews in batches
    console.log('Inserting reviews...');
    const batchSize = 1000;
    for (let i = 0; i < results.length; i += batchSize) {
      const batch = results.slice(i, i + batchSize).map(result => ({
        movie_id: movieMap[result.movie.title],
        user_id: userMap[result.user.name],
        ...result.review
      }));
      await ReviewB.insertMany(batch);
      console.log(`Inserted reviews batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(results.length / batchSize)}`);
    }
    
    // Create indexes
    await Promise.all([
      ReviewB.createIndexes(),
      MovieB.createIndexes(),
      UserB.createIndexes()
    ]);
    console.log('Created indexes');
    
    const counts = {
      reviews: await ReviewB.countDocuments(),
      movies: await MovieB.countDocuments(),
      users: await UserB.countDocuments()
    };
    
    console.log('Model B Ingestion Summary:');
    console.log(`   Reviews: ${counts.reviews}`);
    console.log(`   Movies: ${counts.movies}`);
    console.log(`   Users: ${counts.users}`);
    
    return counts;
  } catch (error) {
    console.error('Model B ingestion failed:', error.message);
    throw error;
  }
}

if (require.main === module) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => seedModelB())
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = { seedModelB };
