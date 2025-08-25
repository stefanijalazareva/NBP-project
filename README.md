# IMDB User Reviews API

A comprehensive REST API for analyzing IMDB user reviews using MongoDB as a document-based NoSQL database. This project demonstrates advanced querying techniques, data aggregation, and performance optimization for unstructured data.

## Project Overview

This project provides a complete solution for storing, querying, and analyzing IMDB user reviews data. It includes:

- **Document-based NoSQL database** using MongoDB
- **RESTful API** built with Node.js and Express
- **Advanced querying** with simple, medium, and complex complexity levels
- **Data aggregation** and analytics capabilities
- **Performance testing** and optimization
- **Docker containerization** for easy deployment

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client Apps   │    │   Express API   │    │   MongoDB       │
│                 │◄──►│   (Node.js)     │◄──►│   Database      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   Analytics     │
                       │   & Reports     │
                       └─────────────────┘
```

## Features

### Data Management
- **Raw data import** from CSV with data cleaning and validation
- **Two-level aggregation**: Raw reviews + aggregated summaries (movies/users)
- **Automatic index creation** for optimal query performance
- **Data transformation** and enrichment

### API Endpoints
- **Simple queries**: Basic filtering and pagination
- **Medium complexity**: Multi-criteria filtering and sorting
- **Complex queries**: Aggregation pipelines and analytics
- **Performance testing**: Query execution time measurement

### Analytics & Reporting
- **Platform overview** statistics
- **Rating distribution** analysis
- **Top movies and reviewers** rankings
- **Monthly trends** and patterns
- **Genre analysis** (based on title patterns)
- **Review length** analysis
- **Sentiment analysis** support (if data available)

## Prerequisites

- Node.js (v16 or higher)
- Docker and Docker Compose
- MongoDB (provided via Docker)
- Git

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/stefanijalazareva/NBP-project
cd NBP-project
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Copy the example environment file and configure it:

```bash
cp env.example .env
```

Edit `.env` file with your configuration:

```env
# Database Configuration
MONGODB_URI=mongodb://admin:password123@localhost:27017/imdb_reviews?authSource=admin

# Server Configuration
PORT=3000
NODE_ENV=development

# Dataset Configuration
DATASET_URL=https://www.kaggle.com/datasets/sadmadlad/imdb-user-reviews
DATASET_FILENAME=imdb_user_reviews.csv
```

### 4. Dataset Setup

**Option A: Use Sample Data (Quick Start)**
```bash
npm run seed
```
This will create a sample dataset for testing.

**Option B: Use Real IMDB Dataset**
1. Download the IMDB User Reviews dataset from [Kaggle](https://www.kaggle.com/datasets/sadmadlad/imdb-user-reviews)
2. Place the CSV file at `data/imdb_user_reviews.csv`
3. Run the seed script:
```bash
npm run seed
```

**Option C: Use IBM Movie Reviews Dataset**
1. Ensure your `data/ibm-users-review/` folder contains movie folders with the following structure:
   ```
   data/ibm-users-review/
   ├── Movie Title 1/
   │   ├── movieReviews.csv
   │   └── metadata.json
   ├── Movie Title 2/
   │   ├── movieReviews.csv
   │   └── metadata.json
   └── ...
   ```
2. Run the IBM seed script:
```bash
npm run seed-ibm
```

## Running with Docker

### Quick Start with Docker Compose

```bash
# Build and start all services
docker-compose up --build

# Run in background
docker-compose up -d --build

# Stop services
docker-compose down
```

### Manual Docker Setup

```bash
# Build the API image
docker build -t imdb-api .

# Run MongoDB container
docker run -d --name mongodb \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=password123 \
  -p 27017:27017 \
  mongo:6.0

# Run API container
docker run -d --name imdb-api \
  -e MONGODB_URI=mongodb://admin:password123@host.docker.internal:27017/imdb_reviews?authSource=admin \
  -p 3000:3000 \
  imdb-api
```

## Running Locally

### 1. Start MongoDB

```bash
# Using Docker
docker run -d --name mongodb \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=password123 \
  -p 27017:27017 \
  mongo:6.0

# Or install MongoDB locally
```

### 2. Seed the Database

```bash
npm run seed
```

### 3. Start the API Server

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The API will be available at `http://localhost:3000`

## API Documentation

### Base URL
```
http://localhost:3000/api/v1
```

