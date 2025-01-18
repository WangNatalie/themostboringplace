const express = require('express');
const router = express.Router();
const { calculateBoringnessScore } = require('../utils/boringScoreCalcUtil'); // Importing the utility function

// Define the route for calculating boringness
router.get('/locationBoringness', async (req, res) => {
  const { latitude, longitude } = req.query;

  if (!latitude || !longitude) {
    return res.status(400).json({ error: 'Latitude and longitude are required' });
  }

  try {
    const boringnessScore = await calculateBoringnessScore(latitude, longitude);
    res.json({ boringnessScore });
  } catch (err) {
    res.status(500).json({ error: 'An error occurred while calculating boringness' });
  }
});

module.exports = router; // Use module.exports to export the router
