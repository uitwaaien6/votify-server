
// NODE MODULES
const mongoose = require('mongoose')

// MODELS
const User = mongoose.model('User');
const Session = mongoose.model('Session');

// Check UUID function finds the user with the given uuid and the session and refreshes the session.
function checkUUID(request, response, uuid) {
    return new Promise(async (resolve, reject) => {

        try {
            if (!uuid) {
                return response.status(422).json({ error: 'Please login first' });
            }
        
            const user = await User.findOne({ uuid });
        
            if (!user) {
                return response.status(422).json({ error: 'person with the given uuid doesnt exist' });
            }
        
            const session = await  Session.findOne({ uuid });
        
            if (!session) {
                return response.status(422).json({ error: 'Session is expired, please login' });
            }
        
            await session.save();

            return resolve({ user, session });
    
        } catch (error) {
            console.log(`Error in checkUUID.js`);
            return response.status(422).json({ error: error.message });
        }

    });

}

module.exports = { checkUUID };
