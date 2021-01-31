
// NODE MODULES
const mongoose = require('mongoose')

// HELPERS
const { checkUUID } = require('./checkUUID');

async function authenticated(request, response, next) {
    try {

        const { uuid } = request.session;

        checkUUID(request, response, uuid);

        return next();

    } catch (error) {
        console.log(error.message);
        return response.status(422).send({ error: error.message });
    }
}

module.exports = { authenticated };
