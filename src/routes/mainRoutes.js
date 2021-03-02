"use strict";

// NODE MODULES
const express = require('express');
const path = require('path');

// ROUTER
const router = express.Router();


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

