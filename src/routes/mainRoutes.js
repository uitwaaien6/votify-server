"use strict";

// NODE MODULES
const express = require('express');
const mongoose = require('mongoose');
const srs = require('secure-random-string');
const uuid = require('uuid');
const path = require('path');

// ROUTER
const router = express.Router();

// MODELS
const User = mongoose.model('User');
const Session = mongoose.model('Session');

// ENCRYPTION
const RDE = require('../encryption/representationalDatabaseEncryption');

// HELPER
const { createClient } = require('./helpers/createClient');

// MIDDLEWARES
const middlewares = require('../middlewares');

// VALIDATORS
const authValidators = require('../validators/authValidators'); // general validator

// MAILERS
const { sendMail } = require('../mailers/sendMail');

// ENVIRONMENT
const { SESSION_LIFETIME } = require('../../_config/environment');

// CONFIG > EXPIRATION DATES
const times = require('../../_config/times');

// CONFIG > ROLES
const roles = require('../../_config/roles');


// #route:  GET /
// #desc:   Home route
// #access: Public
router.get('/', async (request, response) => {

    try {

        return response.sendFile(path.join(__dirname, '../../public' , 'error-page', 'index.html'));

    } catch (error) {
        return response.status(422).send({ error: error.message });
    }

});

module.exports = router;

