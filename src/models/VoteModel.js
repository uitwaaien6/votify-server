// NODE MODULES
const mongoose = require('mongoose');

const voterSchema = mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    option: {
        type: String,
        required: true,
        default: ''
    }
});

const voteSchema = mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    client_id: {
        type: Number,
        unique: true
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
