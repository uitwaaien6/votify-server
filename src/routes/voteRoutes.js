
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

        const defaultOptions = ['evet', 'hayir', 'cekimser'];

        if (!title || title === ' ') {
            return response.status(422).json({ error: 'Title or options are not provided' });
        }

        const votes = await Vote.find();
        const clientIds = votes.map((vote, index) => vote.client_id);
        const clientId = clientIds?.sort().reverse()[0] + 1;

        const vote = new Vote({
            user_id: request.user._id,
            client_id: clientId ? clientId : 1,
            title,
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

        const clientVotes = votes.map((vote, index) => {
            if (vote.active) {
                return {
                    title: vote.title,
                    options: vote.options,
                    id: vote.client_id
                }
            }
        });

        return response.json({ success: true, msg: 'You have successfully get the votes', votes: clientVotes, role: user.role });

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

        const clientVote = {
            title: vote.title,
            options: vote.options,
            id: vote.client_id
        }

        return response.json({ success: true, msg: 'You have successfully voted', vote: clientVote, role: user.role  });

    } catch (error) {
        console.log(` ! Error in voteRoutes.js`, error.message);
    }
});

// #route:  POST /vote
// #desc:   Executive votes 
// #access: Private
router.get('/votes/:voteId/vote', executive, async (request, response) => {
    try {
        
        const { voteOption } = request.body;
        const { voteId } = request.params;
        const vote = await Vote.findOne({ client_id: voteId });
        const user = request.user;

        if (!vote) {
            return response.status(422).json({ error: 'Vote you are looking for doesnt exist' });
        }

        if (!vote.active) {
            return response.status(422).json({ error: 'The Vote you are looking for is inactive or admin shutdown' });
        }

        

        return response.json({ success: true, msg: 'You have successfully voted', vote: clientVote, role: user.role  });

    } catch (error) {
        console.log(` ! Error in voteRoutes.js`, error.message);
    }
});


module.exports = router;
