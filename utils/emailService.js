// utils/emailService.js

const nodemailer = require('nodemailer');

// Create a transporter using environment variables
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Email templates
const emailTemplates = {
  bookingConfirmation: (booking, flight) => ({
    subject: `Booking Confirmation - Flight ${flight.flightNumber}`,
    html: `
      <h1>Booking Confirmation</h1>
      <p>Dear ${booking.passengers[0].name},</p>
      <p>Your flight booking has been confirmed. Here are the details:</p>
      
      <h2>Flight Details:</h2>
      <ul>
        <li>Flight Number: ${flight.flightNumber}</li>
        <li>From: ${flight.departure}</li>
        <li>To: ${flight.arrival}</li>
        <li>Departure: ${new Date(flight.departureDate).toLocaleString()}</li>
        <li>Arrival: ${new Date(flight.arrivalDate).toLocaleString()}</li>
      </ul>

      <h2>Passenger Details:</h2>
      <ul>
        ${booking.passengers.map(passenger => `
          <li>${passenger.name} (Age: ${passenger.age})</li>
        `).join('')}
      </ul>

      <h2>Booking Information:</h2>
      <ul>
        <li>Booking Reference: ${booking._id}</li>
        <li>Total Amount: $${booking.totalAmount}</li>
        <li>Status: ${booking.status}</li>
      </ul>

      <p>Thank you for choosing our airline!</p>
    `
  }),

  bookingCancellation: (booking, flight) => ({
    subject: `Booking Cancellation - Flight ${flight.flightNumber}`,
    html: `
      <h1>Booking Cancellation Confirmation</h1>
      <p>Dear ${booking.passengers[0].name},</p>
      <p>Your flight booking has been cancelled. Here are the details:</p>
      
      <h2>Flight Details:</h2>
      <ul>
        <li>Flight Number: ${flight.flightNumber}</li>
        <li>From: ${flight.departure}</li>
        <li>To: ${flight.arrival}</li>
        <li>Scheduled Departure: ${new Date(flight.departureDate).toLocaleString()}</li>
      </ul>

      <h2>Cancellation Details:</h2>
      <ul>
        <li>Booking Reference: ${booking._id}</li>
        <li>Cancellation Date: ${new Date().toLocaleString()}</li>
        <li>Refund Amount: $${booking.totalAmount}</li>
      </ul>

      <p>The refund will be processed within 5-7 business days.</p>
      <p>We hope to serve you again in the future!</p>
    `
  })
};

// Send email function
const sendEmail = async (to, template, data) => {
  try {
    const { subject, html } = emailTemplates[template](data.booking, data.flight);

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'your-airline@example.com',
      to,
      subject,
      html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

module.exports = {
  sendEmail
};