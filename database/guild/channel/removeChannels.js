const mongoClient = require('../../../api/mongoDB-properties');

async function removeUnregisteredChannels(guildID, channelIDs){
    await mongoClient.collection('guild').updateOne(
        { _id: guildID },
        { $pull: { idReleasesChannels: { $in: channelIDs } } }
    )
}

async function removeChannel(channelID, guildID){
    await mongoClient.collection('guild').updateOne(
        { _id: guildID },
        { $pull: { idReleasesChannels: channelID } }
    )
}

exports.removeUnregisteredChannels = removeUnregisteredChannels;
exports.removeChannel = removeChannel;