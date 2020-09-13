const mongoClient = require('../../api/mongoDB-properties');

function getAllGuilds(){
    const cursor = mongoClient.collection('guild').find();
    return cursor;
}

exports.getAllGuilds = getAllGuilds;