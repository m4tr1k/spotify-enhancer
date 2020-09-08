const mongoClient = require('../../api/mongoDB-properties');

/**
    Returns object with an array of the artists that:
    - Are registered in the database 
    - Are registered on a certain guild
*/

function getRegisteredArtistsGuild(artists, idReleasesChannel) {
    const idArtists = artists.map(artist => artist.artistId);

    return mongoClient.collection('artist').aggregate([
        { $match: { _id: { $in: idArtists }, idGuildChannels: idReleasesChannel } },
        {
            $group: {
                _id: null,
                artistNames: { $addToSet: "$nameArtist" }
            }
        },
        {
            $project: {
                _id: 0,
                artistNames: 1
            }
        }
    ])
}

/**
    Returns object with an array of the artists (and their releases of that day) that:
    - Are registered in the database 
    - Are NOT registered on a certain guild
*/

function getRegisteredArtistsDB(artistIds) {
    return mongoClient.collection('artist').aggregate([
        { $match: { _id: { $in: artistIds } } },
        { $unwind: "$latestReleases" },
        {
            $group: {
                _id: null,
                artistIds: { $addToSet: "$_id" },
                latestReleases: { $addToSet: "$latestReleases" }
            }
        },
        {
            $project: {
                _id: 0,
                artistIds: 1,
                latestReleases: 1 
            }
        }
    ])
}

exports.getRegisteredArtistsGuild = getRegisteredArtistsGuild;
exports.getRegisteredArtistsDB = getRegisteredArtistsDB;
