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
const adminRoutes = require('./routes/adminRoutes');

const app = express();

// Middleware
app.use(cors({
    origin: [
        process.env.FRONTEND_URL || 'http://localhost:3000', // For local dev
        // Add your Vercel frontend deployment URL here later, e.g., https://playforfun-frontend.vercel.app
        // Or use a more flexible regex if you have multiple preview URLs
    ],
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Basic Route for API Testing
app.get('/', (req, res) => {
    res.send('PlayForFun API is Alive and Kicking on Vercel (hopefully!)'); // Updated message
});

// API Routes - All API routes should ideally be under a common prefix like /api
// This is already handled by how we use them: app.use('/api/spaces', ...)
app.use('/api/spaces', spaceRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/predictions', predictionRoutes);
app.use('/api/leaderboards', leaderboardRoutes);
app.use('/api/admin', adminRoutes);

// Define Port for local development
const PORT = process.env.PORT || 5001;

// Start the server only when run directly (for local development)
// Vercel will use the exported `app`
if (process.env.NODE_ENV !== 'test' && require.main === module) { // Check if run directly
    app.listen(PORT, () => {
        console.log(`Server running locally on http://localhost:${PORT}`);
        // The database connection test in db.js also runs.
    });
}

module.exports = app; // <<<< EXPORT THE EXPRESS APP FOR VERCEL