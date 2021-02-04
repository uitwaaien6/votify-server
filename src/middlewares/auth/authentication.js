
// NODE MODULES
const mongoose = require('mongoose')

// MODELS 
const User = mongoose.model('User');

// HELPERS
const { checkUUID } = require('./helpers/checkUUID');

async function authentication(request, response, next) {
    try {

        const { uuid } = request.session;

        const { user, session } = await checkUUID(request, response, uuid);

        request.user = user;
        next();

    } catch (error) {
        console.log(error.message);
        return response.status(422).send({ error: error.message });
    }
}

module.exports = { authentication };
