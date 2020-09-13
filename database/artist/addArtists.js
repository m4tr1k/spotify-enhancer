const mongoClient = require('../../api/mongoDB-properties');
const Artist = require('../../src/components/Artist');
const { getLatestReleases, createEmbeds } = require('../../src/releases');
const { checkTodayRelease } = require('../../utils/utils');

async function insertArtistsDB(artists, idReleasesChannel) {
    const arrayArtistsObjects = await createArrayArtistsObjects(artists, idReleasesChannel);

    await mongoClient.collection('artist').insertMany(arrayArtistsObjects);
}

async function updateArtistsDB(artists, idReleasesChannel){
    const todayReleases = artists.latestReleases.filter(latestRelease => {
        return checkTodayRelease(latestRelease.releaseDate);
    })

    Promise.all([
        mongoClient.collection('artist').updateMany(
            { _id: { $in: artists.artistIds } },
            { $push: { idGuildChannels: idReleasesChannel } }
        ),
        createEmbeds(todayReleases, [idReleasesChannel])
    ])
}

/**
 * Register a given artist on a certain releases channel
 * 
 * Function only used to move artists from different channels
 * @param {string} nameArtist Name of the artist
 * @param {string} idReleasesChannel Id of the channel to register the given artist
 */

async function registerArtistChannel(nameArtist, idReleasesChannel){
    await mongoClient.collection('artist').updateOne(
        {nameArtist_lowerCase: nameArtist},
        {$push: {idGuildChannels: idReleasesChannel}}
    )
}

/**
 * Creates an array of artist objects to be inserted in the database.
 * 
 * Also gives orders to print the latest releases if they were released in that current day.
 * @param {[]} artists Info of the unregistered artists
 * @param idReleasesChannel Id of the releases channel
 * @returns Array of Artist Objects
 */

async function createArrayArtistsObjects(artists, idReleasesChannel) {
    let arrayArtists = [];
    let latestReleasesToday = [];

    for (const artist of artists) {
        const latestReleases = await getLatestReleases(artist.artistId);

        latestReleases.forEach(release => {
            const isReleasedToday = checkTodayRelease(release.releaseDate);

            if (isReleasedToday) {
                let containRelease = latestReleasesToday.some(lrelease => {
                    return release.spotifyLink === lrelease.spotifyLink
                })
                if(!containRelease){
                    latestReleasesToday.push(release);
                }
            }
        })

        arrayArtists.push(new Artist({
            id: artist.artistId,
            nameArtist: artist.artistName,
            latestReleases: latestReleases,
            idReleasesChannel: idReleasesChannel
        }))
    }

    if (latestReleasesToday.length !== 0) {
        createEmbeds(latestReleasesToday, [idReleasesChannel]);
    }

    return arrayArtists;
}

exports.insertArtistsDB = insertArtistsDB;
exports.updateArtistsDB = updateArtistsDB;
exports.registerArtistChannel = registerArtistChannel;