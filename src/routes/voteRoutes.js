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
const validator = require('../validators/validator'); // general validator

// MAILERS
const { sendMail } = require('../mailers/sendMail');

// ROUTES > HELPERS
const { configVoteOptions } = require('./helpers/configVoteOptions');
const { calcTotalOptionsValues } = require('./helpers/calcTotalOptionsValues');

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

        console.log(user);

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
router.get('/votes/:voteId', middlewares.authentication, async (request, response) => {
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
        const voteInVote = vote.voters.find((item, index) => {
            if (item.user_id.toString() === user._id.toString()) {
                return item;
            }
        });

        // check if vote model includes that vote if it is means that user already votes for that vote.
        if (voteInVote) {
            return response.status(422).json({ error: 'Voter already in vote model, vote has been denied' });
        }

        // Configure new values for user and vote schema, [votesInUserModel, votesInVoteModel, votersInVoteModel]

        // Create new Array value for user votes
        const updatedVotesInUser = [...user.votes, { vote_id: vote._id, option: voteOption }];

        // Create new Array alue for voters in vote schema
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
