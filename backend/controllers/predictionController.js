// backend/controllers/predictionController.js
const pool = require('../config/db');

// @desc    User submits or updates their prediction for a match
// @route   POST /api/predictions/:matchId/predict
// @access  Private (Regular User Only, authenticated for the space of the match)
const submitOrUpdatePrediction = async (req, res) => {
    const { spaceId, id: userId } = req.user; // From protect middleware
    const { matchId } = req.params;
    const { predicted_winner } = req.body;

    if (!predicted_winner) {
        return res.status(400).json({ message: 'Predicted winner is required.' });
    }

    try {
        // 1. Verify the match exists in the user's space and is open for predictions
        const [matchRows] = await pool.query(
            'SELECT match_id, prediction_deadline, status, team1_name, team2_name FROM matches WHERE match_id = ? AND space_id = ?',
            [matchId, spaceId]
        );

        if (matchRows.length === 0) {
            return res.status(404).json({ message: 'Match not found in your space.' });
        }
        const match = matchRows[0];

        if (predicted_winner !== match.team1_name && predicted_winner !== match.team2_name) {
            return res.status(400).json({ message: `Invalid prediction. Predicted team must be '${match.team1_name}' or '${match.team2_name}'.` });
        }

        const now = new Date();
        const deadline = new Date(match.prediction_deadline);

        if (now > deadline) {
            if (match.status === 'PredictionOpen' || match.status === 'Upcoming') {
                const [currentMatchStatusRows] = await pool.query('SELECT status FROM matches WHERE match_id = ?', [matchId]);
                if (currentMatchStatusRows.length > 0 && (currentMatchStatusRows[0].status === 'PredictionOpen' || currentMatchStatusRows[0].status === 'Upcoming')) {
                    await pool.query("UPDATE matches SET status = 'PredictionClosed' WHERE match_id = ?", [matchId]);
                    console.log(`Match ${matchId} status updated to PredictionClosed due to deadline passing on prediction attempt.`);
                }
            }
            return res.status(403).json({ message: 'Prediction deadline has passed for this match.' });
        }

        if (match.status !== 'Upcoming' && match.status !== 'PredictionOpen') {
             return res.status(403).json({ message: `Predictions are currently closed for this match (Status: ${match.status}).` });
        }

        const [existingPredictions] = await pool.query(
            'SELECT prediction_id FROM predictions WHERE user_id = ? AND match_id = ? AND space_id = ?',
            [userId, matchId, spaceId]
        );

        let message = '';
        if (existingPredictions.length > 0) {
            const predictionId = existingPredictions[0].prediction_id;
            await pool.query(
                'UPDATE predictions SET predicted_winner = ?, prediction_timestamp = NOW(), points_earned_for_this_match = 0 WHERE prediction_id = ?',
                [predicted_winner, predictionId]
            );
            message = 'Prediction updated successfully.';
        } else {
            await pool.query(
                'INSERT INTO predictions (user_id, match_id, space_id, predicted_winner, prediction_timestamp, points_earned_for_this_match) VALUES (?, ?, ?, ?, NOW(), 0)',
                [userId, matchId, spaceId, predicted_winner]
            );
            message = 'Prediction submitted successfully.';
        }

        res.status(200).json({
            message: message,
            match_id: parseInt(matchId),
            user_id: userId, // Assuming userId from token is already the correct integer ID
            predicted_winner: predicted_winner
        });

    } catch (error) {
        console.error('Error in submitOrUpdatePrediction:', error);
        res.status(500).json({ message: 'Server error submitting prediction.' });
    }
};

// @desc    Get a user's prediction for a specific match
// @route   GET /api/predictions/:matchId/my-prediction
// @access  Private (Regular User Only)
const getMyPredictionForMatch = async (req, res) => {
    const { spaceId, id: userId } = req.user;
    const { matchId } = req.params;

    try {
        const [predictions] = await pool.query(
            'SELECT predicted_winner, DATE_FORMAT(prediction_timestamp, \'%Y-%m-%dT%H:%i:%SZ\') as prediction_timestamp FROM predictions WHERE user_id = ? AND match_id = ? AND space_id = ?',
            [userId, matchId, spaceId]
        );

        if (predictions.length > 0) {
            res.json(predictions[0]);
        } else {
            res.json({ predicted_winner: null, prediction_timestamp: null, message: 'No prediction found for this match.' });
        }
    } catch (error) {
        console.error('Error in getMyPredictionForMatch:', error);
        res.status(500).json({ message: 'Server error fetching your prediction.' });
    }
};

// @desc    Get a summary of predictions for a specific match (who predicted what)
// @route   GET /api/predictions/:matchId/summary
// @access  Private (User authenticated for the space of the match)
const getPredictionSummaryForMatch = async (req, res) => {
    const { spaceId } = req.user; // From protect middleware
    const { matchId } = req.params;

    try {
        // 1. Get match details (team names)
        const [matchRows] = await pool.query(
            'SELECT match_id, team1_name, team2_name FROM matches WHERE match_id = ? AND space_id = ?',
            [matchId, spaceId]
        );

        if (matchRows.length === 0) {
            return res.status(404).json({ message: 'Match not found in your space.' });
        }
        const match = matchRows[0];

        // 2. Get all predictions for this match within the space, joining with users table for username
        const [predictions] = await pool.query(
            `SELECT u.username, p.predicted_winner 
             FROM predictions p
             JOIN users u ON p.user_id = u.user_id
             WHERE p.match_id = ? AND p.space_id = ? AND p.predicted_winner IS NOT NULL`,
            [matchId, spaceId]
        );

        // 3. Get all users in the space to find out who hasn't predicted
        const [allUsersInSpace] = await pool.query(
            'SELECT username FROM users WHERE space_id = ?',
            [spaceId]
        );

        // 4. Organize predictions
        const team1Predictors = [];
        const team2Predictors = [];
        const predictedUsernames = new Set(); // To keep track of who has predicted

        predictions.forEach(pred => {
            predictedUsernames.add(pred.username); // Add username to the set
            if (pred.predicted_winner === match.team1_name) {
                team1Predictors.push(pred.username);
            } else if (pred.predicted_winner === match.team2_name) {
                team2Predictors.push(pred.username);
            }
        });
        
        // 5. Find users who haven't predicted
        const notPredicted = allUsersInSpace
            .filter(user => !predictedUsernames.has(user.username)) // Check if username is NOT in the set
            .map(user => user.username); // Get array of usernames

        res.json({
            match_id: parseInt(matchId),
            team1_name: match.team1_name,
            team1_predictors: team1Predictors,
            team2_name: match.team2_name,
            team2_predictors: team2Predictors,
            not_predicted: notPredicted // Users in the space who have not made a prediction for this match
        });

    } catch (error) {
        console.error(`Error in getPredictionSummaryForMatch for match ${matchId}:`, error);
        res.status(500).json({ message: 'Server error fetching prediction summary.' });
    }
};

module.exports = {
    submitOrUpdatePrediction,
    getMyPredictionForMatch,
    getPredictionSummaryForMatch // Export the new function
};