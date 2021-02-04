
// NODE MODULES
const express = require('express');
const mongoose = require('mongoose');
const srs = require('secure-random-string');
const uuid = require('uuid');

const router = express.Router();

// MODELS
const User = mongoose.model('User');
const Session = mongoose.model('Session');
const Vote = mongoose.model('Vote');

// MIDDLEWARES

const { admin } = require('../middlewares/auth/admin');
const { executive } = require('../middlewares/auth/executive');
const { user } = require('../middlewares/auth/user');

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
            response.status(422).json({ error: 'Title or options are not provided' });
        }

        console.log(request.user);

        const vote = new Vote({
            user_id: request.user._id,
            title,
            options: !options || options.length === 0 ? defaultOptions : options.concat('cekimser')
        });

        await vote.save();

        return response.json({ success: true, msg: 'A new vote has been successfully started' });

    } catch (error) {
        console.log(` ! Error in voteRoutes.js`, error.message);
    }
});

// #route:  GET /votes
// #desc:   User get votes
// #access: Private
router.get('/votes', user, async (request, response) => {
    try {
        
        const votes = await Vote.find();

        if (!votes) {
            return response.status(422).json({ error: 'Votes doesnt exist' });
        }

        const clientVotes = votes.map((vote, index) => {
            if (vote.active) {
                return {
                    title: vote.title,
                    options: vote.options,
                    id: vote._id
                }
            }
        });

        return response.json({ success: true, msg: 'You have successfully get the votes', votes: clientVotes });

    } catch (error) {
        console.log(` ! Error in voteRoutes.js`, error.message);
    }
});

// #route:  POST /vote
// #desc:   Executive votes 
// #access: Private
router.post('/vote', executive, async (request, response) => {
    try {
        
        

        return response.json({ success: true, msg: 'You have successfully voted' });

    } catch (error) {
        console.log(` ! Error in voteRoutes.js`, error.message);
    }
});

module.exports = router;
