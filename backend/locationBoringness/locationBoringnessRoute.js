// locationBoringnessRoute.js
const express = require('express');
const router = express.Router();
const { calculateLocationScore } = require('../utils/boringScoreCalcUtil');

router.get('/locationBoringness', async (req, res) => {
  const { latitude, longitude } = req.query;

  if (!latitude || !longitude) {
    return res.status(400).json({
      error: 'Missing parameters',
      message: 'Both latitude and longitude are required',
    });
  }

  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);

  if (isNaN(lat) || lat < -90 || lat > 90 || isNaN(lng) || lng < -180 || lng > 180) {
    return res.status(400).json({
      error: 'Invalid coordinates',
      message: 'Latitude must be between -90 and 90, longitude between -180 and 180',
    });
  }

  try {
    const locationData = await calculateLocationScore(lat, lng);

    res.json({
      totalScore: locationData.totalScore,
      details: locationData.details,
      summary: {
        numberOfPlaces: locationData.numberOfPlaces,
        locationStats: Object.entries(locationData.details).map(([type, data]) => ({
          type,
          count: data.count,
          contribution: data.score,
        })),
      },
    });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({
      error: 'Server error',
      message: err.message || 'An error occurred while calculating location score',
    });
  }
});

module.exports = router;

// boringScoreCalcUtil.js
const axios = require('axios');

const PLACE_TYPE_SCORES = {
  bar: 1,
  night_club: 2,
  casino: 3,
  liquor_store: 8,
  place_of_worship: 7,
};

async function calculateLocationScore(latitude, longitude) {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error('Google API key is not configured');
  }

  const baseUrl = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';
  let allPlaces = [];
  let pageToken = null;

  try {
    do {
      const params = {
        location: `${latitude},${longitude}`,
        radius: 10000,
        key: apiKey,
        type: Object.keys(PLACE_TYPE_SCORES).join('|'),
      };

      if (pageToken) {
        params.pagetoken = pageToken;
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      const response = await axios.get(baseUrl, { params });

      if (response.data.status === 'REQUEST_DENIED') {
        throw new Error(`API request denied: ${response.data.error_message}`);
      }

      if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
        throw new Error(`API returned status: ${response.data.status}`);
      }

      const places = response.data.results || [];
      const filteredPlaces = places.filter((place) =>
        place.types.some((type) => type in PLACE_TYPE_SCORES)
      );

      allPlaces = [...allPlaces, ...filteredPlaces];
      pageToken = response.data.next_page_token;
    } while (pageToken);

    const scoreDetails = Object.keys(PLACE_TYPE_SCORES).reduce((acc, type) => {
      acc[type] = {
        count: 0,
        score: 0,
      };
      return acc;
    }, {});

    allPlaces.forEach((place) => {
      place.types.forEach((type) => {
        if (type in PLACE_TYPE_SCORES) {
          scoreDetails[type].count += 1;
          scoreDetails[type].score += PLACE_TYPE_SCORES[type];
        }
      });
    });

    const totalScore = Object.values(scoreDetails).reduce((sum, detail) => sum + detail.score, 0);

    return {
      totalScore,
      details: scoreDetails,
      numberOfPlaces: allPlaces.length,
      places: allPlaces.map((place) => ({
        name: place.name,
        types: place.types.filter((type) => type in PLACE_TYPE_SCORES),
        score: place.types.reduce((score, type) => score + (PLACE_TYPE_SCORES[type] || 0), 0),
        address: place.vicinity,
        location: place.geometry.location,
      })),
    };
  } catch (error) {
    console.error('Error fetching places:', error);
    throw error;
  }
}

module.exports = {
  calculateLocationScore,
  PLACE_TYPE_SCORES,
};