"use strict";

// NODE MODULES
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const cookieParser = require('cookie-parser');

// APPLICATION
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

// MODELS
require('./models/UserModel');
require('./models/SessionModel');
require('./models/VoteModel');

// TIMERS
require('./timers/checkSessionsLifetime');
require('./timers/checkActiveUsers');
require('./timers/checkIllegalVotes');

// ROUTES
const authRoutes = require('./routes/authRoutes');
const voteRoutes = require('./routes/voteRoutes');

// NODE ENVIRONMENT CONFIG
const IN_PROD = NODE_ENV === 'production';

app.use(cookieParser());

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

app.use(authRoutes);
app.use(voteRoutes);

// LISTEN
app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