### Authentication
Currently, the API doesn't require authentication for demonstration purposes.

### Response Format
All API responses follow this format:
```json
{
  "success": true,
  "data": {...},
  "pagination": {...}, // if applicable
  "performance": {...} // for analytics endpoints
}
```

## API Endpoints

### Health Check
```http
GET /health
```

### Reviews Endpoints

#### 1. Get All Reviews (Simple)
```http
GET /api/v1/reviews?page=1&limit=10
```

#### 2. Get Reviews by Movie (Simple)
```http
GET /api/v1/reviews/movie/{title}?page=1&limit=10&rating=8
```

#### 3. Get Reviews by User (Simple)
```http
GET /api/v1/reviews/user/{userId}?page=1&limit=10
```

#### 4. Get Reviews by Rating Range (Simple)
```http
GET /api/v1/reviews/rating/{min}/{max}?page=1&limit=10
```

#### 5. Get Helpful Reviews (Medium)
```http
GET /api/v1/reviews/helpful?page=1&limit=10&minVotes=10
```

#### 6. Get Recent Reviews with Sentiment (Medium)
```http
GET /api/v1/reviews/recent/sentiment?page=1&limit=10&sentiment=positive
```

#### 7. Get Detailed Review (Complex)
```http
GET /api/v1/reviews/detailed/{reviewId}
```

#### 8. Advanced Filtering (Complex)
```http
GET /api/v1/reviews/advanced?movieTitle=The&minRating=7&maxRating=10&minDate=2023-01-01&sortBy=rating&sortOrder=desc
```

#### 9. Movie Statistics (Complex)
```http
GET /api/v1/reviews/stats/movie/{title}
```

#### 10. User Statistics (Complex)
```http
GET /api/v1/reviews/stats/user/{userId}
```

### Analytics Endpoints

#### 1. Platform Overview
```http
GET /api/v1/analytics/overview
```

#### 2. Rating Distribution
```http
GET /api/v1/analytics/rating-distribution
```

#### 3. Top Movies
```http
GET /api/v1/analytics/top-movies?limit=10&minReviews=10
```

#### 4. Top Reviewers
```http
GET /api/v1/analytics/top-reviewers?limit=10&minReviews=5
```

#### 5. Monthly Trends
```http
GET /api/v1/analytics/monthly-trends?months=12
```

#### 6. Sentiment Distribution
```http
GET /api/v1/analytics/sentiment-distribution
```

#### 7. Genre Analysis
```http
GET /api/v1/analytics/genre-analysis
```

#### 8. Review Length Analysis
```http
GET /api/v1/analytics/review-length-analysis
```

### Performance Testing Endpoints

#### 1. Test Simple Queries
```http
GET /api/v1/performance/test-simple
```

#### 2. Test Medium Complexity Queries
```http
GET /api/v1/performance/test-medium
```

#### 3. Test Complex Queries
```http
GET /api/v1/performance/test-complex
```

#### 4. Test Indexing Performance
```http
GET /api/v1/performance/test-indexing
```

#### 5. Database Statistics
```http
GET /api/v1/performance/database-stats
```

#### 6. Comprehensive Performance Test
```http
GET /api/v1/performance/comprehensive-test
```

## Example API Requests

### Using curl

```bash
# Get all reviews
curl -X GET "http://localhost:3000/api/v1/reviews?limit=5"

# Get reviews for a specific movie
curl -X GET "http://localhost:3000/api/v1/reviews/movie/The%20Shawshank%20Redemption"

# Get platform overview
curl -X GET "http://localhost:3000/api/v1/analytics/overview"

# Get top movies
curl -X GET "http://localhost:3000/api/v1/analytics/top-movies?limit=5"

# Test performance
curl -X GET "http://localhost:3000/api/v1/performance/test-simple"
```

### Using Postman

1. Import the following collection:
```json
{
  "info": {
    "name": "IMDB Reviews API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Get All Reviews",
      "request": {
        "method": "GET",
        "url": "http://localhost:3000/api/v1/reviews?limit=10"
      }
    },
    {
      "name": "Get Analytics Overview",
      "request": {
        "method": "GET",
        "url": "http://localhost:3000/api/v1/analytics/overview"
      }
    }
  ]
}
```

## Testing

### Run Performance Tests

