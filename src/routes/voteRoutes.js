
// NODE MODULES
const express = require('express');
const mongoose = require('mongoose');
const srs = require('secure-random-string');
const uuid = require('uuid');

// ROUTER
const router = express.Router();

// MODELS
const User = mongoose.model('User');
const Session = mongoose.model('Session');
const Vote = mongoose.model('Vote');

// MIDDLEWARES
const { admin } = require('../middlewares/auth/admin');
const { executive } = require('../middlewares/auth/executive');
const { user } = require('../middlewares/auth/user');
const { authentication } = require('../middlewares/auth/authentication');

// VALIDATORS
const validator = require('../validators/validator'); // general validator

// MAILERS
const { sendMail } = require('../mailers/sendMail');

// ROUTES > HELPERS
const configVoteOptions = require('./helpers/configVoteOptions');

// CONFIG > EXPIRATION DATES
const times = require('../../_config/times');

// CONFIG > ROLES
const roles = require('../../_config/roles');


// ========= PUBLIC ROUTES =============



// ========= PRIVATE ROUTES =============


// #route:  GET /votes
// #desc:   User get votes
// #access: Private
router.get('/votes', authentication, async (request, response) => {
    try {
        
        const votes = await Vote.find();
        const user = request.user;

        if (!votes) {
            return response.status(422).json({ error: 'Votes doesnt exist' });
        }

        const votesForClient = votes.map((vote, index) => {
            if (vote.active) {
                return {
                    title: vote.title,
                    options: vote.options,
                    client_id: vote.client_id
                }
            }
        });

        return response.json({ success: true, msg: 'You have successfully get the votes', votes: votesForClient, role: user.role });

    } catch (error) {
        console.log(` ! Error in voteRoutes.js`, error.message);
        return response.status(422).json({ error: error.message });
    }
});

// #route:  POST /vote
// #desc:   Executive votes 
// #access: Private
router.get('/votes/:voteId', authentication, async (request, response) => {
    try {
        
        const { voteId } = request.params;
        const vote = await Vote.findOne({ client_id: voteId });
        const user = request.user;

        if (!vote) {
            return response.status(422).json({ error: 'Vote you are looking for doesnt exist' });
        }

        if (!vote.active) {
            return response.status(422).json({ error: 'The Vote you are looking for is inactive or admin shutdown' });
        }

        const votesForClient = { // getting rid of every other properties especially _id for security purposes, leaving only basics and essentials
            title: vote.title,
            options: vote.options,
            client_id: vote.client_id
        }

        return response.json({ success: true, msg: 'You have successfully voted', vote: votesForClient, role: user.role  });

    } catch (error) {
        console.log(` ! Error in voteRoutes.js`, error.message);
    }
});

// #route:  POST /vote
// #desc:   Executive votes 
// #access: Private
router.post('/make-vote', executive, async (request, response) => {
    try {
        
        const user = request.user;
        const { voteOption, voteClientId } = request.body;

        const vote = await Vote.findOne({ client_id: voteClientId });
        const executives = await User.find({ role: roles.EXECUTIVE, is_admin: false, permission: roles.PERMISSION_2 }); // aka voters

        if (!vote) {
            return response.status(422).json({ error: 'Vote you are looking for doesnt exist' });
        }

        if (!vote.active) {
            return response.status(422).json({ error: 'The Vote you are looking for is inactive or admin shutdown' });
        }

        if (!vote.options.includes(voteOption)) {
            return response.status(422).json({ error: 'The option you provided is not a valid options array' });
        }
        
        if (!vote.votes[voteOption]) {
            return response.status(422).json({ error: 'Option you proivded in votes is invalid property or doesnt match' });
        }

        const userVote = user.votes.find((item) => item.vote_id === vote._id);

        // check if user model includes that vote if it is means that user already votes for that vote.
        if (userVote) {
            return response.status(422).json({ error: 'You already voted for this vote, Already exist vote in user votes' });
        }

        const voter = vote.voters.find((item, index) => item.user_id === user._id);

        // check if vote model includes that vote if it is means that user already votes for that vote.
        if (voter) {
            return response.status(422).json({ error: 'Voter in already vote model, vote has been denied' });
        }

        let totalOptionsValues = 0;

        const votesProps = Object.getOwnPropertyNames(vote.votes);

        votesProps.forEach((option, index) => {
            totalOptionsValues += vote.votes[option];
        });

        console.log(` ! Debug: Total options values:`, totalOptionsValues);

        if (totalOptionsValues += 1 > executives.length) { 
            return response.status(422).json({ error: 'The given vote exceeds the voters length' });
        }

        return response.json({ success: true, msg: 'You have successfully voted', role: user.role  });

    } catch (error) {
        console.log(` ! Error in voteRoutes.js`, error.message);
    }
});

// #route:  POST /start-vote
// #desc:   Admin creates a new vote
// #access: Private
router.post('/start-vote', admin, async (request, response) => {
    try {
        
        const { title, options } = request.body;
        const user = request.user;

        if (!title || title === ' ') {
            return response.status(422).json({ error: 'Title or options are not provided' });
        }

        // auto increment >
        // get the votes from database
        const dbVotes = await Vote.find();
        // extract the client ids of the votes and put them in array
        const clientIds = dbVotes.map((vote, index) => vote.client_id);
        // sort them by order reverse them and add 1 to the first one.
        const clientId = clientIds?.sort().reverse()[0] + 1;

        // config the vote options
        const { configedOptions, votes } = configVoteOptions(['evet', 'hayir', 'cekimser'], options);

        console.log(configedOptions);

        // TODO MAYBE Remove the options prop and just votes as an object.

        const vote = new Vote({
            user_id: user._id,
            client_id: clientId ? clientId : 1, // put it 1 if there is not any for initial.
            title,
            votes,
            options: configedOptions
        });

        await vote.save();

        return response.json({ success: true, msg: 'A new vote has been successfully started' });

    } catch (error) {
        console.log(` ! Error in voteRoutes.js`, error.message);
        return response.status(422).json({ error: error.message });
    }
});

module.exports = router;
