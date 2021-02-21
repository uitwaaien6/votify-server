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


// ========= PUBLIC ROUTES =============


// #route:  POST /register
// #desc:   User register itself
// #access: Public
router.post('/register', async (request, response) => {

    try {
        const { userName, email, password, passwordVerification } = request.body;

        if (!userName || !email || !password || !passwordVerification) {
            return response.status(422).send({ error: 'user name or email or password is not provided' });
        }

        const existingUser = await User.findOne({ email });

        if (existingUser) {

            let errMessage = ''

            if (existingUser.email_verified) {
                errMessage = 'This email has been taken';
            }

            if (!existingUser.email_verified) {
                errMessage = 'This email has been registered but email is not verified, if you are the owner of this email please verify your email.'
            }

            return response.status(422).json({ error: errMessage });

        }

        if (!authValidators.validateEmail(email)) {
            return response.status(422).send({ error: 'Email is not valid' });
        }

        if (!authValidators.validatePassword(password)) {
            return response.status(422).send({ error: 'password is invalid, please choose proper password' });
        }

        if (password !== passwordVerification) {
            return response.status(422).send({ error: 'password you entered is not matched' });
        }

        if (userName.includes(' ') || userName.length > 40) {
            return response.status(422).send({ error: 'invalid username' });
        }

        const email_verification_token = srs({ length: 128 });
        const email_verification_token_expiration_date = Date.now() + times.ONE_HOUR;

        const user = new User({ 
            user_name: userName, 
            email, 
            password, 
            email_verification_token, 
            email_verification_token_expiration_date
        });

        await user.save();

        const emailPackage = {
            from: 'no-reply@votify.com',
            to: email,
            subject: 'VOTIFY EMAIL VERIFICATION LINK',
            text: `UserName: ${user.user_name}`,
            html: `<a href="http://localhost:3000/api/auth/verification/verify-email/${user._id}/${email_verification_token}">Verify this email</a>`
            // TODO Remove localhost with the real domain address.
        }

        sendMail(emailPackage);

        return response.json({ success: true, msg: 'Verification link has been sent to user' });
    } catch (error) {
        return response.status(422).send({ error: error.message });
    }

});

// #route:  POST /login
// #desc:   User sends a request to admin to be registered
// #access: Public
router.post('/login', async (request, response) => {

    try {

        const { email, encryptedPassword, rdeKey } = request.body;

        const password = RDE.decrypt(encryptedPassword, rdeKey);

        const sessions = await Session.find();

        if (!email || !password) {
            return response.status(422).json({ error: 'please enter your email and password' });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return response.status(422).json({ error: 'User with the given email doesnt exist' });
        }

        // compare users password with the database password
        const isMatch = await user.comparePassword(password);

        if (!isMatch) {
            return response.status(422).json({ error: 'Email or Password is wrong' });
        }

        if (!user.email_verified || user.email_verification_token) {

            // if users email verification token expired or tried to login with verifying it, we send another email verifiaction token to their email and delete the other token, this approach saves time as we dont have to open an another route for resending email verification token.
            const email_verification_token = srs({ length: 128 });
            const email_verification_token_expiration_date = Date.now() + (times.ONE_HOUR * 2);

            user.email_verification_token = email_verification_token;
            user.email_verification_token_expiration_date = email_verification_token_expiration_date;

            await user.save();

            const emailPackage = {
                from: 'no-reply@votify.com',
                to: email,
                subject: 'VOTIFY EMAIL VERIFICATION LINK',
                text: `Please verify your email for this UserName: ${user.user_name}`,
                html: `<a href="http://localhost:3000/api/auth/verification/verify-email/${user._id}/${email_verification_token}">Verify email</a>`
                // TODO Remove localhost with the real domain address.
            }
    
            sendMail(emailPackage);

            return response.status(422).json({ error: 'You must verify your account' });
        }

        // TODO Might delete the sessionExists, just delete because deleteOne function will delete if it exists we dont have to check if there are any existing session
        const sessionExists = await Session.findOne({ uuid: user.uuid, user_id: user._id });

        // Kill the existing session and will create a new session belove
        if (sessionExists) {
            await Session.deleteOne({ uuid: user.uuid });
        }

        // create a new session uuid
        let sessionUUID = uuid.v4();

        // aviod uuid overlapping but it nearly impossible though
        sessions.forEach((session, index) => {
            while (sessionUUID === session.uuid) {
                sessionUUID = uuid.v4();
            }
        });

        // create a session property called uuid and give that new session uuid
        request.session.uuid = sessionUUID;

        // make user uuid equals that uuid
        user.uuid = sessionUUID;
        // create a new session with the uuid and user id
        const session = new Session({ user_id: user._id, uuid: sessionUUID });

        // save promises for efficiency
        const promises = [user.save(), session.save()];

        // save user and session to the database
        await Promise.all(promises);

        const clientUser = createClient(user, ['email_verified', 'role', 'user_name', 'email']);

        return response.json({ success: true, msg: 'Successfully logged in', user: clientUser });

    } catch (error) {
        console.log(error);
        return response.status(422).json({ error: error.message });
    }

});

