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

// --- Helper Function to check if Username is unique within a Space (with logging) ---
const isUsernameUniqueInSpace = async (spaceId, username) => {
    console.log(`[isUsernameUniqueInSpace] Checking uniqueness for username: "${username}" in spaceId: ${spaceId}`);
    try {
        const [rows] = await pool.query(
            'SELECT user_id FROM users WHERE space_id = ? AND username = ?',
            [spaceId, username]
        );
        console.log(`[isUsernameUniqueInSpace] Found ${rows.length} users with name "${username}" in space ${spaceId}.`);
        return rows.length === 0; // True if unique (no rows found)
    } catch (dbError) {
        console.error("[isUsernameUniqueInSpace] Database error:", dbError);
        // Consider how to handle DB errors here. Returning false might lead to
        // a "username taken" message which isn't accurate if the DB failed.
        // For now, let's throw to indicate a server-side issue.
        throw dbError;
    }
};


// @desc    Create a new Space
// @route   POST /api/spaces/create
// @access  Public
const createSpace = async (req, res) => {
    const { space_name, admin_password, confirm_password } = req.body;

    if (!space_name || !admin_password || !confirm_password) {
        return res.status(400).json({ message: 'Space name and admin passwords are required' });
    }
    if (admin_password !== confirm_password) {
        return res.status(400).json({ message: 'Admin passwords do not match' });
    }

    try {
        let generated_join_code;
        let codeIsUnique = false;
        let attempts = 0;

        while (!codeIsUnique && attempts < 10) {
            generated_join_code = generateRandomJoinCode(6);
            codeIsUnique = await isJoinCodeUnique(generated_join_code);
            attempts++;
        }

        if (!codeIsUnique) {
            return res.status(500).json({ message: 'Could not generate a unique join code. Please try again.' });
        }

        const salt = await bcrypt.genSalt(10);
        const admin_password_hashed = await bcrypt.hash(admin_password, salt);

        const [result] = await pool.query(
            'INSERT INTO spaces (space_name, admin_password_hashed, join_code) VALUES (?, ?, ?)',
            [space_name, admin_password_hashed, generated_join_code]
        );
        const newSpaceId = result.insertId;

        if (newSpaceId) {
            res.status(201).json({
                message: 'Space created successfully!',
                space_id: newSpaceId,
                space_name: space_name,
                join_code: generated_join_code,
            });
        } else {
            res.status(500).json({ message: 'Error creating space' });
        }
    } catch (error) {
        console.error('Error in createSpace:', error);
        res.status(500).json({ message: 'Server error while creating space' });
    }
};


// @desc    User joins an existing Space (NOW REQUIRES PASSWORD, with logging)
// @route   POST /api/spaces/join
// @access  Public
const joinSpace = async (req, res) => {
    const { join_code, username, password, confirm_password } = req.body;
    console.log(`[joinSpace] Attempting to join. join_code: "${join_code}", username: "${username}"`);

    if (!join_code || !username || !password || !confirm_password) {
        return res.status(400).json({ message: 'Join code, username, password, and confirm password are required.' });
    }
    if (password !== confirm_password) {
        return res.status(400).json({ message: 'Passwords do not match.' });
    }
    if (password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

    try {
        const [spaces] = await pool.query('SELECT space_id, space_name FROM spaces WHERE join_code = ?', [join_code]);
        if (spaces.length === 0) {
            console.log(`[joinSpace] Invalid Join Code: "${join_code}"`);
            return res.status(404).json({ message: 'Invalid Join Code.' });
        }
        const space = spaces[0];
        console.log(`[joinSpace] Found space: ID ${space.space_id}, Name "${space.space_name}"`);

        const usernameIsUnique = await isUsernameUniqueInSpace(space.space_id, username);
        console.log(`[joinSpace] Is username "${username}" unique in space ${space.space_id}? : ${usernameIsUnique}`);

        if (!usernameIsUnique) {
            console.log(`[joinSpace] Username "${username}" is already taken in space ${space.space_id}.`);
            return res.status(400).json({ message: `Username '${username}' is already taken in this Space. Please choose another.` });
        }

        console.log(`[joinSpace] Username "${username}" is unique. Proceeding to hash password.`);
        const salt = await bcrypt.genSalt(10);
        const password_hashed = await bcrypt.hash(password, salt);
        console.log(`[joinSpace] Password hashed. Proceeding to insert user.`);

        const [result] = await pool.query(
            'INSERT INTO users (space_id, username, password_hashed) VALUES (?, ?, ?)',
            [space.space_id, username, password_hashed]
        );
        const newUserId = result.insertId;
        console.log(`[joinSpace] User inserted with ID: ${newUserId}`);

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
            console.error('[joinSpace] User insert failed, result:', result);
            res.status(500).json({ message: 'Error joining space (user creation failed).' });
        }
    } catch (error) {
        console.error('[joinSpace] CATCH BLOCK Error:', error);
        res.status(500).json({ message: 'Server error while joining space.' });
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


// @desc    User login to an existing Space (NOW REQUIRES PASSWORD)
// @route   POST /api/spaces/user/login
// @access  Public
const userLoginToSpace = async (req, res) => {
    const { join_code, username, password } = req.body;

    if (!join_code || !username || !password) {
        return res.status(400).json({ message: 'Join code, username, and password are required.' });
    }

    try {
        const [spaces] = await pool.query('SELECT space_id, space_name FROM spaces WHERE join_code = ?', [join_code]);
        if (spaces.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials or space not found.' });
        }
        const space = spaces[0];

        const [userRows] = await pool.query(
            'SELECT user_id, username, password_hashed FROM users WHERE space_id = ? AND username = ?',
            [space.space_id, username]
        );

        if (userRows.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials or space not found.' });
        }
        const user = userRows[0];

        const isPasswordMatch = await bcrypt.compare(password, user.password_hashed);

        if (!isPasswordMatch) {
            return res.status(401).json({ message: 'Invalid credentials or space not found.' });
        }

        const token = generateToken(res, user.user_id, space.space_id, false);
        res.json({
            message: `Login successful for user: ${user.username} in Space: ${space.space_name}`,
            user_id: user.user_id,
            username: username,
            space_id: space.space_id,
            space_name: space.space_name,
            isAdmin: false,
            token: token
        });

    } catch (error) {
        console.error('Error in userLoginToSpace:', error);
        res.status(500).json({ message: 'Server error during user login.' });
    }
};

// @desc    Logout user / Clear cookie
// @route   POST /api/spaces/logout
// @access  Private
const logoutUser = (req, res) => {
    // Cookie options should match how it was set, especially for production regarding 'secure' and 'sameSite'
    const cookieOptions = {
        httpOnly: true,
        expires: new Date(0), // Set expiry to a past date
        path: '/', // Ensure path matches what was used to set cookie
    };
    if (process.env.NODE_ENV === 'production') {
        cookieOptions.secure = true;
        cookieOptions.sameSite = 'None';
    } else {
        cookieOptions.sameSite = 'Lax'; // Default for dev
        cookieOptions.secure = false;
    }
    res.cookie('jwt', '', cookieOptions);
    res.status(200).json({ message: 'Logged out successfully' });
};

module.exports = {
    createSpace,
    joinSpace,
    adminLoginToSpace,
    userLoginToSpace,
    logoutUser
};