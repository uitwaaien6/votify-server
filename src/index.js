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

// CONFIG > ENVIRONMENTS
const {
    PORT,
    NODE_ENV,
    SESSION_SECRET,
    SESSION_LIFETIME,
    SESSION_NAME,
} = require('../_config/environment');

// CONFIG > DB CONNECTION
require('../_config/dbConnection');

// MODELS
require('./models/UserModel');
require('./models/SessionModel');
require('./models/VoteModel');

// SUPERVISIONS
require('./supervisions/checkSessionsLifetime');
require('./supervisions/checkActiveUsers');
require('./supervisions/checkIllegalVotes');

// ROUTES
const mainRoutes = require('./routes/mainRoutes');
const authRoutes = require('./routes/authRoutes');
const voteRoutes = require('./routes/voteRoutes');

// NODE ENVIRONMENT CONFIG
const IN_PROD = NODE_ENV === 'production';

// HTML SERVINGS
// TODO Will create a welcome page to avoid exposing email reset or password reset pages, it will use the first line that comes from express static by default
app.use(express.static(path.join(__dirname, '../public', 'error-page')));
app.use(express.static(path.join(__dirname, '../public', 'email-reset')));
app.use(express.static(path.join(__dirname, '../public', 'password-reset')));
app.use(express.static(path.join(__dirname, '../public', 'email-verified')));

app.use(
    cors({
        credentials: true,
        origin: 'http://localhost:3000'  //  http://localhost:3000  ||  http://votify.cf
    })
);

// APP CONFIG
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

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

// ROUTES MIDDLEWARE
app.use(mainRoutes);
app.use(authRoutes);
app.use(voteRoutes);

// LISTEN
app.listen(PORT, (err) => {
    if (err) return process.exit(1);
    console.log(`Listening on port ${PORT}`);
});
