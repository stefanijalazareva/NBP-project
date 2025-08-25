const mongoose = require('mongoose');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const ReviewA = require('../models/ReviewA');

async function seedModelA() {
  try {
    console.log('Starting Model A ingestion...');
    
    // Clear existing data
    await ReviewA.deleteMany({});
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
              id: data.movie_id || `m_${Math.random().toString(36).substr(2, 9)}`,
              title: data.movie_title?.trim(),
              year: parseInt(data.year) || null,
              genres: (data.genres || '').split(',').map(g => g.trim()).filter(Boolean),
              directors: (data.directors || '').split(',').map(d => d.trim()).filter(Boolean),
              stars: (data.stars || '').split(',').map(s => s.trim()).filter(Boolean),
              imdb_rating: parseFloat(data.imdb_rating) || null
            },
            user: {
              id: data.user_id || `u_${Math.random().toString(36).substr(2, 9)}`,
              name: data.username?.trim()
            },
            rating: parseInt(data.rating) || Math.floor(Math.random() * 10) + 1,
            review_title: data.review_title?.trim() || 'No Title',
            review_content: data.review_content?.trim() || 'No content',
            review_date: new Date(data.review_date) || new Date(),
            helpful_votes: parseInt(data.helpful_votes) || 0,
            total_votes: parseInt(data.total_votes) || 0,
            spoiler_tag: data.spoiler_tag === 'true',
            verified_purchase: data.verified_purchase === 'true'
          };
          
          // Validate data
          if (review.movie.title && review.review_content) {
            results.push(review);
          }
        })
        .on('end', () => {
          console.log(`Parsed ${results.length} reviews`);
          resolve();
        })
        .on('error', reject);
    });
    
    // Insert in batches
    const batchSize = 1000;
    for (let i = 0; i < results.length; i += batchSize) {
      const batch = results.slice(i, i + batchSize);
      await ReviewA.insertMany(batch);
      console.log(`Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(results.length / batchSize)}`);
    }
    
    // Create indexes
    await ReviewA.createIndexes();
    console.log('Created indexes');
    
    const counts = {
      reviews: await ReviewA.countDocuments(),
      uniqueMovies: (await ReviewA.distinct('movie.title')).length,
      uniqueUsers: (await ReviewA.distinct('user.id')).length
    };
    
    console.log('Model A Ingestion Summary:');
    console.log(`   Reviews: ${counts.reviews}`);
    console.log(`   Unique Movies: ${counts.uniqueMovies}`);
    console.log(`   Unique Users: ${counts.uniqueUsers}`);
    
    return counts;
  } catch (error) {
    console.error('Model A ingestion failed:', error.message);
    throw error;
  }
}

if (require.main === module) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => seedModelA())
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = { seedModelA };
