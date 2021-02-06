
// MIDDLEWARES
const { admin } = require('./auth/admin');
const { executive } = require('./auth/executive');
const { user } = require('./auth/user');
const { authentication } = require('./auth/authentication');

// EXPORTS
module.exports = {
    admin,
    executive,
    user,
    authentication
}