// #route:  GET /logout
// #desc:   User logsout
// #access: Public
router.get('/logout', async (request, response) => {

    try {

        const { uuid } = request.session;

        request.session.destroy();

        if (!uuid) {
            return response.status(422).json({ error: 'No uuid found in cookies, will try to destory session' });
        }

        const user = await User.findOne({ uuid });

        if (!user) {
            return response.status(422).send({ error: 'User with the given uuid doesnt exist' });
        }

        user.uuid = null;

        await Promise.all([user.save(), Session.deleteOne({ user_id: user._id })]);

        return response.json({ success: true, msg: 'Successfully logged out.' });
    } catch (error) {
        return response.status(422).send({ error: error.message });
    }

});

// #route:  GET /check-auth-status
// #desc:   User checks if its still authenticated
// #access: Public
router.get('/check-auth-status', middlewares.authentication, async (request, response) => {

    try {

        const user = request.user;

        const wantedProps = ['user_name', 'email', 'role', 'email_verified'];
        
        const clientUser = createClient(user, wantedProps);
        
        return response.status(200).json({ success: true, msg: 'Successfully Authenticated', user: clientUser });
    } catch (error) {
        return response.status(422).send({ error: 'Error while checking auth status' });
    }

});


// #route:  POST /api/auth/verification/password-reset/generate-code
// #desc:   Generate password reset code for the user and send it through email
// #access: Public
router.post('/password-reset/send-link', async (request, response) => {

    try {
        const { email } = request.body;
        const user = await User.findOne({ email });
    
        if (!user) {
            return response.status(422).send({ error: 'User with given email is not found' });
        }

        const password_reset_token = srs({ length: 128 });
        const password_reset_token_expiration_date = Date.now() + times.ONE_MIN * 30;
    
        user.password_reset_token = password_reset_token;
        user.password_reset_token_expiration_date = password_reset_token_expiration_date

        await user.save();

        const emailPackage = {
            from: 'no-reply@votify.com',
            to: email,
            subject: 'VOTIFY PASSWORD RESET LINK',
            text: `Change your password for this User Name By Clicking the Button Below: ${user.user_name}`,
            html: `<a href="http://localhost:3000/api/auth/verification/password-reset/reset-password/${user._id}/${password_reset_token}">Change Your Password</a>`
        }
        // TODO Remove localhost with the real domain address.

        sendMail(emailPackage);

        return response.json({ success: true, msg: 'Password reset link has been successfully sent to your email address' });
    
    } catch (error) {
        console.log(error.message);
        return response.statue(422).send({ error: error.message });
    }

});


// #route:  POST /api/auth/verification/password-reset/generate-code
// #desc:   Generate password reset code for the user and send it through email
// #access: Public
router.post('/email-reset/send-link', async (request, response) => {

    try {
        const { email } = request.body;
        const user = await User.findOne({ email });
    
        if (!user) {
            return response.status(422).send({ error: 'User with given email is not found' });
        }

        const email_reset_token = srs({ length: 128 });
        const email_reset_token_expiration_date = Date.now() + times.ONE_MIN * 30;
    
        user.email_reset_token = email_reset_token;
        user.email_reset_token_expiration_date = email_reset_token_expiration_date

        await user.save();

        const emailPackage = {
            from: 'no-reply@votify.com',
            to: email,
            subject: 'VOTIFY EMAIL RESET LINK',
            text: `Change your Email for this User Name By Clicking the Button Below: ${user.user_name}`,
            html: `<a href="http://localhost:3000/api/auth/verification/email-reset/reset-email/${user._id}/${email_reset_token}">Change Your Email</a>`
        }
        // TODO Remove localhost with the real domain address.

        sendMail(emailPackage);

        return response.json({ success: true, msg: 'Email reset link has been successfully sent to your email address' });
    
    } catch (error) {
        console.log(error.message);
        return response.statue(422).send({ error: error.message });
    }

});


