// backend/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
// const pool = require('../config/db'); // Not directly used in this middleware

const protect = async (req, res, next) => {
    let token;

    // 1. Try to get token from Authorization header (for API client testing)
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
        } catch (error) {
            console.error('Error splitting auth header:', error);
            // Fall through to cookie check or fail
        }
    }

    // 2. If no header token, try to get token from httpOnly cookie
    if (!token && req.cookies && req.cookies.jwt) {
        token = req.cookies.jwt;
    }


    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            // The `id` here will be the actual integer user_id for regular users,
            // or a string like `admin_${spaceId}` for admins.
            req.user = {
                id: decoded.userId,
                spaceId: decoded.spaceId,
                isAdmin: decoded.isAdmin || false,
            };
            next();
        } catch (error) {
            console.error('Token verification failed:', error.message);
            if (error.name === 'TokenExpiredError') {
                res.status(401).json({ message: 'Not authorized, token expired' });
            } else {
                res.status(401).json({ message: 'Not authorized, token failed' });
            }
        }
    } else {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

const adminOnly = (req, res, next) => {
    // This middleware should always run AFTER `protect`
    if (req.user && req.user.isAdmin) {
        next();
    } else {
        res.status(403).json({ message: 'Not authorized as an admin' });
    }
};

// Middleware to ensure the user is a regular user, not an admin
const userOnly = (req, res, next) => {
    // This middleware should always run AFTER `protect`
    if (req.user && !req.user.isAdmin) { // Check if isAdmin is false
        // Also, ensure the user.id is a number, as admin IDs are strings like 'admin_X'
        if (typeof req.user.id === 'number') {
            next();
        } else {
            // This case handles if somehow a token has isAdmin:false but a string ID.
            // It's an extra safeguard.
            res.status(403).json({ message: 'Action requires a standard user account.' });
        }
    } else if (req.user && req.user.isAdmin) {
        res.status(403).json({ message: 'Action not allowed for admin accounts. Admins manage, users play!' });
    }
    else {
        // This case should ideally be caught by `protect` first, but for completeness
        res.status(401).json({ message: 'Not authorized.' });
    }
};

module.exports = { protect, adminOnly, userOnly }; // Export userOnly