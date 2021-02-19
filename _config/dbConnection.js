// NODE MODULES
const mongoose = require('mongoose');

// CONFIG
const { DB_PASSWORD } = require('./environment');

// dbConnection
const mongoURI = `mongodb+srv://admin:${DB_PASSWORD}@cluster0.gxk6o.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;

mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true
});

mongoose.connection.on('connected', () => console.log(`Connected to MongoDB Instance`));
mongoose.connection.on('error', () => console.log(`Error Connectiong to MongoDB Instance`));

