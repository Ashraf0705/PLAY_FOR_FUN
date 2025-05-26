// backend/controllers/leaderboardController.js
const pool = require('../config/db');

// @desc    Get Overall Leaderboard for a Space
// @route   GET /api/leaderboards/overall
// @access  Private (User in Space)
const getOverallLeaderboard = async (req, res) => {
    const { spaceId } = req.user; // From protect middleware

    if (!spaceId) {
        return res.status(400).json({ message: 'Space context not found for user.' });
    }

    try {
        const [leaderboard] = await pool.query(
            `SELECT u.user_id, u.username, u.overall_total_points
             FROM users u
             WHERE u.space_id = ?
             ORDER BY u.overall_total_points DESC, u.username ASC`,
            [spaceId]
        );
        res.json(leaderboard);
    } catch (error) {
        console.error('Error in getOverallLeaderboard:', error);
        res.status(500).json({ message: 'Server error fetching overall leaderboard' });
    }
};

// @desc    Get Weekly Leaderboard for a Space
// @route   GET /api/leaderboards/weekly
// @access  Private (User in Space)
const getWeeklyLeaderboard = async (req, res) => {
    const { spaceId } = req.user;

    if (!spaceId) {
        return res.status(400).json({ message: 'Space context not found for user.' });
    }

    try {
        const now = new Date();
        const dayOfWeek = now.getDay(); // Sunday = 0, ..., Wednesday = 3, ...

        const startOfWeek = new Date(now);
        const diffToWednesday = (dayOfWeek < 3) ? (dayOfWeek + 4) : (dayOfWeek - 3);
        startOfWeek.setDate(now.getDate() - diffToWednesday);
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        const sqlStartOfWeek = startOfWeek.toISOString().slice(0, 19).replace('T', ' ');
        const sqlEndOfWeek = endOfWeek.toISOString().slice(0, 19).replace('T', ' ');

        console.log(`Weekly Leaderboard Query for Space ${spaceId}: From ${sqlStartOfWeek} To ${sqlEndOfWeek}`);

        // This query fetches users who have scorable predictions in matches resulted this week
        const [weeklyScoresData] = await pool.query(
            `SELECT
                u.user_id,
                u.username, /* Including username here for direct use if no merge was needed */
                COALESCE(SUM(p.points_earned_for_this_match), 0) AS weekly_points
             FROM users u
             JOIN predictions p ON u.user_id = p.user_id 
             JOIN matches m ON p.match_id = m.match_id
             WHERE u.space_id = ?                           /* User must be in the target space */
               AND p.space_id = ?                           /* Prediction must be for the target space */
               AND m.space_id = ?                           /* Match must be for the target space */
               AND m.result_entered_at >= ?                 /* Match resulted within the week */
               AND m.result_entered_at <= ?
               AND (m.status = 'ResultAvailable' OR m.status = 'MatchDrawn') /* Match must have a final status */
             GROUP BY u.user_id, u.username
             /* Order here is just for the intermediate result, final sort after merge */
             ORDER BY weekly_points DESC, u.username ASC`,
            [spaceId, spaceId, spaceId, sqlStartOfWeek, sqlEndOfWeek] // Added spaceId for p and m tables for clarity/correctness
        );

        // Fetch all users in the space to ensure everyone is on the leaderboard
        const [allUsersInSpace] = await pool.query(
            'SELECT user_id, username FROM users WHERE space_id = ? ORDER BY username ASC', // Order for consistent initial list
            [spaceId]
        );

        // Merge scores with all users, defaulting to 0 for those with no scores this week
        const leaderboard = allUsersInSpace.map(user => {
            const scoredUserData = weeklyScoresData.find(su => su.user_id === user.user_id);
            return {
                user_id: user.user_id,
                username: user.username,
                weekly_points: scoredUserData ? parseInt(scoredUserData.weekly_points, 10) : 0 // Ensure parsing
            };
        }).sort((a, b) => { // Final sort
            if (b.weekly_points === a.weekly_points) {
                return a.username.localeCompare(b.username);
            }
            return b.weekly_points - a.weekly_points;
        });

        res.json(leaderboard);

    } catch (error) {
        console.error('Error in getWeeklyLeaderboard:', error);
        res.status(500).json({ message: 'Server error fetching weekly leaderboard' });
    }
};

module.exports = {
    getOverallLeaderboard,
    getWeeklyLeaderboard
};