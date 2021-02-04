
// NODE MODULES
const mongoose = require('mongoose');
const chalk = require('chalk');

// MODELS
const Session = mongoose.model('Session');
const User = mongoose.model('User');

// CONFIG > TIMES
const times = require('../../_config/times');
const THREE_HOURS = times.ONE_HOUR * 3;

async function checkActiveUsers(ttl) {

    try {

        const users = await User.find();

        if (!users) {
            console.log(chalk.red('No users found in checkActiveUsers.js'));
            return null;
        }

        const passiveUsers = [];
        const userDeletions = [];

        // collect passive users
        users.forEach((user, index) => {
            const isActive = user.active;

            // check the created time as well otherwise it can delete a user who is just registered to the system.
            if (!isActive && Date.now() > (Date.parse(user.createdAt) + tll)) {
                passiveUsers.push(user);
            }
        });

        // push deletion promises to array for Promise.all
        passiveUsers.forEach((user, index) => {
            userDeletions.push(User.deleteOne({ _id: user._id }));
        });

        await Promise.all(userDeletions);

    } catch (error) {
        console.log(error.message);    
    }

}

checkActiveUsers(times.ONE_HOUR * 24);

setInterval(() => {
    checkActiveUsers(times.ONE_HOUR * 24);
}, times.ONE_HOUR);

