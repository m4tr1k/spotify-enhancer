const { insertArtistsDB, updateArtistsDB } = require('./addArtists');
const { removeArtistGuild } = require('./removeArtists');
const { getRegisteredArtistsDB, getRegisteredArtistsGuild } = require('./getArtists');

async function addArtists(artists, idReleasesChannel) {
    //Artists that are registered in the database and on a certain guild
    const registeredArtistsGuildCursor = getRegisteredArtistsGuild(artists, idReleasesChannel);

    const registeredArtistsGuild = await registeredArtistsGuildCursor.next();
    let unregisteredArtists, unregisteredArtistsNames = [];

    if (registeredArtistsGuild === null) {
        unregisteredArtists = artists;
    } else {
        unregisteredArtists = artists.filter(artist => {
            if (!registeredArtistsGuild.artistNames.includes(artist.artistName)) {
                return artist;
            }
        });
    }

    if (unregisteredArtists.length > 0) {
        //Save the unregistered artists names and ids in seperate arrays
        unregisteredArtistsNames = unregisteredArtists.map(artist => artist.artistName);
        const unregisteredArtistsIds = unregisteredArtists.map(artist => artist.artistId);

        //Artists that are registered in the database but not on a certain guild
        const registeredArtistsDBCursor = getRegisteredArtistsDB(unregisteredArtistsIds);

        const registeredArtistsDB = await registeredArtistsDBCursor.next();

        if (registeredArtistsDB !== null) {
            await updateArtistsDB(registeredArtistsDB, idReleasesChannel);
            unregisteredArtists = unregisteredArtists.filter(artist => {
                if (!registeredArtistsDB.artistIds.includes(artist.artistId)) {
                    return artist;
                }
            })
        }

        if (unregisteredArtists.length > 0) {
            await insertArtistsDB(unregisteredArtists, idReleasesChannel);
        }
    }

    return unregisteredArtistsNames;
}

async function removeArtists(artistNames, idReleasesChannels) {
    let removedArtists = [];
    for (const artistName of artistNames) {
        const wasRemoved = await removeArtistGuild(artistName, idReleasesChannels);

        if(wasRemoved){
            removedArtists.push(artistName);
        }
    }

    return removedArtists;
}

exports.addArtists = addArtists;
exports.removeArtists = removeArtists;