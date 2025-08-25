const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

// Helper function to create an index if it doesn't exist
const createIndexSafely = async (collection, index, options = {}) => {
  try {
    await collection.createIndex(index, { background: true, ...options });
  } catch (error) {
    if (!error.message.includes('existing index')) {
      console.error(`❌ Error creating index ${JSON.stringify(index)}:`, error.message);
    }
  }
};

const createIndexes = async (model) => {
  try {
    console.log(`Creating indexes for Model ${model}...`);
    
    if (model === 'A') {
      const ReviewA = require('../models/ReviewA');
      await createIndexSafely(ReviewA.collection, { 'movie.title': 1 });
      await createIndexSafely(ReviewA.collection, { 'movie.id': 1 });
      await createIndexSafely(ReviewA.collection, { 'user.id': 1 });
      await createIndexSafely(ReviewA.collection, { rating: -1 });
      await createIndexSafely(ReviewA.collection, { review_date: -1 });
      await createIndexSafely(ReviewA.collection, { 'movie.genres': 1 });
      await createIndexSafely(ReviewA.collection, { helpful_votes: -1 });
      await createIndexSafely(ReviewA.collection, { total_votes: -1 });
      await createIndexSafely(ReviewA.collection, 
        { review_content: 'text', 'movie.title': 'text' },
        { weights: { review_content: 3, 'movie.title': 2 } }
      );
    } else if (model === 'B') {
      const ReviewB = require('../models/ReviewB');
      const MovieB = require('../models/MovieB');
      const UserB = require('../models/UserB');

      // Review indexes
      await createIndexSafely(ReviewB.collection, { movie_id: 1 });
      await createIndexSafely(ReviewB.collection, { user_id: 1 });
      await createIndexSafely(ReviewB.collection, { rating: -1 });
      await createIndexSafely(ReviewB.collection, { review_date: -1 });
      await createIndexSafely(ReviewB.collection, { helpful_votes: -1 });
      await createIndexSafely(ReviewB.collection, { total_votes: -1 });
      await createIndexSafely(ReviewB.collection, 
        { review_content: 'text' },
        { weights: { review_content: 1 } }
      );

      // Movie indexes
      await createIndexSafely(MovieB.collection, { title: 1 }, { unique: true });
      await createIndexSafely(MovieB.collection, { year: -1 });
      await createIndexSafely(MovieB.collection, { genres: 1 });

      // User indexes
      await createIndexSafely(UserB.collection, { name: 1 });
      await createIndexSafely(UserB.collection, { total_reviews: -1 });
      await createIndexSafely(UserB.collection, { helpfulness_ratio: -1 });
    }

    console.log(`✅ Indexes created successfully for Model ${model}`);
  } catch (error) {
    console.error('❌ Error in index creation:', error.message);
  }
};

const dropIndexes = async (model) => {
  try {
    console.log(`Dropping indexes for Model ${model}...`);
    
    if (model === 'A') {
      const ReviewA = require('../models/ReviewA');
      await ReviewA.collection.dropIndexes();
    } else if (model === 'B') {
      const ReviewB = require('../models/ReviewB');
      const MovieB = require('../models/MovieB');
      const UserB = require('../models/UserB');
      
      await ReviewB.collection.dropIndexes();
      await MovieB.collection.dropIndexes();
      await UserB.collection.dropIndexes();
    }
    
    console.log(`✅ Indexes dropped successfully for Model ${model}`);
  } catch (error) {
    console.error('❌ Error dropping indexes:', error.message);
  }
};

module.exports = {
  connectDB,
  createIndexes,
  dropIndexes
};
