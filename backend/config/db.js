// backend/config/db.js
const mysql = require('mysql2/promise');
// dotenv.config(); // THIS IS ALREADY CALLED AT THE TOP OF server.js - NO NEED HERE

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT, 10) || 3306, // Get port from .env, default 3306
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    dateStrings: true, // Keep this for consistent date string format from DB
    // ssl: process.env.DB_SSL_REQUIRE === 'true' ? { 
    //     rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
    //     // ca: fs.readFileSync('/path/to/server-ca.pem') // If Railway provides a CA cert
    // } : undefined
    // Start without explicit SSL config here. If connection fails due to SSL,
    // check Railway's specific SSL connection instructions for Node.js/mysql2.
};

const pool = mysql.createPool(dbConfig);

pool.getConnection()
    .then(connection => {
        console.log(`Successfully connected to MySQL Database: ${process.env.DB_HOST}:${process.env.DB_PORT || 3306}/${process.env.DB_NAME}. Date strings enabled.`);
        connection.release();
    })
    .catch(err => {
        console.error(`Error connecting to MySQL Database (${process.env.DB_HOST}:${process.env.DB_PORT || 3306}/${process.env.DB_NAME}):`, err.message);
        if (err.code === 'ER_BAD_DB_ERROR') {
            console.error(`Database '${process.env.DB_NAME}' does not exist or is not accessible.`);
        } else if (err.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('Access denied. Check DB_USER, DB_PASSWORD, and ensure the user has privileges from your current IP if IP whitelisting is used by Railway for external connections.');
        } else if (err.code === 'ECONNREFUSED' && process.env.DB_HOST === 'localhost') {
            console.error('Connection refused. Ensure your local MySQL server is running (if connecting to local) or that cloud DB is accessible.');
        } else if (err.code === 'ENOTFOUND' || err.code === 'EAI_AGAIN') {
            console.error(`Hostname ${process.env.DB_HOST} could not be resolved. Check DB_HOST or your network connection.`);
        }
         else {
            // For other errors, including potential SSL issues, log the full error object
            console.error('Full connection error object:', JSON.stringify(err, Object.getOwnPropertyNames(err), 2));
        }
    });

module.exports = pool;