// ======== PRIVATE ROUTE =======


// #route:  POST /register-user
// #desc:   User sends a request to admin to be registered
// #access: Private
router.post('/register-user', middlewares.admin, async (request, response) => {

    try {

        const { userName, email } = request.body;

        if (!userName || !email) {
            return response.status(422).json({ error: 'Admin has to provide email and user name of the executive' });
        }

        if (!authValidators.validateEmail(email)) {
            return response.status(422).send({ error: 'Email is not valid' });
        }

        if (userName.includes(' ') || userName.length > 40) {
            return response.status(422).json({ error: 'Please enter a valid username' });
        }

        const email_verification_token = srs({ length: 128 });
        const email_verification_token_expiration_date = Date.now() + times.ONE_HOUR;

        const temporaryPassword = srs({ length: 9 });

        const user = new User({ 
            user_name: userName, 
            email, 
            password: temporaryPassword,
            role: roles.USER,
            permission: roles.PERMISSION_3,
            active: true,
            email_verification_token, 
            email_verification_token_expiration_date
        });

        await user.save();

        const emailPackage = {
            from: 'no-reply@votify.com',
            to: email,
            subject: 'VOTFY EMAIL VERIFICATION LINK',
            text: `UserName: ${user.user_name}`,
            html: `<a href="http://localhost:3000/api/auth/verification/verify-email/${user._id}/${email_verification_token}">Verify this email</a>`
        }
        // TODO Remove localhost with the real domain address.

        sendMail(emailPackage);

        return response.json({ success: true, msg: 'Register user page' });
    } catch (error) {
        console.log(error.message);
        return response.status(422).send({ error: error.message });
    }

});

// #route:  POST /register-user
// #desc:   User sends a request to admin to be registered
// #access: Private

router.post('/register-executive', middlewares.admin, async (request, response) => {

    try {
        const { userName, email } = request.body;

        if (!userName || !email) {
            return response.status(422).json({ error: 'Admin has to provide email and user name of the executive' });
        }

        if (!authValidators.validateEmail(email)) {
            return response.status(422).send({ error: 'Email is not valid' });
        }

        if (userName.includes(' ')) {
            return response.status(422).json({ error: 'Please enter a valid username' });
        }

        const email_verification_token = srs({ length: 128 });
        const email_verification_token_expiration_date = Date.now() + times.ONE_HOUR;

        const temporaryPassword = srs({ length: 9 });

        const user = new User({ 
            user_name: userName, 
            email, 
            password: temporaryPassword,
            role: roles.EXECUTIVE,
            permission: roles.PERMISSION_2,
            active: true,
            email_verification_token, 
            email_verification_token_expiration_date
        });

        await user.save();

        const emailPackage = {
            from: 'no-reply@votify.com',
            to: email,
            subject: 'VOTIFY EMAIL VERIFICATION LINK',
            text: `UserName: ${user.user_name}`,
            html: `<a href="http://localhost:3000/api/auth/verification/verify-email/${user._id}/${email_verification_token}">Verify this email</a>`
        }
        // TODO Remove localhost with the real domain address.

        sendMail(emailPackage);

        return response.json({ success: true, msg: 'Successfully registered an executive' });
    } catch (error) {
        console.log(error.message);
        return response.status(422).send({ error: error.message });
    }

});

