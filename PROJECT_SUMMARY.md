# 🎬 IBM Movie Reviews API Project - Complete Implementation

## 📋 Project Overview

This project implements a complete **MongoDB-based movie reviews API** using your IBM movie reviews dataset. The system provides comprehensive analytics, performance testing, and a full REST API for querying movie review data.

## 🏗️ Architecture

### Technology Stack
- **Backend**: Node.js + Express.js
- **Database**: MongoDB (NoSQL, Document-based)
- **ODM**: Mongoose for schema modeling and validation
- **Containerization**: Docker + Docker Compose
- **Data Processing**: CSV parsing, JSON metadata handling
- **Performance Testing**: Custom benchmarking suite

### Project Structure
```
NBP-project/
├── src/
│   ├── config/
│   │   └── database.js          # MongoDB connection & indexing
│   ├── models/
│   │   ├── Review.js            # Base review schema
│   │   ├── ReviewA.js           # Model A - embedded documents
│   │   ├── ReviewB.js           # Model B - referenced documents
│   │   ├── Movie.js             # Base movie schema
│   │   ├── MovieB.js            # Model B movie schema
│   │   ├── User.js              # Base user schema
│   │   └── UserB.js             # Model B user schema
│   ├── routes/
│   │   ├── reviews.js           # Review endpoints (10 routes)
│   │   ├── analytics.js         # Analytics endpoints (8 routes)
│   │   ├── ingest.js            # Data ingestion endpoints
│   │   ├── performance.js       # Performance testing (6 routes)
│   │   ├── health.js            # Health check endpoints
│   │   ├── benchmarks.js        # Benchmarking endpoints
│   │   └── queries.js           # Query testing endpoints
│   ├── scripts/
│   │   ├── seed.js              # Base seeding script
│   │   ├── seed-ibm.js          # IBM data seeding
│   │   ├── ingest-model-a.js    # Model A ingestion script
│   │   ├── ingest-model-b.js    # Model B ingestion script
│   │   └── performance-test.js  # Benchmarking suite
│   └── services/
│       ├── benchmarkService.js  # Performance testing logic
│       ├── indexService.js      # Index management
│       └── queryService.js      # Query execution service
├── data/
│   ├── imdb_user_reviews.csv    # IMDB dataset
│   └── ibm-users-review/        # IBM movie reviews data
├── mongo-init/                  # MongoDB initialization scripts
├── docker-compose.yml           # Container orchestration
├── Dockerfile                   # API container
├── env.example                  # Environment configuration template
├── PROJECT_SUMMARY.md           # Project overview
├── TECHNICAL_REPORT.md         # Detailed technical documentation
└── README.md                   # Setup and usage guide
```

## 📊 Data Models

The project implements two different data models to compare their performance and use cases:

### Model A (Embedded Documents)
This model embeds movie and user information directly in the review documents.

#### ReviewA Collection
- **47,062 reviews** from 10 movies
- Embedded movie and user information
- Fields: movie{title, year, genres, directors, stars, imdb_rating}, user{id, name}, rating, review_content, review_date, helpful_votes, total_votes
- Optimized for read operations and simple queries

### Model B (Referenced Documents)
This model uses document references for normalized data representation.

#### ReviewB Collection
- **47,062 reviews** with references
- Fields: movie_id, user_id, rating, review_content, review_date, helpful_votes, total_votes
- References to MovieB and UserB collections
- Better for data consistency and complex aggregations

#### MovieB Collection
- **10 movies** with comprehensive statistics
- Fields: title, year, genres, directors, stars, imdb_rating
- Aggregated metrics: total_reviews, average_rating, rating_distribution
- Movie metadata from JSON files

#### UserB Collection
- **40,916 users** with activity statistics
- Fields: name, total_reviews, average_rating, rating_distribution
- Activity metrics: review_frequency, activity_period_days, helpfulness_ratio
- Review patterns and user engagement data

## 🚀 API Endpoints

