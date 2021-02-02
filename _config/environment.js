
// CONFIG
const times = require('./times');

// TIMES
const THREE_HOURS = times.ONE_HOUR * 3;

const {
    PORT = 3000,
    NODE_ENV = 'development',
    SESSION_SECRET = 'session_secret',
    SESSION_LIFETIME = THREE_HOURS,
    SESSION_NAME = 'usess',
    DB_PASSWORD,
    EMAIL_PASSWORD
} = process.env;

module.exports = {
    PORT,
    NODE_ENV,
    SESSION_SECRET,
    SESSION_LIFETIME,
    SESSION_NAME,
    DB_PASSWORD,
    EMAIL_PASSWORD
}
