const mongoClient = require('../../api/mongoDB-properties');

async function removeArtistGuild(artistName, idReleasesChannels){
    const document = await mongoClient.collection('artist').updateOne(
        { nameArtist_lowerCase: artistName.toLowerCase(), idGuildChannels: { $in: idReleasesChannels } },
        { $pull: { idGuildChannels: { $in: idReleasesChannels } } }
    )

    return document.result.nModified !== 0;
}

async function removeAllArtistsChannels(idReleasesChannels){
    await mongoClient.collection('artist').updateMany(
        { idGuildChannels: { $in: idReleasesChannels } },
        { $pull: { idGuildChannels: { $in: idReleasesChannels } } }
    )
}

exports.removeArtistGuild = removeArtistGuild;
exports.removeAllArtistsChannels = removeAllArtistsChannels;