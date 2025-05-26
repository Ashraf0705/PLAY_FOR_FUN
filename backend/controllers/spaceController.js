// backend/controllers/spaceController.js
const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const generateToken = require('../utils/generateToken');

// --- Helper Function to generate a random alphanumeric Join Code ---
const generateRandomJoinCode = (length = 6) => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
};

// --- Helper Function to check if Join Code is unique ---
const isJoinCodeUnique = async (joinCode) => {
    const [rows] = await pool.query('SELECT space_id FROM spaces WHERE join_code = ?', [joinCode]);
    return rows.length === 0;
};

// --- Helper Function to check if Username is unique within a Space ---
const isUsernameUniqueInSpace = async (spaceId, username) => {
    const [rows] = await pool.query('SELECT user_id FROM users WHERE space_id = ? AND username = ?', [spaceId, username]);
    return rows.length === 0;
};


// @desc    Create a new Space
// @route   POST /api/spaces/create
// @access  Public
const createSpace = async (req, res) => {
    // REMOVE join_code from req.body destructuring
    const { space_name, admin_password, confirm_password } = req.body;

    // Basic Validation (join_code validation from client is removed)
    if (!space_name || !admin_password || !confirm_password) { // UPDATED: join_code removed from this check
        return res.status(400).json({ message: 'Space name and admin passwords are required' }); // UPDATED: message
    }
    if (admin_password !== confirm_password) {
        return res.status(400).json({ message: 'Admin passwords do not match' });
    }
    // REMOVED: join_code length validation from client

    try {
        let generated_join_code; // Use a different variable name to avoid confusion with req.body if it was there
        let codeIsUnique = false;
        let attempts = 0; // To prevent infinite loop in a very unlikely scenario

        // Generate a unique join code
        while (!codeIsUnique && attempts < 10) { // Try up to 10 times
            generated_join_code = generateRandomJoinCode(6); // Generate a 6-character code
            codeIsUnique = await isJoinCodeUnique(generated_join_code);
            attempts++;
        }

        if (!codeIsUnique) {
            // Extremely unlikely with 6 alphanumeric chars, but a safeguard
            return res.status(500).json({ message: 'Could not generate a unique join code. Please try again.' });
        }

        // Hash admin password
        const salt = await bcrypt.genSalt(10);
        const admin_password_hashed = await bcrypt.hash(admin_password, salt);

        // Insert new space into database
        const [result] = await pool.query(
            'INSERT INTO spaces (space_name, admin_password_hashed, join_code) VALUES (?, ?, ?)',
            [space_name, admin_password_hashed, generated_join_code] // Use the generated_join_code
        );

        const newSpaceId = result.insertId;

        if (newSpaceId) {
            res.status(201).json({
                message: 'Space created successfully!',
                space_id: newSpaceId,
                space_name: space_name,
                join_code: generated_join_code, // Return the generated_join_code to the admin
            });
        } else {
            res.status(500).json({ message: 'Error creating space' });
        }
    } catch (error) {
        console.error('Error in createSpace:', error);
        res.status(500).json({ message: 'Server error while creating space' });
    }
};


// @desc    User joins an existing Space
// @route   POST /api/spaces/join
// @access  Public
const joinSpace = async (req, res) => {
    const { join_code, username } = req.body;

    if (!join_code || !username) {
        return res.status(400).json({ message: 'Join code and username are required' });
    }

    try {
        const [spaces] = await pool.query('SELECT space_id, space_name FROM spaces WHERE join_code = ?', [join_code]);
        if (spaces.length === 0) {
            return res.status(404).json({ message: 'Invalid Join Code' });
        }
        const space = spaces[0];

        if (!await isUsernameUniqueInSpace(space.space_id, username)) {
            return res.status(400).json({ message: `Username '${username}' is already taken in this Space. Please choose another.` });
        }

        const [result] = await pool.query(
            'INSERT INTO users (space_id, username) VALUES (?, ?)',
            [space.space_id, username]
        );
        const newUserId = result.insertId;

        if (newUserId) {
            const token = generateToken(res, newUserId, space.space_id, false);
            res.status(201).json({
                message: `Successfully joined Space: ${space.space_name}`,
                user_id: newUserId,
                username: username,
                space_id: space.space_id,
                space_name: space.space_name,
                isAdmin: false,
                token: token
            });
        } else {
            res.status(500).json({ message: 'Error joining space' });
        }
    } catch (error) {
        console.error('Error in joinSpace:', error);
        res.status(500).json({ message: 'Server error while joining space' });
    }
};


// @desc    Admin login to an existing Space
// @route   POST /api/spaces/admin/login
// @access  Public
const adminLoginToSpace = async (req, res) => {
    const { join_code, admin_password } = req.body;

    if (!join_code || !admin_password) {
        return res.status(400).json({ message: 'Join code and admin password are required' });
    }

    try {
        const [spaces] = await pool.query('SELECT space_id, space_name, admin_password_hashed FROM spaces WHERE join_code = ?', [join_code]);
        if (spaces.length === 0) {
            return res.status(401).json({ message: 'Invalid Join Code or Admin Password' });
        }
        const space = spaces[0];

        const isMatch = await bcrypt.compare(admin_password, space.admin_password_hashed);

        if (isMatch) {
            const token = generateToken(res, `admin_${space.space_id}`, space.space_id, true);
            res.json({
                message: `Admin login successful for Space: ${space.space_name}`,
                space_id: space.space_id,
                space_name: space.space_name,
                isAdmin: true,
                token: token
            });
        } else {
            res.status(401).json({ message: 'Invalid Join Code or Admin Password' });
        }
    } catch (error) {
        console.error('Error in adminLoginToSpace:', error);
        res.status(500).json({ message: 'Server error during admin login' });
    }
};


// @desc    User login to an existing Space (for subsequent logins)
// @route   POST /api/spaces/user/login
// @access  Public
const userLoginToSpace = async (req, res) => {
    const { join_code, username } = req.body;

    if (!join_code || !username) {
        return res.status(400).json({ message: 'Join code and username are required' });
    }

    try {
        const [spaces] = await pool.query('SELECT space_id, space_name FROM spaces WHERE join_code = ?', [join_code]);
        if (spaces.length === 0) {
            return res.status(401).json({ message: 'Invalid Join Code or Username' });
        }
        const space = spaces[0];

        const [users] = await pool.query('SELECT user_id FROM users WHERE space_id = ? AND username = ?', [space.space_id, username]);
        if (users.length === 0) {
            return res.status(401).json({ message: 'Invalid Join Code or Username' });
        }
        const user = users[0];

        const token = generateToken(res, user.user_id, space.space_id, false);
        res.json({
            message: `Login successful for user: ${username} in Space: ${space.space_name}`,
            user_id: user.user_id,
            username: username,
            space_id: space.space_id,
            space_name: space.space_name,
            isAdmin: false,
            token: token
        });

    } catch (error) {
        console.error('Error in userLoginToSpace:', error);
        res.status(500).json({ message: 'Server error during user login' });
    }
};

const logoutUser = (req, res) => {
    res.cookie('jwt', '', {
        httpOnly: true,
        expires: new Date(0),
    });
    res.status(200).json({ message: 'Logged out successfully' });
};

module.exports = {
    createSpace,
    joinSpace,
    adminLoginToSpace,
    userLoginToSpace,
    logoutUser
};