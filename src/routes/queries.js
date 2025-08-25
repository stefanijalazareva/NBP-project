const express = require('express');
const router = express.Router();
const { executeQuery } = require('../services/queryService');

// Execute specific query
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { model, ...params } = req.query;

    if (!model || !['A', 'B'].includes(model.toUpperCase())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid model parameter. Use model=A or model=B'
      });
    }

    const startTime = Date.now();
    const result = await executeQuery(id, model.toUpperCase(), params);
    const endTime = Date.now();

    res.json({
      success: true,
      queryId: id,
      model: model.toUpperCase(),
      timing: {
        startedAt: new Date(startTime).toISOString(),
        endedAt: new Date(endTime).toISOString(),
        elapsedMs: endTime - startTime
      },
      result: {
        docsReturned: result.length,
        data: result
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
