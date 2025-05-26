// backend/routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { setOverallUserScore } = require('../controllers/adminController');

// @route   PUT /api/admin/users/:userIdToEdit/score
// @desc    Admin manually sets a user's overall score within their authenticated space.
//          The admin's spaceId is taken from their token (req.user.spaceId).
// @access  Private (Admin Only)
router.put('/users/:userIdToEdit/score', protect, adminOnly, setOverallUserScore);

// Future admin-specific, non-match, non-prediction routes can go here.
// For example, if an admin could edit space settings:
// router.put('/space/settings', protect, adminOnly, updateSpaceSettings);

module.exports = router;