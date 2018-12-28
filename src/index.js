require('dotenv').config({ path: 'variable.env' });
const createServer = require('./createServer');
const db = require('./db');

const server = createServer();

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

// Use Express middleware to handle cookies (JWT)

// Use Express middleware to populate current user
