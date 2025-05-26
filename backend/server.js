// backend/server.js
const dotenv = require('dotenv');
dotenv.config(); // Load environment variables at the very top

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const dbPool = require('./config/db'); // Initializes DB connection check

// Import Routers
const spaceRoutes = require('./routes/spaceRoutes');
const matchRoutes = require('./routes/matchRoutes');
const predictionRoutes = require('./routes/predictionRoutes');
const leaderboardRoutes = require('./routes/leaderboardRoutes');
const adminRoutes = require('./routes/adminRoutes'); // IMPORTED

const app = express();

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000', // Use env variable for frontend URL
    credentials: true
}));
app.use(express.json()); // To parse JSON request bodies
app.use(cookieParser()); // To parse cookies

// Basic Route for API Testing
app.get('/', (req, res) => {
    res.send('PlayForFun API is Alive and Kicking!');
});

// API Routes
app.use('/api/spaces', spaceRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/predictions', predictionRoutes);
app.use('/api/leaderboards', leaderboardRoutes);
app.use('/api/admin', adminRoutes); // USED ADMIN ROUTES

// Define Port
const PORT = process.env.PORT || 5001;

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    // The database connection test in db.js also runs when this file is executed.
});