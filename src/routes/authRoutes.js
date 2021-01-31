
// NODE MODULES
const express = require('express');
const mongoose = require('mongoose');
const srs = require('secure-random-string');
const uuid = require('uuid');

const router = express.Router();

// MODELS
const User = mongoose.model('User');
const Session = mongoose.model('Session');

// ROLES
const roles = require('../../_config/roles');

// MIDDLEWARES
const { isAuthenticated } = require('../middlewares/isAuthenticated');

// VALIDATORS
const validator = require('../validators/validator'); // general validator

// CONFIG > EXPIRATION DATES
const times = require('../../_config/times');

// MAILERS
const { sendVerificationMail } = require('../mailers/sendEmail');

// #route:  POST /register
// #desc:   User register itself
// #access: Public
router.post('/register', async (request, response) => {

    try {
        const { user_name, email, password } = request.body;

        if (!user_name || !email || !password) {
            return response.status(422).send({ error: 'user name or email or password is not provided' });
        }

        if (!validator.validateEmail(email)) {
            return response.status(422).send({ error: 'Email is not valid' });
        }

        if (user_name.includes(' ')) {
            return response.status(422).send({ error: 'invalid username' });
        }

        const email_verification_token = srs({ length: 128 });
        const email_verification_token_expiration_date = Date.now() + times.ONE_HOUR;

        const user = new User({ 
            user_name, 
            email, 
            password, 
            email_verification_token, 
            email_verification_token_expiration_date
        });

        await user.save();

        const emailPackage = {
            from: 'no-reply@voteapp.com',
            to: email,
            subject: 'ESN VOTING EMAIL VERIFICATION LINK',
            text: `UserName: ${user.user_name}`,
            html: `<a href="http://localhost:3000/register/verification/verify-email/${user._id}/${email_verification_token}">Verify this email</a>`
        }

        sendVerificationMail(emailPackage);

        response.send('Verification link has been sent to user');
    } catch (error) {
        return response.status(422).send({ error: error.message });
    }

});

// #route:  POST /register-user
// #desc:   User sends a request to admin to be registered
// #access: Private
router.get('/register-user', (request, response) => {

    try {
        console.log(request.session);
        response.send('');
    } catch (error) {
        console.log(error.message);
        return response.status(422).send({ error: error.message });
    }

});

// #route:  POST /register-user
// #desc:   User sends a request to admin to be registered
// #access: Private
router.post('/register-user', (request, response) => {

    try {
        console.log(request.session);

        response.send(request.session);
    } catch (error) {
        console.log(error.message);
        return response.status(422).send({ error: error.message });
    }

});

// #route:  POST /login
// #desc:   User sends a request to admin to be registered
// #access: Public
router.post('/login', async (request, response) => {

    try {

        const { email, password } = request.body;

        if (!email || !password) {
            return response.status(422).send({ error: 'please enter your email and password' });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return response.status(422).send({ error: 'User with the given email doesnt exist' });
        }

        if (!user.email_verified) {
            return response.status(422).send({ error: 'You must verify your account' });
        }

        const isMatch = await user.comparePassword(password);

        if (!isMatch) {
            return response.status(422).send({ error: 'Email or Password is wrong' });
        }

        sessionUUID = uuid.v4();

        request.session.uuid = sessionUUID;

        user.uuid = sessionUUID;

        const session = new Session({ uuid: sessionUUID, expires_at: Date.now() + times.ONE_HOUR * 3 });

        await user.save();
        await session.save();

        response.json({ success: true });

    } catch (error) {
        return response.status(422).send({ error: error.message });
    }

});

// #route:  POST /register
// #desc:   User sends a request to admin to be registered
// #access: Public
router.get('/register/verification/verify-email/:userId/:emailVerificationToken', async (request, response) => {

    try {
        const { userId, emailVerificationToken } = request.params;

        if (!userId || !emailVerificationToken) {
            return response.status(422).send({ error: 'user id or email verification token is not provided' });
        }

        const user = await User.findOne({ _id: userId });

        if (!user) {
            return response.status(422).send({ error: 'Something went wrong' });
        }
        
        if (Date.now() > user.email_verification_token_expiration_date) {
            return response.status(422).send({ error: 'Something went wrong' });
        }

        if (user.email_verification_token !== emailVerificationToken) {
            return response.status(422).send({ error: 'Something went wrong' });
        }

        user.email_verified = true;
        user.email_verification_token = null;
        user.email_verification_token_expiration_date = null;

        // save user to the database
        await user.save();

        response.send(`email with the given user id has been verified ${user._id}`);
    } catch (error) {
        return response.status(422).send({ error: error.message });
    }

});

module.exports = router;
