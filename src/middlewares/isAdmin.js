
// NODE MODULES
const uuid = require('uuid');
const mongoose = require('mongoose');

// MODELS
const User = mongoose.model('User');
const Session = mongoose.model('Session');

// CONFIG 
const roles = require('../../_config/roles');
const times = require('../../_config/times');

// admin middleware also checks if this user's session still open
async function isAdmin(request, response, next) {
    try {

        const { uuid } = request.session;

        if (!uuid) {
            return response.status(422).send({ error: 'uuid doesnt exist in your cookie' });
        }

        // find user and session in the database
        const user = await User.findOne({ uuid });
        const session = await Session.findOne({ uuid });

        if (!user) {
            return response.status(422).send({ error: 'User with this uuid doesnt exist' });
        }

        if (!session) {
            return response.status(401).send({ error: 'session with this uuid is doesnt exist or expired' });
        }

        if (user.role !== roles.ADMIN || !user.isAdmin || user.permission !== 1) {
            return response.statue(401).send({ error: 'user with the given uuid is not admin' });
        }

        return next();

    } catch (error) {
        console.log(error.message);
        return response.status(422).send({ error: error.message });
    }
}

module.exports = { isAdmin };
