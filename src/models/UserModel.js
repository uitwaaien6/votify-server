
// NODE MODULES
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// ROLES
const roles = require('../../_config/roles');

const voteSchema = mongoose.Schema({
    vote_id: {
        type: mongoose.Schema.Types.ObjectId
    },
    is_voted: {
        type: Boolean,
        default: false
    }
});

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
        default: null
    },
    active: {
        type: Boolean,
        default: false
    },
    role: {
        type: String,
        enum: [roles.ADMIN, roles.EXECUTIVE, roles.USER],
        default: roles.USER
    },
    is_admin: {
        type: Boolean,
        default: false
    },
    votes: {
        type: [voteSchema]
    },
    permission: {
        type: Number,
        default: roles.PERMISSION_3
    }
}, { timestamps: true });


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

    return new Promise((resolve, reject) => {
        bcrypt.compare(usersPlainPassword, this.password, (err, isMatch) => {
            if (err) {
                console.log(err.message);
                return reject(err);
            }

            if (!isMatch) {
                return resolve(isMatch);
            }

            return resolve(isMatch);

        });
    });
}

module.exports = userSchema;

mongoose.model('User', userSchema);
