// const stripe = require('stripe');
// const config = stripe(process.env.STRIPE_SECRET);
// module.exports = config;

// // OR 1 line:
module.exports = require('stripe')(process.env.STRIPE_SECRET);
