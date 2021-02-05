
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

// CONFIG > EXPIRATION DATES
const times = require('../../_config/times');

// CONFIG > ROLES
const roles = require('../../_config/roles');


// ========= PUBLIC ROUTES =============



// ========= PRIVATE ROUTES =============


// #route:  POST /start-vote
// #desc:   Admin creates a new vote
// #access: Private
router.post('/start-vote', admin, async (request, response) => {
    try {
        
        const { title, options } = request.body;
        const user = request.user;

        const defaultOptions = ['evet', 'hayir', 'cekimser'];

        if (!title || title === ' ') {
            return response.status(422).json({ error: 'Title or options are not provided' });
        }

        const dbVotes = await Vote.find();
        const clientIds = dbVotes.map((vote, index) => vote.client_id);
        const clientId = clientIds?.sort().reverse()[0] + 1;

        const votes = {}; // votes property of the voteSchema

        // fillin the properties of votes with the options provided by user of default. 
        (!options || options.length === 0 ? defaultOptions : options.concat('cekimser')).forEach((option, index) => {
            votes[option] = 0;
        });

        // TODO MAYBE Remove the options prop and just votes as an object.

        const vote = new Vote({
            user_id: user._id,
            client_id: clientId ? clientId : 1,
            title,
            votes,
            options: !options || options.length === 0 ? defaultOptions : options.concat('cekimser')
        });

        await vote.save();

        return response.json({ success: true, msg: 'A new vote has been successfully started' });

    } catch (error) {
        console.log(` ! Error in voteRoutes.js`, error.message);
        return response.status(422).json({ error: error.message });
    }
});

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
        
        const { voteOption, voteId } = request.body;
        const vote = await Vote.findOne({ client_id: voteId });
        const user = request.user;

        if (!vote) {
            return response.status(422).json({ error: 'Vote you are looking for doesnt exist' });
        }

        if (!vote.active) {
            return response.status(422).json({ error: 'The Vote you are looking for is inactive or admin shutdown' });
        }

        if (!vote.options.includes(voteOption)) {
            return response.status(422).json({ error: 'The option you provided is not a valid vote option' });
        }

        const userVote = user.votes.find((item) => item.vote_id === vote._id);

        if (userVote) {
            console.log('Already exist vote in user votes');
            return response.status(422).json({ error: 'You already voted for this vote' });
        }

        const voter = vote.voters.find((item, index) => item.user_id === user._id);

        if (voter) {
            return response.status(422).json({ error: 'Voter in vote model, vote has been denied' });
        }

        return response.json({ success: true, msg: 'You have successfully voted', role: user.role  });

    } catch (error) {
        console.log(` ! Error in voteRoutes.js`, error.message);
    }
});


module.exports = router;
