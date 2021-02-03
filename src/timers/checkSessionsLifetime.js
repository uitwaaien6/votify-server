
// NODE MODULES
const mongoose = require('mongoose');

// MODELS
const Session = mongoose.model('Session');

// CONFIG > TIMES
const times = require('../../_config/times');
const THREE_HOURS = times.ONE_HOUR * 3;

async function checkSessionsLifetime(ttl) {

    try {
        
    const sessions = await Session.find();
    const endedSessions = [];
    const sessionDeletions = [];

    sessions.forEach((session, index) => {
        
        const expirationDate = (Date.parse(session.updatedAt)) + ttl;
        const isSessionEnded = Date.now() > expirationDate;

        if (isSessionEnded) {
            endedSessions.push(session);
        }

    });

    endedSessions.forEach((session, index) => {
        sessionDeletions.push(Session.deleteOne({ _id: session._id }));
    });

    await Promise.all(sessionDeletions);

    } catch (error) {
        console.log(` Error in checkSessionsLifetime.js`, error.message);
    }

}


// Argument is the additional milliseconds which will be added to the createdAt property
checkSessionsLifetime(THREE_HOURS);

// Checks per minute
setInterval(() => checkSessionsLifetime(THREE_HOURS), times.ONE_MIN); 
