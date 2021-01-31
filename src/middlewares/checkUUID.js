
// NODE MODULES
const mongoose = require('mongoose')

// MODELS
const User = mongoose.model('User');
const Session = mongoose.model('Session');

// Check UUID function finds the user with the given uuid and the session and refreshes the session.
async function checkUUID(request, response, uuid) {

    try {
        if (!uuid) {
            return response.status(422).send({ error: 'Your are not authenticated' });
        }
    
        const user = await User.findOne({ uuid });
    
        if (!user) {
            return response.status(422).send({ error: 'person with the given uuid doesnt exist' });
        }
    
        const session = await Session.findOne({ uuid });
    
        if (!session) {
            return response.status(422).send({ error: 'session with the given uuid doesnt exist' });
        }
    
        await session.save();

    } catch (error) {
        console.log(error.message);
        console.log(`Error in checkUUID.js`);
    }

}

module.exports = { checkUUID };
