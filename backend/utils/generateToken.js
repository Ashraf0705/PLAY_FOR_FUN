// backend/utils/generateToken.js
const jwt = require('jsonwebtoken');

const generateToken = (res, userId, spaceId, isAdmin = false) => {
    const tokenPayload = { userId, spaceId, isAdmin };
    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '1h' });
    
    let maxAgeMs;
    const expiresIn = process.env.JWT_EXPIRES_IN || '1h';
    if (expiresIn.endsWith('h')) maxAgeMs = parseInt(expiresIn.slice(0, -1), 10) * 3600000;
    else if (expiresIn.endsWith('d')) maxAgeMs = parseInt(expiresIn.slice(0, -1), 10) * 86400000;
    else maxAgeMs = (parseInt(expiresIn, 10) || 3600) * 1000;

    const cookieOptions = {
        httpOnly: true,
        secure: true, // MUST be true if SameSite=None, and production is always HTTPS on Vercel
        sameSite: 'None', // <<<< TRY THIS for cross-site cookie sharing
        maxAge: maxAgeMs,
        path: '/',
    };
    
    // If NODE_ENV is not production (i.e. local development over HTTP)
    // SameSite=None and Secure=true will prevent cookie from being set.
    // So, for local HTTP development, we revert to Lax and secure=false.
    if (process.env.NODE_ENV !== 'production') {
        cookieOptions.sameSite = 'Lax';
        cookieOptions.secure = false;
    }
    
    console.log(`Setting cookie in ${process.env.NODE_ENV} with options:`, cookieOptions);
    res.cookie('jwt', token, cookieOptions);

    return token;
};

module.exports = generateToken;