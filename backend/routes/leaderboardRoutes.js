// backend/routes/leaderboardRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware'); // Users need to be logged in
const {
    getOverallLeaderboard,
    getWeeklyLeaderboard
} = require('../controllers/leaderboardController');

// @route   GET /api/leaderboards/overall (spaceId is in req.user)
// @desc    Get Overall Leaderboard for the user's current Space
// @access  Private (Authenticated User in Space)
router.get('/overall', protect, getOverallLeaderboard);

// @route   GET /api/leaderboards/weekly (spaceId is in req.user)
// @desc    Get Weekly Leaderboard for the user's current Space
// @access  Private (Authenticated User in Space)
router.get('/weekly', protect, getWeeklyLeaderboard);

module.exports = router;