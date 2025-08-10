// server/controllers/paymentController.js

if (!process.env.STRIPE_SECRET_KEY) {
  console.error('⚠️  STRIPE_SECRET_KEY is NOT set! Payments will fail.');
}

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2020-08-27',
});
const paypal = require('@paypal/checkout-server-sdk');

function paypalEnvironment() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  return new paypal.core.SandboxEnvironment(clientId, clientSecret);
}
const paypalClient = new paypal.core.PayPalHttpClient(paypalEnvironment());

const Booking = require('../models/Booking');

// server/controllers/paymentController.js
exports.createStripePayment = async (req, res) => {
  console.log('👉 createStripePayment called. body:', req.body);
  console.log('👉 STRIPE_SECRET_KEY loaded?', !!process.env.STRIPE_SECRET_KEY);

  const { amount, currency } = req.body;

  if (typeof amount !== 'number' || !currency) {
    return res.status(400).json({ error: 'Missing amount or currency.' });
  }

  if (amount < 30) {
    return res.status(400).json({ error: 'Stripe requires a minimum payment of £0.30.' });
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({ amount, currency });
    return res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error('❌ Stripe createPaymentIntent error:', error);
    return res
      .status(error.statusCode || 500)
      .json({ error: error.raw?.message || error.message });
  }
};


exports.createPayPalOrder = async (req, res) => {
  const { amount, currency } = req.body;
  const request = new paypal.orders.OrdersCreateRequest();
  request.prefer("return=representation");
  request.requestBody({
    intent: "CAPTURE",
    purchase_units: [{ amount: { currency_code: currency, value: amount.toString() } }]
  });

  try {
    const order = await paypalClient.execute(request);
    return res.json({ orderID: order.result.id });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.capturePayPalOrder = async (req, res) => {
  const { orderID } = req.body;
  const request = new paypal.orders.OrdersCaptureRequest(orderID);
  request.requestBody({});

  try {
    const capture = await paypalClient.execute(request);
    return res.json({ capture: capture.result });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.simulateFakePayment = async (req, res) => {
  try {
    const { bookingId } = req.body;
    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ msg: 'Booking not found' });

    booking.paymentStatus = 'Paid (Fake)';
    booking.paidAt = Date.now();
    booking.paymentInfo = {
      fake: true,
      amount: booking.totalAmount,
    };

    await booking.save();
    return res.json({ booking });
  } catch (err) {
    return res.status(500).json({ msg: 'Server error simulating fake payment' });
  }
};
