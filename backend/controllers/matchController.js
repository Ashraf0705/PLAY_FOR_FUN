// backend/controllers/matchController.js
const pool = require('../config/db');

// --- Automated Point Calculation Logic (Corrected and Final for V1) ---
const calculateAndApplyPoints = async (matchId, spaceId, resultType, winningTeamName) => {
    const logPrefix = `[calcPoints MatchID:${matchId} SpaceID:${spaceId}]`;
    console.log(`${logPrefix} START - ResultType: ${resultType}, Winner: ${winningTeamName || 'N/A'}`);
    let connection; 
    try {
        connection = await pool.getConnection();
        console.log(`${logPrefix} [ConnID:${connection.threadId}] DB Connection Obtained.`);
        await connection.beginTransaction();
        console.log(`${logPrefix} [ConnID:${connection.threadId}] Transaction Started.`);

        const [users] = await connection.query('SELECT user_id FROM users WHERE space_id = ?', [spaceId]);
        console.log(`${logPrefix} [ConnID:${connection.threadId}] Fetched ${users.length} users.`);

        if (users.length === 0) {
            console.log(`${logPrefix} [ConnID:${connection.threadId}] No users in space. Committing empty transaction.`);
            await connection.commit();
            return; 
        }

        for (const user of users) {
            const userId = user.user_id;
            console.log(`${logPrefix} [ConnID:${connection.threadId}] Processing UserID: ${userId}`);
            let pointsEarnedForThisMatch = 0;
            let predictedWinnerFromDb = null; // What the user actually predicted (could be NULL)
            
            try { // Added try-catch for individual user processing within transaction
                const [existingPredictions] = await connection.query(
                    'SELECT prediction_id, predicted_winner FROM predictions WHERE user_id = ? AND match_id = ? AND space_id = ?',
                    [userId, matchId, spaceId]
                );
                
                if (existingPredictions.length > 0) {
                    predictedWinnerFromDb = existingPredictions[0].predicted_winner;
                    console.log(`${logPrefix} [ConnID:${connection.threadId}] UserID ${userId}: Existing UI Prediction Found - Predicted: ${predictedWinnerFromDb}`);
                } else {
                    console.log(`${logPrefix} [ConnID:${connection.threadId}] UserID ${userId}: No prior UI prediction record found for this match.`);
                }

                if (resultType === 'Draw') {
                    pointsEarnedForThisMatch = 0;
                } else if (resultType === 'Winner') {
                    if (predictedWinnerFromDb === null) pointsEarnedForThisMatch = -1; 
                    else if (predictedWinnerFromDb === winningTeamName) pointsEarnedForThisMatch = 2; 
                    else pointsEarnedForThisMatch = -1; 
                }
                console.log(`${logPrefix} [ConnID:${connection.threadId}] UserID ${userId}: Points for this match: ${pointsEarnedForThisMatch}.`);

                console.log(`${logPrefix} [ConnID:${connection.threadId}] UserID ${userId}: Updating overall_total_points by ${pointsEarnedForThisMatch}...`);
                await connection.query(
                    'UPDATE users SET overall_total_points = overall_total_points + ? WHERE user_id = ? AND space_id = ?',
                    [pointsEarnedForThisMatch, userId, spaceId]
                );
                console.log(`${logPrefix} [ConnID:${connection.threadId}] UserID ${userId}: overall_total_points updated.`);

                // Handle prediction record for points storage
                if (existingPredictions.length > 0) {
                    // User had an existing prediction record (made via UI), update its points_earned
                    console.log(`${logPrefix} [ConnID:${connection.threadId}] UserID ${userId}: Updating points for existing prediction record (ID: ${existingPredictions[0].prediction_id})...`);
                    await connection.query(
                        'UPDATE predictions SET points_earned_for_this_match = ? WHERE prediction_id = ?',
                        [pointsEarnedForThisMatch, existingPredictions[0].prediction_id]
                    );
                    console.log(`${logPrefix} [ConnID:${connection.threadId}] UserID ${userId}: Existing prediction record points updated.`);
                } else {
                    // User had NO prediction record made via UI. Insert a new one to log their points for this match.
                    // Check if a "no prediction" record for this user/match already exists (e.g. from a previous clear_result)
                    const [noPredCheck] = await connection.query(
                        'SELECT prediction_id FROM predictions WHERE user_id = ? AND match_id = ? AND space_id = ? AND predicted_winner IS NULL',
                        [userId, matchId, spaceId]
                    );
                    if (noPredCheck.length > 0) {
                        console.log(`${logPrefix} [ConnID:${connection.threadId}] UserID ${userId}: Found existing 'no prediction' record (ID: ${noPredCheck[0].prediction_id}). Updating points...`);
                         await connection.query(
                            'UPDATE predictions SET points_earned_for_this_match = ?, prediction_timestamp = NOW() WHERE prediction_id = ?',
                            [pointsEarnedForThisMatch, noPredCheck[0].prediction_id]
                        );
                    } else {
                        console.log(`${logPrefix} [ConnID:${connection.threadId}] UserID ${userId}: Inserting new 'no prediction' record with points...`);
                        await connection.query(
                            `INSERT INTO predictions (user_id, match_id, space_id, predicted_winner, points_earned_for_this_match, prediction_timestamp) 
                             VALUES (?, ?, ?, NULL, ?, NOW())`, // Use MySQL NOW() directly
                            [userId, matchId, spaceId, pointsEarnedForThisMatch]
                        );
                    }
                    console.log(`${logPrefix} [ConnID:${connection.threadId}] UserID ${userId}: 'No prediction' record points processed.`);
                }
            } catch (loopError) {
                console.error(`${logPrefix} [ConnID:${connection.threadId}] ERROR INSIDE USER LOOP for UserID ${userId}:`, loopError);
                throw loopError; // This will trigger the main catch block and rollback
            }
        } // End of for...of users loop

        await connection.commit();
        console.log(`${logPrefix} [ConnID:${connection.threadId}] Transaction COMMITTED successfully.`);

    } catch (error) {
        if (connection) {
            console.error(`${logPrefix} [ConnID:${connection.threadId}] Main CATCH BLOCK, attempting to ROLLBACK...`);
            try { await connection.rollback(); console.error(`${logPrefix} [ConnID:${connection.threadId}] Transaction ROLLED BACK.`); }
            catch (rollbackError) { console.error(`${logPrefix} [ConnID:${connection.threadId}] FAILED TO ROLLBACK:`, rollbackError); }
        } else { console.error(`${logPrefix} Main CATCH BLOCK, no DB connection was established for rollback.`); }
        console.error(`${logPrefix} Full error details from main catch:`, error);
        throw error; // Re-throw to be caught by enterMatchResult's catch block
    } finally {
        if (connection) {
            connection.release();
            console.log(`${logPrefix} [ConnID:${connection.threadId}] DB Connection RELEASED.`);
        }
    }
};

