const mongoClient = require('../../api/mongoDB-properties');

/**
 * Return cursor with all the artists registered in the database
 * 
 * Used to check which artists have new releases after
 */

function getAllRegisteredArtists(){
    return mongoClient.collection('artist').find();
}

/**
    Returns object with an array of the artists that:
    - Are registered in the database 
    - Are registered on a certain guild (channel)
*/

function getRegisteredArtists(artistIds, idReleasesChannel) {
    return mongoClient.collection('artist').aggregate([
        { $match: { _id: { $in: artistIds }, idGuildChannels: idReleasesChannel } },
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
    Returns object with an array of the artists that:
    - Are registered in the database 
    - Are registered on a certain guild
*/

function getRegisteredArtistsGuild(idReleasesChannels) {
    return mongoClient.collection('artist').aggregate([
        { $match: { idGuildChannels: { $in: idReleasesChannels } } },
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
    Returns object with an array of the artists that:
    - Are registered in the database 
    - Are registered on a certain channel
*/

function getRegisteredArtistsChannel(idReleasesChannel) {
    return mongoClient.collection('artist').aggregate([
        { $match: { idGuildChannels: idReleasesChannel } },
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

/**
 * Returns all the registered releases channels that are assigned to the desired artists
 * 
 * @param {[]} artistIds Ids of the artists
 */

function getArtistsReleasesChannels(artistIds){
    return mongoClient.collection('artist').aggregate([
        { $match: { _id: { $in: artistIds } } },
        { $unwind: "$idGuildChannels" },
        {
            $group: {
                _id: null,
                idChannels: { $addToSet: "$idGuildChannels" },
            }
        },
        {
            $project: {
                _id: 0,
                idChannels: 1
            }
        }
    ])
}

exports.getAllRegisteredArtists = getAllRegisteredArtists;
exports.getRegisteredArtists = getRegisteredArtists;
exports.getRegisteredArtistsGuild = getRegisteredArtistsGuild;
exports.getRegisteredArtistsChannel = getRegisteredArtistsChannel;
exports.getRegisteredArtistsDB = getRegisteredArtistsDB;
exports.getArtistsReleasesChannels = getArtistsReleasesChannels;
