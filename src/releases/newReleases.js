const { checkTodayRelease } = require('../../utils/utils');
const { getAlbumInfos, getLatestAlbumObjects } = require('./infoReleases');

async function getNewestReleases(artistId) {
    let newestReleases = [];
    let latestAlbumObjects = await getLatestAlbumObjects(artistId);

    if (latestAlbumObjects.length !== 0) {
        const isTodayRelease = checkTodayRelease(latestAlbumObjects[0].release_date);
        if (isTodayRelease) {
            const artistIds = latestAlbumObjects.map(album => album.artists.map(artist => artist.id));
            const albums = await getAlbumInfos(latestAlbumObjects);

            for(let i = 0; i < albums.length; i++){
                newestReleases.push({
                    artistIds: artistIds[i],
                    album: albums[i] 
                })
            }
        }
    }

    return newestReleases;
}

async function getLatestReleases(artistId) {
    const albums = await getLatestAlbumObjects(artistId);
    if (albums.length !== 0) {
        return await getAlbumInfos(albums);
    } else {
        return [];
    }
}

exports.getNewestReleases = getNewestReleases;
exports.getLatestReleases = getLatestReleases;