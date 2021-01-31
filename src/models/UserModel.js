const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = mongoose.Schema({
    user_name: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    email_verified: {
        type: Boolean,
        default: false
    },
    email_verification_token: {
        type: String,
        default: null
    },
    email_verification_token_expiration_date: {
        type: Date,
        default: null
    },
    password: {
        type: String,
        required: true
    },
    password_reset_token: {
        type: String,
        default: null
    },
    password_reset_token_expiration_date: {
        type: Date,
        default: null
    },
    uuid: {
        type: String,
        unique: true,
    },
    active: {
        type: Boolean,
        default: false
    },
    role: {
        type: String,
        enum: ['admin', 'executive', 'user'],
        default: 'user'
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    permission: {
        type: Number,
        default: 3
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    }
});


// SAVE USERS PASSWORD WITH BCRYPT SALT
userSchema.pre('save', function(next) {

    if (!this.isModified('password')) {
        return next();
    }

    bcrypt.genSalt(12, (err, salt) => {
        if (err) {
            return next(err);
        }

        bcrypt.hash(this.password, salt, (err, hash) => {
            if (err) {
                return next(err);
            }

            this.password = hash;
            this.updated_at = Date.now();
            next();
        });
    });
});

userSchema.methods.comparePassword = function(usersPlainPassword) {

    console.log(` DEBUG: ~ Showing this from userSchema.methods.comparePassword : ${this}`);

    return new Promise((resolve, reject) => {
        bcrypt.compare(usersPlainPassword, this.password, (err, isMatch) => {
            if (err) {
                console.log(err.message);
                return reject(err);
            }

            if (!isMatch) {
                return reject(false);
            }

            return resolve(isMatch);

        });
    });
}

mongoose.model('User', userSchema);
