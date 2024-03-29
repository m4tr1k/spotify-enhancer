const { getNewestReleases } = require('./releases/newReleases');
const { sendReleaseChannels } = require('../src/releases/sendReleases')
const { getAllArtists, updateNewReleasesArtist } = require('../database/artist/artistHandler');

async function checkNewReleases() {
    let printedReleases = [];
    const allArtistsCursor = getAllArtists();

    await allArtistsCursor.forEach(artist => {
        getNewestReleases(artist._id).then(newestReleases => {
            let newReleases = [];
            for (var i = 0; i < newestReleases.length; i++) {
                if(!artist.latestReleases.some(release => {
                    return release.spotifyLink === newestReleases[i].album.spotifyLink;
                })) {
                    newReleases.push(newestReleases[i]);
                    if (!printedReleases.includes(newestReleases[i].album.spotifyLink)) {
                        printedReleases.push(newestReleases[i].album.spotifyLink);
                        sendReleaseChannels(newestReleases[i]);
                    }
                }
            }

            if (newReleases.length > 0) {
                updateNewReleasesArtist(newReleases, artist.latestReleases, artist._id);
            }
        })
    })
}

module.exports = checkNewReleases;