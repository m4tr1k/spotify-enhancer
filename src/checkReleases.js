const db = require('../api/mongoDB-funcs');
const releases = require('./releases');

async function verifyNewReleasesCommandsChannel(idChannel){
    const isNewReleasesCommandsChannel = await db.findChannel(idChannel);
    return isNewReleasesCommandsChannel;
}

async function addArtistsToGuild(artists, cursor, msgDiscord){
    const guild = await cursor.next();
    await db.insertArtistsDB(artists, guild, msgDiscord);
}

async function removeArtistsGuild(artists, cursor, msgDiscord){
    const guild = await cursor.next();
    await db.removeArtistsDB(artists, guild, msgDiscord);
}

async function seeArtistsGuild(msgDiscord){
    const idPaste = await db.getPaste(msgDiscord.guild.id);
    if(idPaste === undefined){
        msgDiscord.channel.send('there are no artists registered at the moment...');
    } else {
        msgDiscord.channel.send('You can check the artists registered in this server here: ' + idPaste);
    }
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
                    releases.sendNewReleases(albums[i], artist.idGuildChannels);
                }
            }
        })
    })
}

exports.verifyNewReleasesCommandsChannel = verifyNewReleasesCommandsChannel;
exports.addArtistsToGuild = addArtistsToGuild;
exports.sendNewReleases = sendNewReleases;
exports.removeArtistsGuild = removeArtistsGuild;
exports.seeArtistsGuild = seeArtistsGuild;