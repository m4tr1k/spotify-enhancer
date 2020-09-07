const releases = require('./releases');

async function removeArtistsGuild(artists, idReleasesChannels, msgDiscord){
    await db.removeArtistsDB(artists, idReleasesChannels, msgDiscord);
}

async function sendNewReleases(){
    let newReleases = [];
    const cursor = await db.getAllArtists();
    cursor.forEach(artist => {
        releases.checkNewReleases(artist).then(albums => {
            for(var i = 0; i < albums.length; i++){
                if(!newReleases.includes(albums[i].spotifyLink) && !artist.latestReleases.some(release => {
                    return release.spotifyLink === albums[i].spotifyLink;
                })){
                    newReleases.push(albums[i].spotifyLink);
                    Promise.all([releases.sendNewReleases(albums[i], artist.idGuildChannels), db.updateNewReleases(albums[i])])
                }
            }
        })
    })
}

exports.sendNewReleases = sendNewReleases;
exports.removeArtistsGuild = removeArtistsGuild;