const db = require('../api/mongoDB-funcs');
const releases = require('./releases');

async function verifyNewReleasesCommandsChannel(idChannel){
    const isNewReleasesCommandsChannel = await db.findChannel(idChannel);
    return isNewReleasesCommandsChannel;
}

async function addArtistsToGuild(artists, idReleasesChannel, msgDiscord){
    await db.insertArtistsDB(artists, idReleasesChannel, msgDiscord);
}

async function removeArtistsGuild(artists, cursor, msgDiscord){
    const guild = await cursor.next();
    await db.removeArtistsDB(artists, guild.idReleasesChannels, msgDiscord);
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

exports.verifyNewReleasesCommandsChannel = verifyNewReleasesCommandsChannel;
exports.addArtistsToGuild = addArtistsToGuild;
exports.sendNewReleases = sendNewReleases;
exports.removeArtistsGuild = removeArtistsGuild;