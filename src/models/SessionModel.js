
// NODE MODULES
const mongoose = require('mongoose');

// CONFIG
const times = require('../../_config/times');

const sessionSchema = mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    uuid: {
        type: String,
        required: true,
        unique: true
    },
    created_at: {
        type: Date,
        default: Date.now()
    },
    updated_at: {
        type: Date,
        default: Date.now()
    },
    expires_at: {
        type: Date,
        default: (Date.now() + times.ONE_HOUR * 3),
        required: true
    }
});

sessionSchema.pre('save', function(next) {
    try {
        this.expires_at = (Date.now() + times.ONE_HOUR * 3)
        next();
    } catch (error) {
        console.log(error.message);
    }
})

mongoose.model('Session', sessionSchema);
