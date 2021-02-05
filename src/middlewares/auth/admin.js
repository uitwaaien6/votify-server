
// NODE MODULES
const uuid = require('uuid');
const mongoose = require('mongoose');
const chalk = require('chalk');

// MODELS
const User = mongoose.model('User');
const Session = mongoose.model('Session');

// CONFIG 
const roles = require('../../../_config/roles');
const times = require('../../../_config/times');

// HELPERS
const { checkUUID } = require('./helpers/checkUUID');

// admin middleware also checks if this user's session still open
async function admin(request, response, next) {
    try {

        const { uuid } = request.session;

        const { user, session } = await checkUUID(request, response, uuid);

        if (user.role !== roles.ADMIN || !user.is_admin || user.permission !== roles.PERMISSION_1) {
            return response.status(401).json({ error: 'user with the given id is not an admin' });
        }

        request.user = user;
        next();

    } catch (error) {
        console.log(chalk.red(' ! Error in admin middleware'));
        return response.status(422).json({ error: error.message });
    }
}

module.exports = { admin };
