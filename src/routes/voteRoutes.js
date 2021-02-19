"use strict";

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
const middlewares = require('../middlewares');

// VALIDATORS
const validator = require('../validators/authValidators'); // general validator

// MAILERS
const { sendMail } = require('../mailers/sendMail');

// ROUTES > HELPERS
const { configVoteOptions } = require('./helpers/configVoteOptions');
const { calcTotalOptionsValues } = require('./helpers/calcTotalOptionsValues');
const { createClient } = require('./helpers/createClient');

// TIMERS
//const { checkIllegalVotes } = require('../timers/checkIllegalVotes'); TODO, exporting and also calling function overlapping setInterval with every make-vote request

// CONFIG > EXPIRATION DATES
const times = require('../../_config/times');

// CONFIG > ROLES
const roles = require('../../_config/roles');

// CONFIG > VOTES
const userVotes = require('../../_config/userVotes');


// ========= PUBLIC ROUTES =============



// ========= PRIVATE ROUTES =============


// #route:  GET /votes
// #desc:   User get votes
// #access: Private
router.get('/votes', middlewares.authentication, async (request, response) => {
    try {
        
        const votes = await Vote.find();
        const user = request.user;

        if (!votes) {
            return response.status(422).json({ error: 'Votes doesnt exist' });
        }

        /*
        const clientVotes = votes.map((vote, index) => {
            if (vote.active) {
                return createClient(vote, ['title', 'options', 'client_id']);
            }
        });
        */

        const clientVotes = createClient(votes, ['title', 'options', 'client_id']);

        const clientUser = createClient(user, ['email', 'role', 'user_name']);

        return response.json({ success: true, msg: 'You have successfully get the votes', votes: clientVotes, user: clientUser });

    } catch (error) {
        console.log(` ! Error in voteRoutes.js`, error.message);
        return response.status(422).json({ error: error.message });
    }
});

// #route:  POST /vote
// #desc:   Executive votes 
// #access: Private
router.get('/votes/:voteId', middlewares.authentication, async (request, response) => {
    try {
        
        const { voteId } = request.params;
        const vote = await Vote.findOne({ client_id: voteId });
        const user = request.user;

        if (!vote) {
            return response.status(422).json({ error: 'Vote you are looking for doesnt exist' });
        }

        if (!vote.active) {
            return response.status(422).json({ error: 'The Vote you are looking for is inactive or has been shutdown by admin' });
        }

        const clientVote = createClient(vote, ['title', 'options', 'client_id']);

        const clientUser = createClient(user, ['email', 'role', 'user_name']);

        return response.json({ success: true, msg: 'You have successfully voted', vote: clientVote, user: clientUser  });

    } catch (error) {
        console.log(` ! Error in voteRoutes.js`, error.message);
    }
});

// #route:  POST /vote
// #desc:   Executive votes 
// #access: Private
router.post('/make-vote', middlewares.executive, async (request, response) => {
    try {
        
        const { voteOption, voteClientId } = request.body;
        const user = request.user;

        // current vote if it exists
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
        
        if (vote.votes[voteOption] === null || vote.votes[voteOption] === undefined) {
            return response.status(422).json({ error: 'Option you provided in votes is invalid property or doesnt match' });
        }

        const totalOptionsValues = calcTotalOptionsValues(vote.votes);

        // first filter, if the total options values exceeds the executives length means that a user trying to vote again.
        if ((totalOptionsValues + userVotes.USER_VOTE) > executives.length) { 
            return response.status(422).json({ error: 'The given vote exceeds the voters length' });
        }

        // not the best practice, because dont know how to find the ObjectId in document
        const voteInUser = user.votes.find((item, index) => {
            if (item.vote_id.toString() === vote._id.toString()) {
                return item;
            }
        });

        // Second filter, check if user model includes that vote if it is means that user already votes for that vote.
        if (voteInUser) {
            return response.status(422).json({ error: 'You already voted for this vote, Already exist vote in user votes' });
        }

        // not the best practice, because dont know how to find the ObjectId in document
        const voterInVote = vote.voters.find((item, index) => {
            if (item.user_id.toString() === user._id.toString()) {
                return item;
            }
        });

        // check if vote model includes that vote if it is means that user already votes for that vote.
        if (voterInVote) {
            return response.status(422).json({ error: 'Voter already in vote model, vote has been denied' });
        }

        // Configure new values for user and vote schema, [votesInUserModel, votesInVoteModel, votersInVoteModel]

        // Create a new Array value for votes in user Schema.
        const updatedVotesInUser = [...user.votes, { vote_id: vote._id, option: voteOption }];

        // Create a new Array alue for voters in vote schema
        const updatedVotersInVote = [...vote.voters, { user_id: user._id, option: voteOption }];

        // Create new Object value votes in vote schema
        const updatedVotesInVote = { ...vote.votes };
        updatedVotesInVote[voteOption] += userVotes.USER_VOTE;

        // Place the new values for User Scehma
        const updatedUser = User.updateOne({ _id: user._id }, { $set: { votes: updatedVotesInUser } });

        // Place the new values for Vote Schema
        const updatedVote = Vote.updateOne({ _id: vote._id }, { $set: { votes: updatedVotesInVote, voters: updatedVotersInVote } });

        // save all
        await Promise.all([updatedUser, updatedVote]);

        return response.json({ success: true, msg: 'You have successfully voted', role: user.role  });

    } catch (error) {
        console.log(` ! Error in voteRoutes.js`, error.message);
    }
});

// #route:  POST /start-vote
// #desc:   Admin creates a new vote
// #access: Private
router.post('/start-vote', middlewares.admin, async (request, response) => {
    try {
        
        const { title, options } = request.body;
        const user = request.user;

        if (!title || title === ' ') {
            return response.status(422).json({ error: 'Title is not provided' });
        }

        if (options && options.length > 10) {
            return response.status(422).json({ error: 'Number of options cant be above 10' });
        }

        // auto increment >
        // get the votes from database
        const dbVotes = await Vote.find();

        let clientIds = [];
        let clientId = 0;

        if (dbVotes.length > 0) {
            // extract the client ids of the votes and put them in array
            clientIds = dbVotes.map((vote, index) => vote.client_id);
            // sort them by order reverse them and add 1 to the first one.
            clientId = clientIds?.sort((a, b) => a - b).reverse()[0] + 1;
        } else {
            clientId = 1;
        }

        // config the vote options
        const { configedOptions, votes } = configVoteOptions(userVotes.DEFAULT_VOTE_OPTIONS, options);

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
        console.log(` ! Error in /start-vote`, error.message);
        return response.status(422).json({ error: error.message });
    }
});


// #route:  POST /delete-vote
// #desc:   Admin creates a new vote
// #access: Private
router.post('/delete-vote', middlewares.admin, async (request, response) => {
    try {
        
        const { voteClientId } = request.body;
        const user = request.user;

        if (!voteClientId) {

            return response.status(422).json({ error: 'vote id is not provided' });
        }

        const vote = await Vote.findOne({ client_id: voteClientId });

        if (!vote) {
            console.log('voted yok')
            return response.status(422).json({ error: 'Vote with the given id is not found' });
        }

        await Vote.deleteOne({ client_id: voteClientId });

        const votes = await Vote.find();

        const clientVotes = createClient(votes, ['title', 'options', 'client_id']); // importance of functional programming and spread operator.

        return response.json({ success: true, msg: 'Vote has been deleted', votes: clientVotes });

    } catch (error) {
        console.log(` ! Error in /delete-vote`, error.message);
        return response.status(422).json({ error: error.message });
    }
});

module.exports = router;
