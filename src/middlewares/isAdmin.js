
// NODE MODULES
const uuid = require('uuid');

async function isAdmin(request, response, next) {
    try {

        request.session.uuid = uuid.v4();
        return next();

    } catch (error) {
        console.log(error.message);
        return response.status(422).send({ error: error.message });
    }
}

module.exports = { isAdmin };
