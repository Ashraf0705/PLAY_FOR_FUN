// backend/routes/matchRoutes.js
const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const {
    addMatch,
    getAllMatchesForSpaceAdmin,
    updateMatch,
    deleteMatch,
    enterMatchResult,
    getMatchesForSpaceUser,
    getMatchById,
    clearMatchResult // IMPORTED
} = require('../controllers/matchController');

// --- ADMIN ONLY MATCH ROUTES ---
router.post('/admin/add', protect, adminOnly, addMatch);
router.get('/admin/all', protect, adminOnly, getAllMatchesForSpaceAdmin);
router.put('/admin/:matchId/edit', protect, adminOnly, updateMatch);
router.delete('/admin/:matchId/delete', protect, adminOnly, deleteMatch);
router.put('/admin/:matchId/result', protect, adminOnly, enterMatchResult);
router.post('/admin/:matchId/clear-result', protect, adminOnly, clearMatchResult); // ADDED ROUTE

// --- USER ACCESSIBLE MATCH ROUTES ---
router.get('/', protect, getMatchesForSpaceUser);
router.get('/:matchId', protect, getMatchById);

// Test routes can be removed if no longer needed
// router.get('/test-protected', protect, (req, res) => res.json({ message: "Matches: Protected!", user: req.user }));
// router.get('/test-admin', protect, adminOnly, (req, res) => res.json({ message: "Matches: Admin Only!", user: req.user }));

module.exports = router;