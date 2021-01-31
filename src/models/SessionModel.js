const mongoose = require('mongoose');

const sessionSchema = mongoose.Schema({
    uuid: {
        type: String,
        required: true,
        unique: true
    },
    expires_at: {
        type: String,
        required: true
    }
});

mongoose.model('Session', sessionSchema);
