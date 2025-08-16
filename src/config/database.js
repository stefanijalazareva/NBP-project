const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    
    // Create indexes for better performance
    await createIndexes();
    
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

const createIndexes = async () => {
  try {
    const Review = require('../models/Review');
    const Movie = require('../models/Movie');
    const User = require('../models/User');

    // Review indexes
    await Review.collection.createIndex({ movie_title: 1 });
    await Review.collection.createIndex({ user_id: 1 });
    await Review.collection.createIndex({ rating: 1 });
    await Review.collection.createIndex({ review_date: 1 });
    await Review.collection.createIndex({ movie_title: 1, rating: 1 });
    await Review.collection.createIndex({ user_id: 1, review_date: 1 });

    // Movie indexes
    await Movie.collection.createIndex({ title: 1 });
    await Movie.collection.createIndex({ average_rating: -1 });
    await Movie.collection.createIndex({ review_count: -1 });

    // User indexes
    await User.collection.createIndex({ user_id: 1 });
    await User.collection.createIndex({ review_count: -1 });
    await User.collection.createIndex({ average_rating: -1 });

    console.log('✅ Database indexes created successfully');
  } catch (error) {
    console.error('❌ Error creating indexes:', error.message);
  }
};

module.exports = connectDB;
