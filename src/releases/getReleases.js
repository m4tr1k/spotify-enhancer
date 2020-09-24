const spotify = require('../../api/spotify-properties');
const { sleep } = require('../../utils/utils');
const { getAlbumInfos } = require('./infoReleases');

async function getReleases(albumIds){
    let albums;
    try {
        albums = await spotify.client.getAlbums(albumIds);
    } catch (err) {
        await sleep(err.headers['retry-after'] * 1000);
        return await getReleases(albumIds);
    }

    return await getAlbumInfos(albums.body.albums);
}

exports.getReleases = getReleases;