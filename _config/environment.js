
// CONFIG
const expDates = require('./expirationDates');

// TIMES
const EIGHT_HOURS = expDates.ONE_HOUR * 8;

const {
    PORT = 3000,
    NODE_ENV = 'development',
    SESSION_SECRET = 'session_secret',
    SESSION_LIFETIME = EIGHT_HOURS,
    SESSION_NAME = 'usess',
    DB_PASSWORD
} = process.env;

module.exports = {
    PORT,
    NODE_ENV,
    SESSION_SECRET,
    SESSION_LIFETIME,
    SESSION_NAME,
    DB_PASSWORD
}
