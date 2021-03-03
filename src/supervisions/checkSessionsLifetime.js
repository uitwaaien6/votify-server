
// NODE MODULES
const mongoose = require('mongoose');
const chalk = require('chalk');

// MODELS
const Session = mongoose.model('Session');
const User = mongoose.model('User');

// CONFIG > TIMES
const times = require('../../_config/times');
const THREE_HOURS = times.ONE_HOUR * 3;

async function checkSessionsLifetime(ttl) {

    try {
        
    const sessions = await Session.find({});

    if (!sessions) {
        return console.log(chalk.red('No Sessions found or Couldnt connect to database'))
    }

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
        //sessionDeletions.push(User.updateOne({ uuid: session.uuid }, { $set: { uuid: null } }));
        sessionDeletions.push(Session.deleteOne({ _id: session._id }));
    });

    await Promise.all(sessionDeletions); // delete collected promises with Promise.all(), gain huge efficiency

    } catch (error) {
        console.log(` Error in checkSessionsLifetime.js`, error.message);
    }

}


// Argument is the additional milliseconds which will be added to the updatedAt property
checkSessionsLifetime(THREE_HOURS);

// Checks per minute
setInterval(() => checkSessionsLifetime(THREE_HOURS), times.ONE_MIN); 
