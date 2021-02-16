"use strict";

// NODE MODULES
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const path = require('path');

// APPLICATION
const app = express();

// CONFIG > DB CONNECTION
require('../_config/dbConnection');

// CONFIG > ENVIRONMENTS
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
require('./supervisions/checkSessionsLifetime');
require('./supervisions/checkActiveUsers');
require('./supervisions/checkIllegalVotes');

// ROUTES
const authRoutes = require('./routes/authRoutes');
const voteRoutes = require('./routes/voteRoutes');

// NODE ENVIRONMENT CONFIG
const IN_PROD = NODE_ENV === 'production';

// HTML SERVINGS
app.use(express.static(path.join(__dirname, '../public', 'password-reset')));
app.use(express.static(path.join(__dirname, '../public', 'email-reset')));
app.use(express.static(path.join(__dirname, '../public', 'email-verified')));

app.use(
    cors({
        credentials: true
    })
);

app.use(cookieParser());

// APP CONFIG
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// SESSION CONFIG
app.use(
    session({
        name: SESSION_NAME,
        secret: SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
            maxAge: SESSION_LIFETIME,
            secure: IN_PROD
        }
    })
);

// ROUTES
app.use(authRoutes);
app.use(voteRoutes);

// LISTEN
app.listen(PORT, (err) => {
    if (err) {
        return process.exit(1);
    }

    console.log(
        `
            ########################################

                    Listening on port ${PORT}

            ########################################
        `
    );
});
