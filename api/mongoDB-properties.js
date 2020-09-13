const mongoose = require('mongoose');
const {dbURL} = require('../config.json');

async function newConnection(){
    await mongoose.connect(dbURL, {useNewUrlParser: true, useUnifiedTopology: true});
}

newConnection();
module.exports = mongoose.connection;