
// NODE MODULES
const mongoose = require('mongoose')

// MODELS 
const User = mongoose.model('User');

// HELPERS
const { checkUUID } = require('./helpers/checkUUID');

async function user(request, response, next) {
    try {

        const { uuid } = request.session;

        checkUUID(request, response, uuid);

        const user = await User.findOne({ uuid });

        request.user = user;
        next();

    } catch (error) {
        console.log(error.message);
        return response.status(422).send({ error: error.message });
    }
}

module.exports = { user };
