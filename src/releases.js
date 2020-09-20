const spotify = require('../api/spotify-properties');
const { checkTodayRelease, sleep } = require('../utils/utils');
const getAlbumInfos = require('./releases/infoReleases');

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

async function getLatestAlbumObjects(artistId) {
    let latestReleases = [];
    let dataAlbums;
    try {
        dataAlbums = await spotify.client.getArtistAlbums(artistId, { offset: 0, include_groups: 'album,single' })
    } catch (err) {
        await sleep(err.headers['retry-after'] * 1000);
        return getLatestAlbumObjects(artistId);
    }

    if (dataAlbums.body.items.length !== 0) {
        dataAlbums.body.items.sort((a, b) => a.release_date.localeCompare(b.release_date));
        dataAlbums.body.items.reverse();

        let count = 0;

        while (dataAlbums.body.items[count].album_type === 'compilation') {
            count++;
        }

        latestReleases.push(dataAlbums.body.items[count]);

        let existsMoreLatestReleases = true;
        let countAux = count + 1;

        while (existsMoreLatestReleases && dataAlbums.body.items[countAux] !== undefined) {
            if (dataAlbums.body.items[countAux].release_date === dataAlbums.body.items[count].release_date) {
                latestReleases.push(dataAlbums.body.items[countAux]);
                countAux++;
            } else {
                existsMoreLatestReleases = false;
            }
        }
    } else {
        return [];
    }

    return latestReleases;
}

exports.getNewestReleases = getNewestReleases;
exports.getLatestReleases = getLatestReleases;