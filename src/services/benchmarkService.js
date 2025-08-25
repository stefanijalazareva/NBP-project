const { queries } = require('./queryService');
const { dropIndexes, createIndexes } = require('./indexService');

// Sample parameters for each query
const sampleParams = {
  Q1: { title: 'The Dark Knight', limit: 20 },
  Q2: { userId: 'user123', limit: 100 },
  Q3: { minRating: 8, startDate: '2020-01-01', endDate: '2023-12-31', limit: 100 },
  Q4: { minReviews: 50, limit: 10 },
  Q5: { limit: 10 },
  Q6: { searchText: 'great acting', limit: 20 },
  Q7: {},
  Q8: { title: 'The Dark Knight' },
  Q9: { minVotes: 10, limit: 10 },
  Q10: { minReviews: 3, minRating: 8.5, limit: 10 }
};

// Run a single query with warmup
async function runQueryBenchmark(queryId, model, params) {
  const queryFn = queries[queryId][`model${model}`];
  
  // Warmup run
  await queryFn(params);
  
  // Timed runs
  const times = [];
  for (let i = 0; i < 3; i++) {
    const start = Date.now();
    await queryFn(params);
    times.push(Date.now() - start);
  }
  
  // Calculate median
  times.sort((a, b) => a - b);
  const median = times[1];
  
  return {
    queryId,
    model,
    median,
    min: Math.min(...times),
    max: Math.max(...times)
  };
}

// Run complete benchmark suite
async function runBenchmarks() {
  const results = {
    timestamp: new Date().toISOString(),
    environment: {
      node: process.version,
      platform: process.platform
    },
    withIndexes: {},
    withoutIndexes: {}
  };

  // Test with indexes
  for (const model of ['A', 'B']) {
    await createIndexes(model);
    results.withIndexes[`model${model}`] = {};
    
    for (const queryId of Object.keys(queries)) {
      results.withIndexes[`model${model}`][queryId] = 
        await runQueryBenchmark(queryId, model, sampleParams[queryId]);
    }
  }

  // Test without indexes
  for (const model of ['A', 'B']) {
    await dropIndexes(model);
    results.withoutIndexes[`model${model}`] = {};
    
    for (const queryId of Object.keys(queries)) {
      results.withoutIndexes[`model${model}`][queryId] = 
        await runQueryBenchmark(queryId, model, sampleParams[queryId]);
    }
  }

  // Restore indexes
  for (const model of ['A', 'B']) {
    await createIndexes(model);
  }

  return results;
}

module.exports = {
  runBenchmarks
};
