// backend/config/db.js
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config(); // Ensure .env is loaded if not already done at app start

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    dateStrings: true // <<<< ENSURE THIS IS PRESENT AND TRUE
});

pool.getConnection()
    .then(connection => {
        console.log('MySQL Database connected successfully! Date strings will be returned as strings.');
        connection.release();
    })
    .catch(err => {
        console.error('Error connecting to MySQL Database:', err.message);
        // ... other error checks ...
    });

module.exports = pool;