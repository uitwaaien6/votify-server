
// NODE MODULES
const mongoose = require('mongoose');
const chalk = require('chalk');

// MODELS
const User = mongoose.model('User');
const Vote = mongoose.model('Vote');

// ROUTES > HELPERS
const { calcTotalOptionsValues } = require('../routes/helpers/calcTotalOptionsValues');

// CONFIG > TIMES
const times = require('../../_config/times');
const TEN_MIN = (times.ONE_MIN * 10);

// CONFIG > ROLES
const roles = require('../../_config/roles');

// This timer is different than the others because besides executing that function and put it into interval id, we also exporting that function to use it in every /make-vote request to increase the security.
async function checkIllegalVotes() {

    try {

        // check all the current votes to find if there is any extra vote in the votes
        const executives = await User.find({ role: roles.EXECUTIVE, is_admin: false, permission: roles.PERMISSION_2 }); // aka voters

        const dbVotes = await Vote.find();

        if (!dbVotes || !executives) {
            return console.log(chalk.red('No Database Votes or Executives found'));
        }

        const currentVotes = dbVotes.map((dbVote, index) => {
            return { _id: dbVote._id, votes: dbVote.votes, voters: dbVote.voters };
        });

        const illegalVotes = [];
        const votesDeletions = [];

        currentVotes.forEach((currentVote, index) => {

            const totalOptionsValuesReCheck = calcTotalOptionsValues(currentVote.votes);

            if (totalOptionsValuesReCheck > executives.length) {
                
                illegalVotes.push(currentVote);
                
            }

        });

        illegalVotes.forEach((illegalVote, index) => {
            votesDeletions.push(Vote.deleteOne({ _id: illegalVote._id }));
        });

        await Promise.all(votesDeletions);

    } catch (error) {
        console.log('Error in checkIllegalVotes.js', error.message);    
    }

}

// Check for inital
checkIllegalVotes();

// Check if there are any illegal votes in every half an hour.
setInterval(() => checkIllegalVotes(), TEN_MIN);
