const mongoClient = require('../../api/mongoDB-properties');

async function removeUnregisteredGuilds(idGuilds){
    await mongoClient.collection('guild').deleteMany({
        _id: {$in: idGuilds}
    })
}

async function removeGuild(idGuild){
    await mongoClient.collection('guild').deleteOne({
        _id: idGuild
    })
}

exports.removeUnregisteredGuilds = removeUnregisteredGuilds;
exports.removeGuild = removeGuild;