const express = require('express');
const router = express.Router();
const { runBenchmarks } = require('../services/benchmarkService');

// Run all benchmarks
router.get('/', async (req, res) => {
  try {
    const startTime = Date.now();
    const results = await runBenchmarks();
    const endTime = Date.now();

    // Save results to file
    const filename = `benchmarks-${new Date().toISOString().split('T')[0]}.json`;
    const filePath = `benchmarks/${filename}`;
    await require('fs').promises.writeFile(filePath, JSON.stringify(results, null, 2));

    res.json({
      success: true,
      timing: {
        startedAt: new Date(startTime).toISOString(),
        endedAt: new Date(endTime).toISOString(),
        totalDurationMs: endTime - startTime
      },
      results,
      reportPath: filePath
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