```bash
# Run comprehensive performance tests
npm test

# Or run the test script directly
node src/scripts/performance-test.js
```

### Manual Testing

1. Start the server: `npm start`
2. Open a new terminal
3. Run performance tests: `npm test`
4. Check the console output for detailed results

## Data Schema

### Review Document
```json
{
  "_id": "ObjectId",
  "user_id": "String",
  "movie_title": "String",
  "rating": "Number (1-10)",
  "review_title": "String",
  "review_content": "String",
  "review_date": "Date",
  "helpful_votes": "Number",
  "total_votes": "Number",
  "spoiler_tag": "Boolean",
  "verified_purchase": "Boolean",
  "helpfulness_ratio": "Number",
  "review_length": "Number",
  "sentiment_score": "Number",
  "sentiment_label": "String",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### Movie Document (Aggregated)
```json
{
  "_id": "ObjectId",
  "title": "String",
  "total_reviews": "Number",
  "average_rating": "Number",
  "rating_distribution": {
    "1": "Number",
    "2": "Number",
    // ... up to "10"
  },
  "total_helpful_votes": "Number",
  "total_votes": "Number",
  "average_review_length": "Number",
  "first_review_date": "Date",
  "last_review_date": "Date",
  "helpfulness_ratio": "Number"
}
```

### User Document (Aggregated)
```json
{
  "_id": "ObjectId",
  "user_id": "String",
  "total_reviews": "Number",
  "average_rating": "Number",
  "rating_distribution": {
    "1": "Number",
    "2": "Number",
    // ... up to "10"
  },
  "total_helpful_votes_received": "Number",
  "total_votes_received": "Number",
  "average_review_length": "Number",
  "first_review_date": "Date",
  "last_review_date": "Date",
  "review_frequency": "Number",
  "activity_period_days": "Number"
}
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb://admin:password123@localhost:27017/imdb_reviews?authSource=admin` |
| `PORT` | API server port | `3000` |
| `NODE_ENV` | Environment mode | `development` |
| `DATASET_URL` | Kaggle dataset URL | `https://www.kaggle.com/datasets/sadmadlad/imdb-user-reviews` |
| `DATASET_FILENAME` | Dataset filename | `imdb_user_reviews.csv` |

### MongoDB Indexes

The following indexes are automatically created for optimal performance:

**Reviews Collection:**
- `movie_title` (text search)
- `user_id` (lookup)
- `rating` (range queries)
- `review_date` (date queries)
- `movie_title + rating` (compound)
- `user_id + review_date` (compound)

**Movies Collection:**
- `title` (unique)
- `average_rating` (sorting)
- `review_count` (sorting)

**Users Collection:**
- `user_id` (unique)
- `review_count` (sorting)
- `average_rating` (sorting)

## Performance Optimization

### Query Optimization Strategies

1. **Indexing**: Strategic indexes on frequently queried fields
2. **Aggregation**: Pre-computed summaries for complex analytics
3. **Pagination**: Efficient pagination for large result sets
4. **Field Selection**: Only retrieve necessary fields
5. **Query Patterns**: Optimized query patterns for common use cases

### Performance Monitoring

- Real-time query execution time measurement
- Database statistics and index usage
- Comprehensive performance test suite
- Comparison of different indexing strategies

## Deployment

### Production Deployment

1. **Environment Setup**
```bash
NODE_ENV=production
MONGODB_URI=mongodb://your-production-mongodb-uri
```

2. **Docker Production Build**
```bash
docker build -t imdb-api:production .
docker run -d --name imdb-api-prod \
  -e NODE_ENV=production \
  -e MONGODB_URI=your-production-mongodb-uri \
  -p 3000:3000 \
  imdb-api:production
```

3. **Load Balancer Setup**
```bash
# Using nginx
upstream imdb_api {
    server localhost:3000;
}

server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://imdb_api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -am 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support and questions:

1. Check the [Issues](https://github.com/your-repo/issues) page
2. Create a new issue with detailed description
3. Contact the development team

## Additional Resources

- [MongoDB Documentation](https://docs.mongodb.com/)
- [Express.js Documentation](https://expressjs.com/)
- [Node.js Documentation](https://nodejs.org/docs/)
- [Docker Documentation](https://docs.docker.com/)

---

**Note**: This project is designed for educational and demonstration purposes. For production use, additional security measures, error handling, and monitoring should be implemented.
