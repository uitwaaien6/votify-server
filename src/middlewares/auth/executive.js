
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
async function executive(request, response, next) {
    try {

        const { uuid } = request.session;

        const { user, session } = await checkUUID(request, response, uuid);

        if (user.role !== roles.EXECUTIVE || user.is_admin || user.permission !== roles.PERMISSION_2) {
            return response.status(401).send({ error: 'user with the given uuid is not executive' });
        }

        request.user = user;
        next();

    } catch (error) {
        console.log(chalk.red(' ! Error in admin middleware'));
        return response.status(422).send({ error: error.message });
    }
}

module.exports = { executive };
