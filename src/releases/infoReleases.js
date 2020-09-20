const axios = require('axios');
const spotify = require('../../api/spotify-properties');
const Album = require('../components/Album');
const { sleep } = require('../../utils/utils');

async function getFullAlbumDetails(href) {
    let result;
    try {
        result = await axios.get(href, spotify.getAuthOptions());
    } catch (err) {
        await sleep(err.response.headers['retry-after'] * 1000);
        return await getFullAlbumDetails(href);
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

async function getAlbumInfos(albums) {
    let latestReleases = [];
    for (var i = 0; i < albums.length; i++) {
        const artists = getAuthors(albums[i]);
        const nameAlbum = albums[i].name;

        if (!latestReleases.some(release => release.nameAlbum.toLowerCase().includes(nameAlbum.toLowerCase()))) {
            let fullAlbumDetails = await getFullAlbumDetails(albums[i].href);
            let link, tracklist = '', featuredArtists = '';

            if (fullAlbumDetails.total_tracks > 1) {
                const title = artists + '\n' + nameAlbum;
                tracklist = getTracklist(fullAlbumDetails, artists, title);
                link = albums[i].external_urls.spotify;
            } else {
                featuredArtists = getFeaturedArtists(fullAlbumDetails, artists);
                link = fullAlbumDetails.tracks.items[0].external_urls.spotify;
            }

            latestReleases.push(
                new Album({
                    nameAlbum: nameAlbum,
                    artists: artists,
                    featArtists: featuredArtists,
                    label: fullAlbumDetails.label,
                    releaseDate: albums[i].release_date,
                    tracklist: tracklist,
                    coverArt: fullAlbumDetails.images[0].url,
                    spotifyLink: link
                })
            );
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

exports.getAlbumInfos = getAlbumInfos;
exports.getLatestAlbumObjects = getLatestAlbumObjects;