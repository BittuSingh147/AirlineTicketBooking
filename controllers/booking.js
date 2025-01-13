require("dotenv").config(); // Load environment variables from .env
const Stripe = require("stripe"); // Import stripe package
const stripe = Stripe(process.env.STRIPE_SECRET_KEY); // Initialize stripe with your secret key
const Booking = require("../models/booking");
const Flight = require("../models/flight");
const { createPaymentIntent } = require("../utils/stripe");
const mongoose = require("mongoose");
const User = require('../models/user'); // Add this if not already imported
const { sendEmail } = require('../utils/emailService');

// Create Booking and initiate payment
const createBooking = async (req, res) => {
  try {
    const { flightId, passengers, userId } = req.body;

    // Get flight and user details
    const flight = await Flight.findById(flightId);
    const user = await User.findById(userId);

    if (!flight || !user) {
      return res.status(404).json({ 
        message: !flight ? 'Flight not found' : 'User not found' 
      });
    }

    // Check seat availability
    if (flight.availableSeats < passengers.length) {
      return res.status(400).json({ 
        message: 'Not enough seats available',
        availableSeats: flight.availableSeats,
        requestedSeats: passengers.length
      });
    }

    // Create booking
    const booking = new Booking({
      flight: flightId,
      user: userId,
      passengers,
      totalAmount: flight.price * passengers.length,
      status: 'confirmed'
    });

    await booking.save();

    // Update flight's available seats
    const updatedFlight = await Flight.findOneAndUpdate(
      { 
        _id: flightId,
        availableSeats: { $gte: passengers.length }
      },
      { 
        $inc: { availableSeats: -passengers.length } 
      },
      { 
        new: true,
        runValidators: true
      }
    );

    if (!updatedFlight) {
      await Booking.findByIdAndDelete(booking._id);
      return res.status(400).json({ 
        message: 'Flight no longer has enough seats available',
      });
    }

    // Send confirmation email
    await sendEmail(user.email, 'bookingConfirmation', {
      booking,
      flight: updatedFlight
    });

    return res.status(201).json({
      message: 'Booking created successfully',
      booking,
      remainingSeats: updatedFlight.availableSeats
    });

  } catch (error) {
    console.error('Booking creation error:', error);
    return res.status(500).json({ message: 'Server error during booking creation' });
  }
};

const checkFlightAvailability = async (req, res) => {
  try {
    const { flightId, numberOfSeats = 1 } = req.query;

    const flight = await Flight.findById(flightId);

    if (!flight) {
      return res.status(404).json({ message: "Flight not found" });
    }

    const isAvailable = flight.availableSeats >= numberOfSeats;

    return res.status(200).json({
      available: isAvailable,
      flight: {
        flightNumber: flight.flightNumber,
        departure: flight.departure,
        arrival: flight.arrival,
        departureDate: flight.departureDate,
        availableSeats: flight.availableSeats,
        requestedSeats: numberOfSeats,
        price: flight.price,
        totalPrice: flight.price * numberOfSeats,
      },
    });
  } catch (error) {
    console.error("Availability check error:", error);
    return res
      .status(500)
      .json({ message: "Server error during availability check" });
  }
};

// Confirm Payment and update booking status
const confirmPayment = async (req, res) => {
  const { bookingId, paymentIntentId } = req.body;

  try {
    // Retrieve booking details
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Retrieve the payment intent to check its status
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    // Log the payment intent status for troubleshooting
    console.log("Payment Intent Status:", paymentIntent.status);

    if (paymentIntent.status === "succeeded") {
      // Update booking status to 'confirmed'
      booking.status = "confirmed";
      await booking.save();

      return res.status(200).json({
        message: "Payment successful and booking confirmed",
        booking,
      });
    } else {
      return res
        .status(400)
        .json({
          message: `Payment status is ${paymentIntent.status}. Please try again.`,
        });
    }
  } catch (error) {
    console.error(error); // Log the error
    return res.status(500).json({ message: "Server error" });
  }
};
const manualConfirmPayment = async (req, res) => {
  const { bookingId } = req.body;

  try {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Manually update the booking status to 'confirmed'
    booking.status = "confirmed";
    await booking.save();

    return res.status(200).json({
      message: "Payment manually confirmed and booking confirmed",
      booking,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

const getUserBookings = async (req, res) => {
  try {
    const userId = req.user.id; // Assuming this comes from auth middleware

    const bookings = await Booking.find({ user: userId })
      .populate({
        path: "flight",
        select:
          "flightNumber departure arrival departureDate arrivalDate price",
      })
      .sort({ bookingDate: -1 }); // Most recent bookings first

    return res.status(200).json({
      count: bookings.length,
      bookings: bookings.map((booking) => ({
        id: booking._id,
        flightDetails: {
          flightNumber: booking.flight.flightNumber,
          departure: booking.flight.departure,
          arrival: booking.flight.arrival,
          departureDate: booking.flight.departureDate,
          arrivalDate: booking.flight.arrivalDate,
        },
        passengers: booking.passengers,
        totalAmount: booking.totalAmount,
        status: booking.status,
        bookingDate: booking.bookingDate,
      })),
    });
  } catch (error) {
    console.error("Error fetching user bookings:", error);
    return res.status(500).json({ message: "Error fetching booking history" });
  }
};

// Get details of a specific booking
const getBookingDetails = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user.id;

    const booking = await Booking.findOne({
      _id: bookingId,
      user: userId,
    }).populate({
      path: "flight",
      select: "flightNumber departure arrival departureDate arrivalDate price",
    });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    return res.status(200).json({
      id: booking._id,
      flightDetails: {
        flightNumber: booking.flight.flightNumber,
        departure: booking.flight.departure,
        arrival: booking.flight.arrival,
        departureDate: booking.flight.departureDate,
        arrivalDate: booking.flight.arrivalDate,
      },
      passengers: booking.passengers,
      totalAmount: booking.totalAmount,
      status: booking.status,
      bookingDate: booking.bookingDate,
    });
  } catch (error) {
    console.error("Error fetching booking details:", error);
    return res.status(500).json({ message: "Error fetching booking details" });
  }
};

// Cancel a booking
const cancelBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user.id;

    const booking = await Booking.findOne({
      _id: bookingId,
      user: userId,
      status: { $ne: 'cancelled' }
    }).populate('flight user');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found or already cancelled' });
    }

    // Check if the flight departure date hasn't passed
    const departureDate = new Date(booking.flight.departureDate);
    if (departureDate < new Date()) {
      return res.status(400).json({ message: 'Cannot cancel booking after flight departure' });
    }

    // Update booking status
    booking.status = 'cancelled';
    await booking.save();

    // Update flight seats
    await Flight.findByIdAndUpdate(booking.flight._id, {
      $inc: { availableSeats: booking.passengers.length }
    });

    // Send cancellation email
    await sendEmail(booking.user.email, 'bookingCancellation', {
      booking,
      flight: booking.flight
    });

    return res.status(200).json({
      message: 'Booking cancelled successfully',
      booking: {
        id: booking._id,
        status: booking.status,
        refundAmount: booking.totalAmount
      }
    });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    return res.status(500).json({ message: 'Error cancelling booking' });
  }
};


module.exports = {
  createBooking,
  confirmPayment,
  manualConfirmPayment,
  checkFlightAvailability,
  getUserBookings,
  getBookingDetails,
  cancelBooking,
};