// @desc    Add a new match to a Space
const addMatch = async (req, res) => {
    console.log('[addMatch] START - Request body:', req.body);
    const { spaceId } = req.user;
    const { match_date, match_time, team1_name, team2_name, prediction_deadline_date, prediction_deadline_time, ipl_week_number, ipl_match_number } = req.body;

    if (!match_date || !match_time || !team1_name || !team2_name || !prediction_deadline_date || !prediction_deadline_time) {
        console.log('[addMatch] Validation failed: Missing required fields.');
        return res.status(400).json({ message: 'Match details, prediction deadline date, and time are required.' });
    }
    try {
        const safeMatchTime = match_time.length === 5 ? `${match_time}:00` : match_time;
        const safePredictionDeadlineTime = prediction_deadline_time.length === 5 ? `${prediction_deadline_time}:00` : prediction_deadline_time;
        const fullMatchDateTimeStr = `${match_date} ${safeMatchTime}`;
        const fullPredictionDeadlineStr = `${prediction_deadline_date} ${safePredictionDeadlineTime}`;
        console.log("[addMatch] Storing match_datetime string for DB:", fullMatchDateTimeStr);
        console.log("[addMatch] Storing prediction_deadline string for DB:", fullPredictionDeadlineStr);
        const matchDateTime = new Date(fullMatchDateTimeStr);
        const deadlineDateTime = new Date(fullPredictionDeadlineStr);
        if (isNaN(matchDateTime.getTime()) || isNaN(deadlineDateTime.getTime())) {
            console.log('[addMatch] Validation failed: Invalid date/time format.');
            return res.status(400).json({ message: 'Invalid date or time format provided for match or deadline.' });
        }
        if (deadlineDateTime >= matchDateTime) {
            console.log('[addMatch] Validation failed: Deadline not before match time.');
            return res.status(400).json({ message: 'Prediction deadline must be before the match start time.' });
        }
        
        const [result] = await pool.query(
            'INSERT INTO matches (space_id, match_date, match_time, prediction_deadline, team1_name, team2_name, status, ipl_week_number, ipl_match_number) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [spaceId, match_date, safeMatchTime, fullPredictionDeadlineStr, team1_name, team2_name, 'Upcoming', ipl_week_number || null, ipl_match_number || null]
        );
        console.log('[addMatch] Insert query executed.');
        if (result.insertId) {
            const [newMatchRows] = await pool.query( `SELECT * FROM matches WHERE match_id = ?`, [result.insertId]);
            console.log('[addMatch] New match fetched successfully.');
            res.status(201).json({ message: 'Match added successfully', match: newMatchRows[0] });
        } else {
            console.log('[addMatch] Insert failed, no insertId.');
            res.status(500).json({ message: 'Failed to add match' });
        }
    } catch (error) {
        console.error('[addMatch] CATCH BLOCK ERROR:', error);
        res.status(500).json({ message: 'Server error adding match. Check date/time formats.' });
    }
};

