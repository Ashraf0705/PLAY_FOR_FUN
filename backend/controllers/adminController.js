// backend/controllers/adminController.js
const pool = require('../config/db');

// @desc    Admin manually sets a user's overall total points
// @route   PUT /api/admin/spaces/:spaceIdFromToken/users/:userIdToEdit/score
// @access  Private (Admin Only for their Space)
const setOverallUserScore = async (req, res) => {
    // spaceId is from the admin's authenticated token (req.user.spaceId)
    // userIdToEdit is the ID of the user whose score is being changed (from URL params)
    // newScore is from the request body
    const { spaceId: adminSpaceId } = req.user;
    const { userIdToEdit } = req.params;
    const { newScore } = req.body;

    if (newScore === undefined || newScore === null || isNaN(parseInt(newScore))) {
        return res.status(400).json({ message: 'A valid new score (numeric) is required.' });
    }

    const parsedScore = parseInt(newScore, 10);

    try {
        // Verify the user to be edited belongs to the admin's space
        const [userRows] = await pool.query(
            'SELECT user_id FROM users WHERE user_id = ? AND space_id = ?',
            [userIdToEdit, adminSpaceId]
        );

        if (userRows.length === 0) {
            return res.status(404).json({ message: 'User not found in this space or admin unauthorized for this user.' });
        }

        // Update the user's score
        const [result] = await pool.query(
            'UPDATE users SET overall_total_points = ? WHERE user_id = ? AND space_id = ?',
            [parsedScore, userIdToEdit, adminSpaceId]
        );

        if (result.affectedRows > 0) {
            res.json({ message: `User ID ${userIdToEdit}'s score updated to ${parsedScore} successfully.` });
        } else {
            // This might happen if the user_id was valid but something went wrong during update,
            // or if the score was already the same (though affectedRows should still be 1 if matched).
            res.status(400).json({ message: 'Score not updated. User may not exist or score was already set to this value.' });
        }

    } catch (error) {
        console.error('Error in setOverallUserScore:', error);
        res.status(500).json({ message: 'Server error updating user score.' });
    }
};

module.exports = {
    setOverallUserScore
};