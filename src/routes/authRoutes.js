
// NODE MODULES
const express = require('express');
const mongoose = require('mongoose');
const secureRandomString = require('secure-random-string');
const uuid = require('uuid');
const router = express.Router();

// MODELS
const User = mongoose.model('User');

// VALIDATORS
const validator = require('../validators/validator'); // general validator

// CONFIG > EXPIRATION DATES
const expDates = require('../../_config/expirationDates');

// #route:  POST /register
// #desc:   User sends a request to admin to be registered
// #access: Public
router.post('/register', async (request, response) => {

    try {
        console.log(request.body);
        response.send('user has been registered');
    } catch (error) {
        return response.status(422).send({ error: error.message });
    }

});

module.exports = router;
