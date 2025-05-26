// backend/utils/generateToken.js
const jwt = require('jsonwebtoken');

const generateToken = (res, userId, spaceId, isAdmin = false) => {
    const tokenPayload = {
        userId,
        spaceId,
        isAdmin,
    };

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    });

    // Determine maxAge for cookie from JWT_EXPIRES_IN or default to 1 hour
    let maxAgeMs;
    const expiresIn = process.env.JWT_EXPIRES_IN || '1h';
    if (expiresIn.endsWith('h')) {
        maxAgeMs = parseInt(expiresIn.slice(0, -1), 10) * 60 * 60 * 1000;
    } else if (expiresIn.endsWith('d')) {
        maxAgeMs = parseInt(expiresIn.slice(0, -1), 10) * 24 * 60 * 60 * 1000;
    } else { // Default to 1 hour if format is unknown or just a number (assume seconds)
        maxAgeMs = (parseInt(expiresIn, 10) || 3600) * 1000;
    }


    res.cookie('jwt', token, {
        httpOnly: true, // Prevents client-side JS from accessing the cookie
        secure: process.env.NODE_ENV === 'production', // Cookie only sent over HTTPS in production
        sameSite: 'Lax', // <<<< KEY CHANGE: Allows cookie to be sent on top-level navigation & GETs cross-site
                         // This helps when frontend and backend are on different ports (e.g., localhost:3000 and localhost:5001)
        maxAge: maxAgeMs, // Cookie expiry in milliseconds
        path: '/', // Cookie is available on all paths
    });

    return token; // Also return the token in the response body for API client convenience
};

module.exports = generateToken;