// @desc    Get all matches for a specific Space (Admin view)
const getAllMatchesForSpaceAdmin = async (req, res) => {
    console.log('[getAllMatchesForSpaceAdmin] START - User:', req.user);
    const { spaceId } = req.user;
    if (!spaceId) { console.log('[getAllMatchesForSpaceAdmin] Error: No spaceId in req.user.'); return res.status(400).json({ message: 'Space context not found for admin.' }); }
    console.log(`[getAllMatchesForSpaceAdmin] Attempting to fetch matches for spaceId: ${spaceId}`);
    try {
        const query = `SELECT *, DATE_FORMAT(match_date, '%Y-%m-%d') as match_date, prediction_deadline, DATE_FORMAT(result_entered_at, '%Y-%m-%dT%H:%i:%SZ') as result_entered_at FROM matches WHERE space_id = ? ORDER BY match_date ASC, match_time ASC`;
        const [matches] = await pool.query(query, [spaceId]);
        console.log(`[getAllMatchesForSpaceAdmin] Query successful, fetched ${matches.length} matches.`);
        res.json(matches);
        console.log('[getAllMatchesForSpaceAdmin] Response sent successfully.');
    } catch (error) { 
        console.error('[getAllMatchesForSpaceAdmin] CATCH BLOCK ERROR:', error); 
        if (!res.headersSent) res.status(500).json({ message: 'Server error fetching matches for admin' });
    }
};