// #route:  POST /register/verification/verify-email/:userId/:emailVerificationToken
// #desc:   User sends a get request to a special route to verify their email
// #access: Private
router.get('/api/auth/verification/verify-email/:userId/:emailVerificationToken', async (request, response) => {

    try {
        const { userId, emailVerificationToken } = request.params;

        if (!userId || !emailVerificationToken) {
            return response.status(422).send({ error: 'user id or email verification token is not provided' });
        }

        const user = await User.findOne({ _id: userId });

        if (!user) {
            return response.status(422).send({ error: 'Something went wrong' });
        }
        
        if (Date.now() > user.email_verification_token_expiration_date || Date.now() > (Date.parse(user.email_verification_token_expiration_date))) {
            return response.status(422).send({ error: 'Email verification link expired' });
        }

        if (user.email_verification_token !== emailVerificationToken) {
            return response.status(422).send({ error: 'Something went wrong' });
        }

        user.email_verified = true;
        user.email_verification_token = null;
        user.email_verification_token_expiration_date = null;

        // save user to the database
        await user.save();

        return response.sendFile(path.join(__dirname, '../../public' , 'email-verified', 'index.html'));

    } catch (error) {
        return response.status(422).send({ error: error.message });
    }

});

// #route:  GET /api/auth/verification/password-reset/reset-password/:userId/:passwordResetToken
// #desc:   Send Proper html files for user to be able to send their new password
// #access: Private
router.get('/api/auth/verification/password-reset/reset-password/:userId/:passwordResetToken', async (request, response) => {

    try {        
        
        const { userId, passwordResetToken } = request.params;
        const user = await User.findOne({ _id: userId });

        if (!user) {
            return response.sendFile(path.join(__dirname, '../../public' , 'error-page', 'index.html'));
        }

        if (!userId || !passwordResetToken) {
            return response.sendFile(path.join(__dirname, '../../public' , 'error-page', 'index.html'));
        }

        if (user.password_reset_token !== passwordResetToken) {
            return response.sendFile(path.join(__dirname, '../../public' , 'error-page', 'index.html'));
        }

        if (Date.now() > user.password_reset_token_expiration_date || Date.now() > (Date.parse(user.password_reset_token_expiration_date))) {
            return response.sendFile(path.join(__dirname, '../../public' , 'error-page', 'index.html'));
        }

        return response.sendFile(path.join(__dirname, '../../public' , 'password-reset', 'index.html'));
    
    } catch (error) {
        return response.sendFile(path.join(__dirname, '../../public' , 'error-page', 'index.html'));
    }

});

// #route:  POST /api/auth/verification/password-reset/reset-password/:userId/:passwordResetToken
// #desc:   Take new password from user that they send from the secret rout
// #access: Private
router.post('/api/auth/verification/password-reset/reset-password/:userId/:passwordResetToken', async (request, response) => {

    try {

        const { password, passwordVerification } = request.body;

        const { userId, passwordResetToken } = request.params;

        const user = await User.findOne({ _id: userId });

        if (!user) {
            return response.status(422).send({ error: 'User with the given id doesnt exist' });
        }

        if (!userId || !passwordResetToken) {
            return response.status(422).json({ error: 'user id or password reset token is not provided' });
        }

        if (user.password_reset_token !== passwordResetToken) {
            return response.status(422).send({ error: 'password reset token authentication failed' });
        }

        if (Date.now() > user.password_reset_token_expiration_date || Date.now() > (Date.parse(user.password_reset_token_expiration_date))) {
            return response.status(422).send({ error: 'password reset token expiration date has passed' });
        }

        if (!password || !passwordVerification) {
            return response.status(422).send({ error: 'password are not provided' });
        }

        if (password !== passwordVerification) {
            return response.status(422).send({ error: 'passwords doesnt match' });
        }

        if (!authValidators.validatePassword(password)) {
            return response.status(422).send({ error: 'password you provided is invalid' });
        }

        user.password = password;
        user.password_reset_token = null;
        user.password_reset_token_expiration_date = null;

        // delete current working session if there is any, because user changed the password

        const promises = [user.save(), Session.deleteMany({ user_id: user._id })];

        await Promise.all(promises);

        const emailPackage = {
            from: 'no-reply@votify.com',
            to: user.email,
            subject: 'VOTIFY ACCOUNT PASSWORD HAS CHANGED',
            text: `${user.user_name}, this users password has been changed.`
        }

        sendMail(emailPackage);

        return response.json({ success: true, msg: 'Password has been successfully changed' });
    
    } catch (error) {
        console.log(error.message);
        return response.status(422).send({ error: error.message });
    }

});

