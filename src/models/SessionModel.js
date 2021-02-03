
// NODE MODULES
const mongoose = require('mongoose');

// CONFIG
const times = require('../../_config/times'); // in milliseconds

const sessionSchema = mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    uuid: {
        type: String,
        required: true,
        unique: true
    }
}, { timestamps: true });

mongoose.model('Session', sessionSchema);