// @desc    Get all matches for the current user's authenticated Space (User view)
const getMatchesForSpaceUser = async (req, res) => {
    console.log('[getMatchesForSpaceUser] START - User:', req.user);
    const { spaceId } = req.user;
    if (!spaceId) { console.log('[getMatchesForSpaceUser] Error: No spaceId in req.user.'); return res.status(400).json({ message: 'Space context not found for user.' }); }
    console.log(`[getMatchesForSpaceUser] Attempting to fetch matches for spaceId: ${spaceId}`);
    try {
        const query = `SELECT *, DATE_FORMAT(match_date, '%Y-%m-%d') as match_date, prediction_deadline, DATE_FORMAT(result_entered_at, '%Y-%m-%dT%H:%i:%SZ') as result_entered_at FROM matches WHERE space_id = ? ORDER BY match_date ASC, match_time ASC`;
        const [matches] = await pool.query(query, [spaceId]);
        console.log(`[getMatchesForSpaceUser] Query successful, fetched ${matches.length} matches.`);
        if (matches.length > 0) console.log('[getMatchesForSpaceUser] First match data from DB:', matches[0]);
        res.json(matches);
        console.log('[getMatchesForSpaceUser] Response sent successfully.');
    } catch (error) {
        console.error('[getMatchesForSpaceUser] CATCH BLOCK ERROR:', error);
        if (!res.headersSent) res.status(500).json({ message: 'Server error fetching matches for user.' });
    }
};

// @desc    Get details for a single match by its ID
const getMatchById = async (req, res) => {
    console.log('[getMatchById] START - User:', req.user, 'Params:', req.params);
    const { spaceId } = req.user;
    const { matchId } = req.params;
    if (!spaceId) { console.log('[getMatchById] Error: No spaceId in req.user.'); return res.status(400).json({ message: 'Space context not found.' });}
    if (!matchId) { console.log('[getMatchById] Error: No matchId in params.'); return res.status(400).json({ message: 'Match ID is required.' });}
    console.log(`[getMatchById] Attempting to fetch matchId: ${matchId} for spaceId: ${spaceId}`);
    try {
        const query = `SELECT *, DATE_FORMAT(match_date, '%Y-%m-%d') as match_date, prediction_deadline, DATE_FORMAT(result_entered_at, '%Y-%m-%dT%H:%i:%SZ') as result_entered_at FROM matches WHERE match_id = ? AND space_id = ?`;
        const [matchRows] = await pool.query(query, [matchId, spaceId]);
        if (matchRows.length === 0) { console.log('[getMatchById] Match not found.'); return res.status(404).json({ message: 'Match not found in your space or unauthorized.' });}
        console.log('[getMatchById] Match found:', matchRows[0]);
        res.json(matchRows[0]);
        console.log('[getMatchById] Response sent successfully.');
    } catch (error) { 
        console.error(`[getMatchById] CATCH BLOCK ERROR for match ${matchId}:`, error); 
        if (!res.headersSent) res.status(500).json({ message: 'Server error fetching match details.' });
    }
};

