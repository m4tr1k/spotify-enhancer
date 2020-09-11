const mongoClient = require('../../api/mongoDB-properties');

async function addGuild(idServer, idReleasesCommandsChannel){
    await mongoClient.collection('guild').insertOne({
        _id: idServer, 
        idReleasesChannels: [],
        idReleasesCommandsChannel: idReleasesCommandsChannel
    })
}

exports.addGuild = addGuild;