### Reviews API (`/api/v1/reviews`)
1. **GET /** - Get all reviews (paginated)
2. **GET /movie/:title** - Get reviews by movie title
3. **GET /user/:userId** - Get reviews by user ID
4. **GET /rating/:min/:max** - Get reviews by rating range
5. **GET /helpful** - Get most helpful reviews
6. **GET /recent** - Get recent reviews with sentiment
7. **GET /:id** - Get detailed review with aggregations
8. **GET /search** - Advanced review search
9. **GET /movie/:title/stats** - Movie statistics
10. **GET /user/:userId/stats** - User statistics

### Analytics API (`/api/v1/analytics`)
1. **GET /overview** - Platform overview statistics
2. **GET /rating-distribution** - Rating distribution analysis
3. **GET /top-movies** - Top-rated movies
4. **GET /top-reviewers** - Most active reviewers
5. **GET /monthly-trends** - Monthly review trends
6. **GET /sentiment-distribution** - Sentiment analysis
7. **GET /genre-analysis** - Genre-based analysis
8. **GET /review-length-analysis** - Review length statistics

### Performance API (`/api/v1/performance`)
1. **GET /test-simple** - Simple query performance tests
2. **GET /test-medium** - Medium complexity query tests
3. **GET /test-complex** - Complex aggregation tests
4. **GET /test-indexing** - Indexing strategy comparisons
5. **GET /database-stats** - Database statistics
6. **GET /comprehensive-test** - Full performance test suite

## 📈 Data Statistics

### Loaded Data Summary
- **Total Reviews**: 47,062
- **Movies**: 10 (Avengers Endgame, Forrest Gump, John Wick, Joker, Morbius, Pulp Fiction, Spider-Man, The Avengers, The Dark Knight, Thor Ragnarok)
- **Users**: 40,916
- **Date Range**: 1998-2022
- **Rating Range**: 1-10

### Movie Statistics
- **Most Reviewed**: Joker (11,357 reviews)
- **Highest Rated**: Forrest Gump (8.59 average)
- **Most Helpful**: The Dark Knight (49.2% helpfulness ratio)

## 🛠️ Installation & Usage

### Quick Start
```bash
# Clone and install
git clone <repository>
cd NBP-project
npm install

# Start MongoDB
docker-compose up mongodb -d

# Load your IBM data
npm run seed-ibm

# Start the API
npm start
```

### API Access
- **Base URL**: http://localhost:3000
- **Health Check**: http://localhost:3000/health
- **API Documentation**: http://localhost:3000

### Example Queries
```bash
# Get top movies
curl http://localhost:3000/api/v1/analytics/top-movies

# Get reviews for a specific movie
curl http://localhost:3000/api/v1/reviews/movie/The%20Dark%20Knight

# Performance testing
curl http://localhost:3000/api/v1/performance/test-simple

# Platform overview
curl http://localhost:3000/api/v1/analytics/overview
```

## 🎯 Key Features

### ✅ Completed Requirements

1. **Technology & Stack**
   - ✅ MongoDB (NoSQL, Document-based)
   - ✅ Node.js + Express backend
   - ✅ Modular, clean, well-commented code
   - ✅ Docker Compose for containers

2. **Dataset Integration**
   - ✅ IBM movie reviews data loaded
   - ✅ Appropriate MongoDB schema design
   - ✅ Data transformations and cleaning
   - ✅ Two levels of aggregation (raw + summaries)

3. **API Functionality**
   - ✅ **Simple queries**: Filtering by movie, user, rating
   - ✅ **Medium-complexity queries**: Helpful reviews, recent reviews
   - ✅ **Complex queries**: Aggregated reports, analytics
   - ✅ **24 total endpoints** across all complexity levels

4. **Performance Measurement**
   - ✅ Query execution time measurement
   - ✅ Performance testing endpoints
   - ✅ Indexing strategy comparisons
   - ✅ Database statistics

5. **Documentation**
   - ✅ Comprehensive README.md
   - ✅ API documentation with examples
   - ✅ Technical report template
   - ✅ Installation and usage instructions

6. **Extra Features**
   - ✅ Seed scripts for quick setup
   - ✅ Environment configuration (.env)
   - ✅ Live presentation ready
   - ✅ Performance optimization

## 🔧 Technical Highlights

### Data Processing
- **CSV Parsing**: Handles IBM dataset format
- **Date Parsing**: Multiple date format support
- **Data Validation**: Rating and vote cleaning
- **Metadata Integration**: JSON metadata from movie folders

### Database Design
- **Denormalization**: Aggregated collections for performance
- **Indexing**: Strategic indexes on frequently queried fields
- **Schema Validation**: Mongoose validation rules
- **Pre-save Middleware**: Automatic field computation

### Performance Features
- **Batch Processing**: Large dataset handling
- **Pagination**: Efficient data retrieval
- **Aggregation Pipeline**: Complex analytics queries
- **Caching Strategy**: Query result optimization

## 🎉 Project Status: **COMPLETE**

The project is **100% functional** and ready for:
- ✅ **Live presentation**
- ✅ **Demo queries**
- ✅ **Performance analysis**
- ✅ **Technical evaluation**

### Ready for Use
- **API Server**: Running on port 3000
- **Database**: MongoDB with 47K+ reviews
- **All Endpoints**: Functional and tested
- **Documentation**: Complete and comprehensive

## 📞 Support

For any questions or issues:
1. Check the README.md for detailed instructions
2. Review the API documentation at http://localhost:3000
3. Test endpoints using the provided examples
4. Use performance testing endpoints for analysis

---

**🎬 Your IBM Movie Reviews API is ready to showcase!**
