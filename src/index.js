const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');

require('dotenv').config({ path: 'variables.env' });

const createServer = require('./createServer');
const db = require('./db');

const server = createServer();

// Use Express middleware to handle cookies (JWT)
server.express.use(cookieParser());

// Decode the JWT to get userId on each request
server.express.use((req, res, next) => {
  const { sickfits_token } = req.cookies;
  if (sickfits_token) {
    const { userId } = jwt.verify(sickfits_token, process.env.APP_SECRET);
    // Put the userId onto the req for future requests to access
    req.userId = userId;
  }
  next();
});

// Use Express middleware to populate current user

server.start(
  {
    cors: {
      credentials: true,
      origin: process.env.FRONTEND_URL
    }
  },
  deets => {
    console.log(`Server is now running on: localhost:${deets.port}`);
  }
);
