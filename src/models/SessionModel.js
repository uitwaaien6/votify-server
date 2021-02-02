
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
    },
    createdAt: {
        type: Date,
        expires: times.ONE_HOUR_IN_SECONDS * 3
    }
});

sessionSchema.pre('save', function(next) {
    try {
        this.updatedAt = Date.now();
        next();
    } catch (error) {
        console.log(error.message);
    }
});

mongoose.model('Session', sessionSchema);
