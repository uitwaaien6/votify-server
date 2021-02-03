
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

const { admin } = require('../middlewares/admin');
const { executive } = require('../middlewares/executive');
const { user } = require('../middlewares/user');

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

        if (!title || !options || title === ' ' || options.length <= 1) {
            response.status(422).send({ error: 'Title or options are not provided' });
        }

        const vote = new Vote({
            user_id: request.user._id,
            title,
            options
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
router.get('/votes', executive, async (request, response) => {
    try {
        
        

        return response.json({ success: true, msg: 'You have successfully get the votes' });

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