// @desc    Update an existing match in a Space
const updateMatch = async (req, res) => {
    console.log('[updateMatch] START - User:', req.user, 'Params:', req.params, 'Body:', req.body);
    const { spaceId } = req.user;
    const { matchId } = req.params;
    const { match_date, match_time, team1_name, team2_name, status, prediction_deadline_date, prediction_deadline_time, ipl_week_number, ipl_match_number } = req.body;

    const hasUpdateData = [match_date, match_time, team1_name, team2_name, status, prediction_deadline_date, prediction_deadline_time, ipl_week_number, ipl_match_number].some(val => val !== undefined);
    if (!hasUpdateData) {
        return res.status(400).json({ message: 'No update data provided' });
    }
    try {
        const [existingMatches] = await pool.query("SELECT * FROM matches WHERE match_id = ? AND space_id = ?", [matchId, spaceId]);
        if (existingMatches.length === 0) return res.status(404).json({ message: 'Match not found or unauthorized' });
        const existingMatch = existingMatches[0]; 

        const fieldsToUpdate = {};
        const newMatchDate = match_date || existingMatch.match_date.split(' ')[0]; 
        const newMatchTime = match_time ? (match_time.length === 5 ? `${match_time}:00` : match_time) : existingMatch.match_time;
        
        if (match_date && match_date !== existingMatch.match_date.split(' ')[0]) fieldsToUpdate.match_date = newMatchDate;
        if (match_time && newMatchTime !== existingMatch.match_time) fieldsToUpdate.match_time = newMatchTime;
        
        let newFullPredictionDeadlineStr;
        let deadlineChanged = false;
        if (prediction_deadline_date && prediction_deadline_time) {
            const safePredDeadlineTime = prediction_deadline_time.length === 5 ? `${prediction_deadline_time}:00` : prediction_deadline_time;
            newFullPredictionDeadlineStr = `${prediction_deadline_date} ${safePredDeadlineTime}`;
            if (newFullPredictionDeadlineStr !== existingMatch.prediction_deadline) deadlineChanged = true;
        } else {
            newFullPredictionDeadlineStr = existingMatch.prediction_deadline;
        }

        if (match_date || match_time || deadlineChanged) { // Validate if match time changed OR explicit deadline changed
            const finalMatchDateTime = new Date(`${newMatchDate} ${newMatchTime}`);
            const finalDeadlineDateTime = new Date(newFullPredictionDeadlineStr);
            if (isNaN(finalMatchDateTime.getTime()) || isNaN(finalDeadlineDateTime.getTime())) return res.status(400).json({ message: 'Invalid date or time format for update.' });
            if (finalDeadlineDateTime >= finalMatchDateTime) return res.status(400).json({ message: 'Prediction deadline must be before the match start time for update.' });
            if (deadlineChanged || match_date || match_time) fieldsToUpdate.prediction_deadline = newFullPredictionDeadlineStr;
        }

        if (team1_name && team1_name !== existingMatch.team1_name) fieldsToUpdate.team1_name = team1_name;
        if (team2_name && team2_name !== existingMatch.team2_name) fieldsToUpdate.team2_name = team2_name;
        if (status && status !== existingMatch.status) fieldsToUpdate.status = status;
        
        // Handle ipl_week_number and ipl_match_number, allowing them to be set to null
        if (ipl_week_number !== undefined) {
            const val = ipl_week_number === '' || ipl_week_number === null ? null : parseInt(ipl_week_number, 10);
            if (val !== existingMatch.ipl_week_number) fieldsToUpdate.ipl_week_number = val;
        }
        if (ipl_match_number !== undefined) {
            const val = ipl_match_number === '' || ipl_match_number === null ? null : parseInt(ipl_match_number, 10);
            if (val !== existingMatch.ipl_match_number) fieldsToUpdate.ipl_match_number = val;
        }
        
        if (Object.keys(fieldsToUpdate).length === 0) {
             return res.status(200).json({ message: 'No effective changes detected to update.', match: existingMatch });
        }
        console.log("[updateMatch] Fields to update:", fieldsToUpdate);

        const [result] = await pool.query('UPDATE matches SET ? WHERE match_id = ? AND space_id = ?', [fieldsToUpdate, matchId, spaceId]);
        if (result.affectedRows > 0) {
            const [updatedMatchRows] = await pool.query(`SELECT * FROM matches WHERE match_id = ?`, [matchId]);
            res.json({ message: 'Match updated successfully', match: updatedMatchRows[0] });
        } else {
             res.status(200).json({ message: 'No database rows affected by update (data might be same as existing).', match: existingMatch });
        }
    } catch (error) { 
        console.error('[updateMatch] CATCH BLOCK ERROR:', error); 
        if (!res.headersSent) res.status(500).json({ message: 'Server error updating match. Check date/time formats.' });
    }
};

// @desc    Delete a match from a Space
const deleteMatch = async (req, res) => {
    console.log('[deleteMatch] START - User:', req.user, 'Params:', req.params);
    const { spaceId } = req.user;
    const { matchId } = req.params;
    try {
        const [existingMatches] = await pool.query('SELECT match_id FROM matches WHERE match_id = ? AND space_id = ?', [matchId, spaceId]);
        if (existingMatches.length === 0) return res.status(404).json({ message: 'Match not found or unauthorized' });
        const [result] = await pool.query('DELETE FROM matches WHERE match_id = ? AND space_id = ?', [matchId, spaceId]);
        if (result.affectedRows > 0) res.json({ message: 'Match deleted successfully' });
        else res.status(404).json({ message: 'Match not found or already deleted' });
    } catch (error) {
        console.error('[deleteMatch] CATCH BLOCK ERROR:', error);
        if (!res.headersSent) res.status(500).json({ message: 'Server error deleting match' });
    }
};

