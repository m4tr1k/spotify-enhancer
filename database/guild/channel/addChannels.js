const mongoClient = require('../../../api/mongoDB-properties');

async function addChannel(channelID, guildID) {
    await mongoClient.collection('guild').updateOne(
        { _id: guildID },
        { $push: { idReleasesChannels: channelID } }
    )
}

exports.addChannel = addChannel;