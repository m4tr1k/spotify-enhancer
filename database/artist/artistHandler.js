const { insertArtistsDB, updateArtistsDB, registerArtistChannel } = require('./addArtists');
const { removeArtistGuild, removeAllArtistsChannels } = require('./removeArtists');
const { getRegisteredArtistsDB, getRegisteredArtists, getAllRegisteredArtists, getArtistsReleasesChannels } = require('./getArtists');
const { removeOldReleases, updateNewReleases } = require('./releasesHandler');

function getAllArtists(){
    return getAllRegisteredArtists();
}

function getArtistsRegisteredReleasesChannels(artistIds){
    return getArtistsReleasesChannels(artistIds);
}

async function updateNewReleasesArtist(newestReleases, oldReleases, artistID){
    const currentDate = new Date();
    currentDate.setHours(0,0,0,0);

    oldReleases = oldReleases.map(release => {
        const releaseDate = new Date(release.releaseDate);
        if(releaseDate < currentDate){
            return release;
        }
    })

    if(oldReleases.length !== 0){
        await removeOldReleases(oldReleases, artistID);
    }

    for(const newestRelease of newestReleases){
        updateNewReleases(newestRelease)
    }
}

async function addArtists(artists, idReleasesChannel) {
    //Artists that are registered in the database and on a certain guild
    const idArtists = artists.map(artist => artist.artistId);
    const registeredArtistsGuildCursor = getRegisteredArtists(idArtists, idReleasesChannel);

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

async function removeAllArtists(idReleasesChannels){
    await removeAllArtistsChannels(idReleasesChannels);
}

async function moveArtists(artistName, idReleasesChannels, futureIdReleasesChannel){
    const wasRemoved = await removeArtistGuild(artistName, idReleasesChannels);
    if(wasRemoved){
        await registerArtistChannel(artistName, futureIdReleasesChannel);
        return true;
    } else {
        return false;
    }
}

exports.getAllArtists = getAllArtists;
exports.getArtistsRegisteredReleasesChannels = getArtistsRegisteredReleasesChannels;
exports.updateNewReleasesArtist = updateNewReleasesArtist;
exports.addArtists = addArtists;
exports.removeArtists = removeArtists;
exports.removeAllArtists = removeAllArtists;
exports.moveArtists = moveArtists;