const discordClient = require('../../api/discord-properties');
const ReleaseEmbed = require('../components/ReleaseEmbed');

function createEmbeds(albums) {
    let releasesEmbed = [];

    for (const album of albums) {
        const release = createEmbedAlbum(album);
        releasesEmbed.push(release);
    }

    return releasesEmbed;
}

function createEmbedAlbum(album) {
    const title = album.artists + ' ' + album.featArtists + '\n' + album.nameAlbum;

    const splitDate = album.releaseDate.split('-');
    const releaseDate = splitDate[2] + '-' + splitDate[1] + '-' + splitDate[0];

    let description = 'Label: ' + album.label + '\n' + 'Release Date: ' + releaseDate;

    if (album.tracklist !== '') {
        description += '\n\nTracklist:\n' + album.tracklist + '\n' + discordClient.emojis.cache.get('730078460747317328').toString() + ' [Spotify Link](' + album.spotifyLink + ')';
    } else {
        description += '\n\n' + discordClient.emojis.cache.get('730078460747317328').toString() + ' [Spotify Link](' + album.spotifyLink + ')';
    }

    const release = new ReleaseEmbed({
        title: title,
        description: description,
        coverArt: album.coverArt
    })

    return release;
}

exports.createEmbeds = createEmbeds;
exports.createEmbedAlbum = createEmbedAlbum;