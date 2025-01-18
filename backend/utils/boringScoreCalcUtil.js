// locationBoringness/utils/boringScoreCalcUtil.js
const axios = require('axios');


// Google Places API key (ensure this is in your .env file, e.g., GOOGLE_API_KEY)
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

async function calculateBoringnessScore(latitude, longitude) {
  // Set the Google Places API URL
  const placesApiUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=10000&type=point_of_interest&key=${GOOGLE_API_KEY}`;

  try {
    const response = await axios.get(placesApiUrl);
    const landmarks = response.data.results;

    console.log('API response data (array of all landmarks) **NOT WORKING:', landmarks); //logs response data

    // Assign boringness score
    let boringnessScore = 0;

    landmarks.forEach(landmark => {
      const interestingnessScore = assignInterestingnessScore(landmark);
      console.log('Interestingness score for current landmark:', interestingnessScore); //logs interestingness score
      boringnessScore += interestingnessScore;
    });

    console.log('Boringness score calculated:', boringnessScore); //logs boringness score

    // Calculate final boringness score (1 / sum of interestingness)
    const finalBoringnessScore = 1 / boringnessScore;
    return finalBoringnessScore;
  } catch (error) {
    console.error('Error fetching data from Google Places API:', error);
    throw new Error('Error fetching landmarks or calculating boringness score.');
  }
}

// A simple function that assigns an "interestingness" score to a landmark based on its type
function assignInterestingnessScore(landmark) {
  const interestingnessMap = {
    restaurant: 2,
    park: 3,
    museum: 4,
    theater: 5,
    // Add more types with scores as needed
  };

  const type = landmark.types && landmark.types[0];
  return interestingnessMap[type] || 1; // Default to score 1 if the type is not found
}

module.exports = { calculateBoringnessScore };
