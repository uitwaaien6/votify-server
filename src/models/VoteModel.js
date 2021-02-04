// NODE MODULES
const mongoose = require('mongoose');

const voterSchema = mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    user_name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    option: {
        type: String,
        required: true,
        default: ''
    },
    is_voted: {
        type: Boolean,
        default: false
    }
});

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
        type: Object,
        default: {}
    },
    voters: {
        type: [voterSchema],
        ref: 'User'
    },
    active: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

mongoose.model('Vote', voteSchema);
