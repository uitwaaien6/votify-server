// NODE MODULES
const mongoose = require('mongoose');

// CONFIG
const { DB_PASSWORD } = require('./environment');

// dbConnection
const mongoURL = `mongodb+srv://admin:${DB_PASSWORD}@cluster0.gxk6o.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;

mongoose.connect(mongoURL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true
});

mongoose.connection.on('connected', () => console.log(`Connected to MongoDB Instance`));
mongoose.connection.on('error', () => console.log(`Error Connecting to MongoDB Instance`));

