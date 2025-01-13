require('dotenv').config(); // Ensure dotenv is loaded
const Stripe = require('stripe'); // Import the stripe package
const stripe = Stripe(process.env.STRIPE_SECRET_KEY); // Initialize stripe with your secret key

// Create payment intent
const createPaymentIntent = async (amount, currency = 'usd') => {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // Stripe accepts amount in cents
      currency: currency,
    });

    // Return both client_secret and id
    return { clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id };
  } catch (error) {
    console.error('Payment creation failed:', error); // Log errors
    throw new Error('Payment creation failed');
  }
};

module.exports = { createPaymentIntent };
