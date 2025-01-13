const Flight = require('../models/flight');

// Create Flight
const createFlight = async (req, res) => {
  const { flightNumber, departure, arrival, departureDate, arrivalDate, price, availableSeats } = req.body;

  try {
    const flight = new Flight({
      flightNumber,
      departure,
      arrival,
      departureDate,
      arrivalDate,
      price,
      availableSeats,
    });

    await flight.save();
    return res.status(201).json({ message: 'Flight created successfully', flight });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Get All Flights
const getAllFlights = async (req, res) => {
  try {
    const flights = await Flight.find();
    return res.status(200).json(flights);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Get Flight by ID
const getFlightById = async (req, res) => {
  const { id } = req.params;

  try {
    const flight = await Flight.findById(id);
    if (!flight) {
      return res.status(404).json({ message: 'Flight not found' });
    }
    return res.status(200).json(flight);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};

const searchFlights = async (req, res) => {
  const { origin, destination, date } = req.query;

  try {
    // Validate the inputs
    if (!origin || !destination || !date) {
      return res.status(400).json({ message: 'Origin, destination, and date are required' });
    }

    // Convert date to a valid format for comparison
    const searchDate = new Date(date);

    // Search for flights by origin, destination, and date
    const flights = await Flight.find({
      departure: origin,
      arrival: destination,
      departureDate: { $gte: searchDate }, // Ensure the flight date is the same or after the requested date
    });

    if (flights.length === 0) {
      return res.status(404).json({ message: 'No flights found' });
    }

    return res.status(200).json({ flights });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};





module.exports = { createFlight, getAllFlights, getFlightById,searchFlights };
