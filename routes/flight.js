const express = require('express');
const { createFlight, getAllFlights, getFlightById, searchFlights } = require('../controllers/flight');

const router = express.Router();

// POST /flights
router.post('/', createFlight);

// GET /flights
router.get('/', getAllFlights);

// GET /flights/search (must come before /:id route)
router.get('/search', searchFlights);

// GET /flights/:id (must come after /search route)
router.get('/:id', getFlightById);

module.exports = router;