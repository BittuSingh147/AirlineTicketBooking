const express = require('express');
const { createBooking,checkFlightAvailability , confirmPayment,manualConfirmPayment, getUserBookings,
    getBookingDetails,
    cancelBooking } = require('../controllers/booking');
const authenticateUser = require('../middleware/authenticateUser'); // Middleware to authenticate the user

const router = express.Router();
// Booking history routes (all protected)
router.get('/my-bookings', authenticateUser, getUserBookings);
router.get('/details/:bookingId', authenticateUser, getBookingDetails);
router.post('/cancel/:bookingId', authenticateUser, cancelBooking);
// POST /bookings (protected route) to create a booking and initiate payment
router.get('/check-availability', checkFlightAvailability);
router.post('/', authenticateUser, createBooking);

// POST /bookings/:id/confirm (protected route) to confirm the payment and update the booking status
router.post('/confirm', confirmPayment);

router.post('/manual-confirm', manualConfirmPayment);



module.exports = router;
