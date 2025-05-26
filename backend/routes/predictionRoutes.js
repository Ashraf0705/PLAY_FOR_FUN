// backend/routes/predictionRoutes.js
const express = require('express');
const router = express.Router();
// Ensure userOnly is imported if you intend to keep predictions user-only
const { protect, userOnly } = require('../middleware/authMiddleware');
const {
    submitOrUpdatePrediction,
    getMyPredictionForMatch,
    getPredictionSummaryForMatch // IMPORTED
} = require('../controllers/predictionController');

// @route   POST /api/predictions/:matchId/predict
// @desc    User submits or updates their prediction for a specific match
// @access  Private (Regular User Only)
router.post('/:matchId/predict', protect, userOnly, submitOrUpdatePrediction);

// @route   GET /api/predictions/:matchId/my-prediction
// @desc    Get the current user's prediction for a specific match
// @access  Private (Regular User Only)
router.get('/:matchId/my-prediction', protect, userOnly, getMyPredictionForMatch);

// @route   GET /api/predictions/:matchId/summary
// @desc    Get a summary of predictions for a specific match (who predicted what)
// @access  Private (Any authenticated user in the space - user or admin can view)
router.get('/:matchId/summary', protect, getPredictionSummaryForMatch); // ADDED

module.exports = router;