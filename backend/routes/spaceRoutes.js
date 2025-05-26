// backend/routes/spaceRoutes.js
const express = require('express');
const router = express.Router();
const {
    createSpace,
    joinSpace,
    adminLoginToSpace,
    userLoginToSpace,
    logoutUser // <<<<< IMPORT LOGOUTUSER
} = require('../controllers/spaceController');
const { protect } = require('../middleware/authMiddleware'); // Import protect middleware

// ... (keep existing public routes for create, join, admin/login, user/login) ...
router.post('/create', createSpace);
router.post('/join', joinSpace);
router.post('/admin/login', adminLoginToSpace);
router.post('/user/login', userLoginToSpace);

// @route   POST /api/spaces/logout
// @desc    Logout user and clear cookie
// @access  Private (needs to be logged in to logout)
router.post('/logout', protect, logoutUser); // <<<<< ADD LOGOUT ROUTE, PROTECTED

module.exports = router;