// #route:  POST /api/auth/verification/password-reset/reset-password/:userId/:emailResetToken
// #desc:   Take new email to change it
// #access: Private
router.get('/api/auth/verification/email-reset/reset-email/:userId/:emailResetToken', async (request, response) => {

    try {

        const { userId, emailResetToken } = request.params;

        const user = await User.findOne({ _id: userId });

        if (!user) {
            return response.sendFile(path.join(__dirname, '../../public' , 'error-page', 'index.html'));
        }
        
        if (!userId || !emailResetToken) {
            return response.sendFile(path.join(__dirname, '../../public' , 'error-page', 'index.html'));
        }

        if (user.email_reset_token !== emailResetToken || !emailResetToken.includes(user.email_reset_token)) {
            return response.sendFile(path.join(__dirname, '../../public' , 'error-page', 'index.html'));
        }

        if (Date.now() > user.email_reset_token_expiration_date || Date.now() > (Date.parse(user.email_reset_token_expiration_date))) {
            return response.sendFile(path.join(__dirname, '../../public' , 'error-page', 'index.html'));
        }
        
        return response.sendFile(path.join(__dirname, '../../public' , 'email-reset', 'index.html'));
    
    } catch (error) {
        return response.sendFile(path.join(__dirname, '../../public' , 'error-page', 'index.html'));
    }

});


// #route:  POST /api/auth/verification/password-reset/reset-password/:userId/:emailResetToken
// #desc:   Take new email to change it
// #access: Private
router.post('/api/auth/verification/email-reset/reset-email/:userId/:emailResetToken', async (request, response) => {

    try {

        const { newEmail } = request.body;

        const { userId, emailResetToken } = request.params;

        const user = await User.findOne({ _id: userId });
        const existingUser = await User.findOne({ email: newEmail });

        if (existingUser) {
            return response.status(422).json({ error: 'Given email is already in use' });
        }

        if (!user) {
            return response.status(422).send({ error: 'User with the given id doesnt exist' });
        }

        const currentEmail = user.email;

        if (user.email === newEmail) {
            return response.status(422).json({ error: 'Given email is same with your current email' });
        }

        if (!newEmail) {
            return response.status(422).send({ error: 'password are not provided' });
        }
        
        if (!userId || !emailResetToken) {
            return response.status(422).json({ error: 'user id or email reset token is not provided' });
        }

        if (user.email_reset_token !== emailResetToken || !emailResetToken.includes(user.email_reset_token)) {
            return response.status(422).send({ error: 'Email reset token authentication failed' });
        }

        if (Date.now() > user.email_reset_token_expiration_date || Date.now() > (Date.parse(user.email_reset_token_expiration_date))) {
            return response.status(422).send({ error: 'password reset token expiration date has passed' });
        }

        if (!authValidators.validateEmail(newEmail)) {
            return response.status(422).send({ error: 'email you provided is invalid' });
        }

        // set new email and kill email reset token 
        user.email = newEmail;
        user.email_reset_token = null;
        user.email_reset_token_expiration_date = null;

        // current users email verified is false because changed
        user.email_verified = false;

        // set new email verification token for user to verify their new email
        const email_verification_token = srs({ length: 128 });
        const email_verification_token_expiration_date = Date.now() + times.ONE_MIN * 30;

        user.email_verification_token = email_verification_token;
        user.email_verification_token_expiration_date = email_verification_token_expiration_date;

        // delete current working session if there is any, because user changed the email, this is important

        const promises = [user.save(), Session.deleteMany({ user_id: user._id }), Session.deleteOne({ user_id: user._id })];

        await Promise.all(promises);

        sendMail({
            from: 'no-reply@votify.com',
            to: newEmail,
            subject: 'VERIFY YOUR NEW EMAIL',
            html: `<a href="http://localhost:3000/api/auth/verification/verify-email/${user._id}/${email_verification_token}">Verify this email</a>`
        });

        sendMail({
            from: 'no-reply@votify.com',
            to: currentEmail,
            subject: 'VOTIFY EMAIL CHANGED',
            text: `${user.user_name}, this users email has been changed.`
        });

        return response.json({ success: true, msg: 'Email has been successfully changed' });
    
    } catch (error) {
        console.log(error.message);
        return response.status(422).send({ error: error.message });
    }

});


module.exports = router;


// url de birden fazla uuid mimarisi each uuid baska bir objeyi temsil ediyo

