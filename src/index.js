"use strict";

// NODE MODULES
require('dotenv').config();
require('./models/UserModel');
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');

const app = express();

// CONFIG
require('../_config/dbConnection');
const {
    PORT,
    NODE_ENV,
    SESSION_SECRET,
    SESSION_LIFETIME,
    SESSION_NAME,
} = require('../_config/environment');

// ROUTES
const authRoutes = require('./routes/authRoutes');

// NODE ENVIRONMENT CONFIG
const IN_PROD = NODE_ENV === 'production';

// APP CONFIG
app.use(bodyParser.json({
    extended: true
}));

app.use(
    session({
        name: SESSION_NAME,
        secret: SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
            maxAge: SESSION_LIFETIME,
            sameSite: true,
            secure: IN_PROD
        }
    })
);

// ROUTERS
app.use(authRoutes);

// LISTEN
app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
