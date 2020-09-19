const axios = require('axios');
const spotify = require('../api/spotify-properties');
const { getArtistsReleasesChannels } = require('../database/artist/getArtists');
const { checkTodayRelease, sleep } = require('../utils/utils');
const { sendReleaseChannels } = require('../src/releases/sendReleases');
const Album = require('./components/Album');

async function getFullAlbumDetails(href) {
    let result;
    try {
        result = await axios.get(href, spotify.getAuthOptions());
    } catch (err) {
        await sleep(err.response.headers['retry-after'] * 1000);
        return;
    }

    const fullAlbumDetails = result.data;
    return fullAlbumDetails;
}

function getAuthors(album) {
    const albumArtists = album.artists.filter(artist => {
        if (!album.name.includes(artist.name)) {
            return artist.name
        }
    }).map(artist => artist.name);
    var authors = '';
    if (albumArtists.length !== 0) {
        for (var i = 0; i < albumArtists.length - 1; i++) {
            authors += albumArtists[i] + ' & ';
        }
        authors += albumArtists[albumArtists.length - 1];
    } else {
        for (var i = 0; i < album.artists.length - 1; i++) {
            authors += album.artists[i].name + ' & ';
        }
        authors += album.artists[album.artists.length - 1].name;
    }

    return authors;
}

function getFeaturedArtists(fullAlbumDetails, artists) {
    const trackArtists = fullAlbumDetails.tracks.items[0].artists.filter(artist => {
        if (!artists.includes(artist.name) && !fullAlbumDetails.name.includes(artist.name)) {
            return artist.name
        }
    }).map(artist => artist.name);

    let featuredArtists = '';
    if (trackArtists.length > 0) {
        featuredArtists = '(ft. ';
        for (var i = 0; i < trackArtists.length - 1; i++) {
            featuredArtists += trackArtists[i] + ' & ';
        }
        featuredArtists += trackArtists[trackArtists.length - 1] + ')';
    }

    return featuredArtists;
}

function getTracklist(fullAlbumDetails, titleArtists, title) {
    let tracklist = '';
    const tracks = fullAlbumDetails.tracks.items;

    for (var i = 0; i < tracks.length; i++) {
        tracklist += (i + 1) + '. ' + tracks[i].name;
        if (tracks[i].artists.length > 1 && !tracks[i].name.toLowerCase().includes('remix')) {
            const artistNames = tracks[i].artists.filter(artist => {
                if (!titleArtists.includes(artist.name) && !title.includes(artist.name)) {
                    return artist.name
                }
            }).map(artist => artist.name);
            if (artistNames.length !== 0) {
                tracklist += ' (w/ ';
                for (var j = 1; j < artistNames.length - 1; j++) {
                    tracklist += artistNames[j] + ' & ';
                }
                tracklist += artistNames[artistNames.length - 1] + ')';
            }
        }
        tracklist += '\n';
    }

    return tracklist;
}

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

async function getAlbumInfos(albums) {
    let latestReleases = [];
    for (var i = 0; i < albums.length; i++) {
        let fullAlbumDetails = await getFullAlbumDetails(albums[i].href);

        while (fullAlbumDetails === undefined) {
            fullAlbumDetails = await getFullAlbumDetails(albums[i].href);
        }

        const artists = getAuthors(albums[i]);
        const nameAlbum = albums[i].name;

        if (!latestReleases.some(release => release.nameAlbum.toLowerCase().includes(nameAlbum.toLowerCase()))) {
            let link;
            let tracklist;
            let featuredArtists;
            let album;

            if (fullAlbumDetails.total_tracks > 1) {
                const title = artists + '\n' + nameAlbum;
                tracklist = getTracklist(fullAlbumDetails, artists, title);
                link = albums[i].external_urls.spotify;
                album = new Album({
                    nameAlbum: nameAlbum,
                    artists: artists,
                    featArtists: '',
                    label: fullAlbumDetails.label,
                    releaseDate: albums[i].release_date,
                    tracklist: tracklist,
                    coverArt: fullAlbumDetails.images[0].url,
                    spotifyLink: link
                })
            } else {
                featuredArtists = getFeaturedArtists(fullAlbumDetails, artists);
                link = fullAlbumDetails.tracks.items[0].external_urls.spotify;
                album = new Album({
                    nameAlbum: nameAlbum,
                    artists: artists,
                    featArtists: featuredArtists,
                    label: fullAlbumDetails.label,
                    releaseDate: albums[i].release_date,
                    tracklist: '',
                    coverArt: fullAlbumDetails.images[0].url,
                    spotifyLink: link
                })
            }

            latestReleases.push(album);
        }
    }

    return latestReleases;
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

async function sendNewReleases(newestRelease, idReleasesChannels) {
    if(newestRelease.artistIds.length > 1){
        const releasesChannelsCursor = getArtistsReleasesChannels(newestRelease.artistIds);
        const releasesChannels = await releasesChannelsCursor.next();

        if (releasesChannels.idChannels.length !== 0) {
            for (let i = 0; i < releasesChannels.idChannels.length; i++) {
                if (!idReleasesChannels.includes(releasesChannels.idChannels[i])) {
                    idReleasesChannels.push(releasesChannels.idChannels[i]);
                }
            }
        }
    }

    sendReleaseChannels(newestRelease.album, idReleasesChannels);
}

exports.getNewestReleases = getNewestReleases;
exports.sendNewReleases = sendNewReleases;
exports.getLatestReleases = getLatestReleases;