// @desc    Admin enters result for a match and triggers point calculation
const enterMatchResult = async (req, res) => {
    const matchIdParam = req.params.matchId;
    const logPrefix = `[enterResult MatchID:${matchIdParam}]`;
    console.log(`${logPrefix} REQ RECEIVED - SpaceID from token: ${req.user?.spaceId} - Request body:`, req.body);
    const { spaceId } = req.user;
    const matchId = parseInt(matchIdParam, 10);
    const { result_type, winning_team } = req.body;

    if (isNaN(matchId) || isNaN(parseInt(spaceId,10))) { // Ensure spaceId from token is also valid if it's a string like 'admin_X'
        console.log(`${logPrefix} Validation failed: Invalid matchId or spaceId.`);
        return res.status(400).json({ message: 'Invalid match or space identifier.' });
    }
    if (!result_type || (result_type === 'Winner' && !winning_team)) {
        console.log(`${logPrefix} Validation failed: Missing result_type or winning_team for Winner.`);
        return res.status(400).json({ message: 'Result type is required. If "Winner", winning team is also required.' });
    }
    if (result_type !== 'Winner' && result_type !== 'Draw') {
        console.log(`${logPrefix} Validation failed: Invalid result_type.`);
        return res.status(400).json({ message: "Invalid result_type. Must be 'Winner' or 'Draw'." });
    }
    console.log(`${logPrefix} Initial validations passed.`);
    try {
        console.log(`${logPrefix} Fetching match details...`);
        const [matches] = await pool.query('SELECT status, team1_name, team2_name FROM matches WHERE match_id = ? AND space_id = ?', [matchId, spaceId]);
        if (matches.length === 0) { console.log(`${logPrefix} Match not found or unauthorized.`); return res.status(404).json({ message: 'Match not found in this space or unauthorized.' });}
        const match = matches[0];
        console.log(`${logPrefix} Match found, status: ${match.status}`);
        if (match.status === 'ResultAvailable' || match.status === 'MatchDrawn') { console.log(`${logPrefix} Result already entered.`); return res.status(400).json({ message: 'Result has already been entered for this match.' });}
        let validWinningTeam = null;
        if (result_type === 'Winner') {
            if (winning_team !== match.team1_name && winning_team !== match.team2_name) { console.log(`${logPrefix} Winning team invalid.`); return res.status(400).json({ message: 'Winning team must be one of the playing teams.' });}
            validWinningTeam = winning_team;
        }
        console.log(`${logPrefix} Winning team validation passed.`);
        const newStatus = result_type === 'Draw' ? 'MatchDrawn' : 'ResultAvailable';
        console.log(`${logPrefix} Attempting to update match record to DB. New status: ${newStatus}`);
        const [updateResult] = await pool.query('UPDATE matches SET result_type = ?, winning_team = ?, status = ?, result_entered_at = NOW() WHERE match_id = ? AND space_id = ?', [result_type, validWinningTeam, newStatus, matchId, spaceId]);
        console.log(`${logPrefix} Match record update query executed. Affected rows: ${updateResult.affectedRows}`);
        if (updateResult.affectedRows === 0) { console.log(`${logPrefix} Failed to update match record (0 affected).`); return res.status(500).json({ message: 'Failed to update match result.' });}
        
        console.log(`${logPrefix} Match record updated. Calling calculateAndApplyPoints...`);
        await calculateAndApplyPoints(matchId, parseInt(spaceId, 10), result_type, validWinningTeam);
        console.log(`${logPrefix} calculateAndApplyPoints FINISHED successfully.`);

        res.json({ message: `Match result entered successfully for match ID ${matchId}. Points calculated.` });
        console.log(`${logPrefix} Response sent successfully.`);
    } catch (error) {
        console.error(`${logPrefix} CATCH BLOCK ERROR:`, error);
        if (!res.headersSent) res.status(500).json({ message: 'Server error entering match result. Please try again.' });
    }
};

