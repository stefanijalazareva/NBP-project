const express = require('express');
const router = express.Router();
const { seedModelA } = require('../scripts/ingest-model-a.js');
const { seedModelB } = require('../scripts/ingest-model-b.js');

// Ingest endpoint - triggers dataset load
router.post('/', async (req, res) => {
  try {
    console.log('Received ingestion request');
    const { model } = req.query;
    console.log('Model parameter:', model);
    
    if (!model || !['A', 'B'].includes(model.toUpperCase())) {
      console.log('Invalid model parameter:', model);
      return res.status(400).json({
        success: false,
        error: 'Invalid model parameter. Use model=A or model=B'
      });
    }

    console.log(`Starting ingestion for Model ${model}`);
    const startTime = Date.now();
    
    let result;
    if (model.toUpperCase() === 'A') {
      try {
        result = await seedModelA();
        console.log('Model A ingestion completed successfully');
      } catch (modelError) {
        console.error('Model A ingestion failed:', modelError);
        return res.status(500).json({
          success: false,
          error: modelError.message,
          details: modelError.stack
        });
      }
    } else {
      try {
        result = await seedModelB();
        console.log('Model B ingestion completed successfully');
      } catch (modelError) {
        console.error(' Model B ingestion failed:', modelError);
        return res.status(500).json({
          success: false,
          error: modelError.message,
          details: modelError.stack
        });
      }
    }

    const endTime = Date.now();
    const duration = endTime - startTime;
    console.log(`Ingestion completed in ${duration}ms`);
    
    res.json({
      success: true,
      model: model.toUpperCase(),
      duration: duration,
      counts: result
    });
  } catch (error) {
    console.error('Unexpected error in ingest route:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      details: error.stack
    });
  }
});

module.exports = router;
