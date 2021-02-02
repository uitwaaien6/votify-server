// NODE MODULES
const mongoose = require('mongoose');

// SCHEMAS
const userSchema = require('./UserModel');

const voteSchema = mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    title: {
        type: String,
        required: true,
        default: ''
    },
    options: {
        type: Array,
        default: [],
        required: true
    },
    votes: {
        type: Array,
        default: []
    },
    voters: {
        type: [userSchema],
        ref: 'User'
    },
    active: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now()
    },
    updated_at: {
        type: Date,
        default: Date.now()
    }
});

mongoose.model('Vote', voteSchema);