// @desc    Admin clears a previously entered result
const clearMatchResult = async (req, res) => {
    const matchIdParam = req.params.matchId;
    const logPrefix = `[clearResult MatchID:${matchIdParam}]`;
    console.log(`${logPrefix} REQ RECEIVED - SpaceID from token: ${req.user?.spaceId}`);
    const { spaceId } = req.user;
    const matchId = parseInt(matchIdParam, 10);
    let connection;
    try {
        if (isNaN(matchId) || isNaN(parseInt(spaceId,10))) { console.log(`${logPrefix} Invalid match/space ID.`); return res.status(400).json({ message: 'Invalid identifiers.' });}
        connection = await pool.getConnection();
        await connection.beginTransaction();
        console.log(`${logPrefix} [ConnID:${connection.threadId}] Transaction started.`);
        const [matchRows] = await connection.query('SELECT status, prediction_deadline FROM matches WHERE match_id = ? AND space_id = ?', [matchId, spaceId]);
        if (matchRows.length === 0) { await connection.rollback(); connection.release(); return res.status(404).json({ message: 'Match not found.' });}
        const currentMatch = matchRows[0]; // prediction_deadline is 'YYYY-MM-DD HH:MM:SS' string
        if (currentMatch.status !== 'ResultAvailable' && currentMatch.status !== 'MatchDrawn') { await connection.rollback(); connection.release(); return res.status(400).json({ message: 'Match does not have a clearable result.' });}
        const [predictions] = await connection.query('SELECT user_id, points_earned_for_this_match FROM predictions WHERE match_id = ? AND space_id = ?', [matchId, spaceId]);
        console.log(`${logPrefix} [ConnID:${connection.threadId}] Found ${predictions.length} predictions for point reversal.`);
        for (const pred of predictions) {
            if (pred.points_earned_for_this_match !== 0) {
                console.log(`${logPrefix} [ConnID:${connection.threadId}] Reverting ${pred.points_earned_for_this_match} for user ${pred.user_id}.`);
                await connection.query('UPDATE users SET overall_total_points = overall_total_points - ? WHERE user_id = ? AND space_id = ?', [pred.points_earned_for_this_match, pred.user_id, spaceId]);
            }
        }
        console.log(`${logPrefix} [ConnID:${connection.threadId}] Resetting points_earned in predictions table...`);
        await connection.query('UPDATE predictions SET points_earned_for_this_match = 0 WHERE match_id = ? AND space_id = ?', [matchId, spaceId]);
        const deadline = new Date(currentMatch.prediction_deadline); // JS Date parses 'YYYY-MM-DD HH:MM:SS' as local
        const newStatus = new Date() > deadline ? 'PredictionClosed' : 'PredictionOpen';
        console.log(`${logPrefix} [ConnID:${connection.threadId}] Setting match status to ${newStatus}.`);
        await connection.query(`UPDATE matches SET status = ?, result_type = NULL, winning_team = NULL, result_entered_at = NULL WHERE match_id = ? AND space_id = ?`, [newStatus, matchId, spaceId]);
        await connection.commit();
        console.log(`${logPrefix} [ConnID:${connection.threadId}] Transaction committed.`);
        res.json({ message: `Result for match ID ${matchId} cleared. Points reverted. Match status: ${newStatus}.` });
    } catch (error) {
        if (connection) { await connection.rollback(); }
        console.error(`${logPrefix} CATCH BLOCK ERROR:`, error);
        if (!res.headersSent) res.status(500).json({ message: 'Server error clearing result.' });
    } finally {
        if (connection) connection.release();
        console.log(`${logPrefix} Connection released.`);
    }
};

module.exports = {
    addMatch,
    getAllMatchesForSpaceAdmin,
    updateMatch,
    deleteMatch,
    enterMatchResult,
    getMatchesForSpaceUser,
    getMatchById,
    clearMatchResult,
    calculateAndApplyPoints // Exporting for completeness, though it's internally used
};