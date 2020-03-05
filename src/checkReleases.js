const db = require('../api/mongoDB-funcs');
const releases = require('./releases');
const discordClient = require('../api/discord-properties').discordClient;

async function verifyNewReleasesCommandsChannel(idChannel){
    const isNewReleasesCommandsChannel = await db.findChannel(idChannel);
    return isNewReleasesCommandsChannel;
}

async function addArtistsToGuild(artists, cursor, msgDiscord){
    const guild = await cursor.next();
    await db.insertArtistsDB(artists, guild, msgDiscord);
}

async function removeArtistsGuild(artists, cursor){
    const guild = await cursor.next();
    await db.removeArtistsDB(artists, guild);
}

async function seeArtistsGuild(msgDiscord){
    const idPaste = await db.getPaste(msgDiscord.guild.id);
    if(idPaste === undefined){
        msgDiscord.channel.send('there are no artists registered at the moment...');
    } else {
        msgDiscord.channel.send('You can check the artist registered in this server here: ' + idPaste);
    }
}

async function sendNewReleases(){
    const cursor = await db.getAllGuilds();
    cursor.forEach(guild => {
        releases.checkNewReleases(guild).then( albums => {
            if(albums.length > 0){
                releases.createEmbeds(albums).then(messages => {
                    const channel = discordClient.channels.find(channel => channel.id === guild.idReleasesChannel);
                    releases.sendNewReleases(messages, channel);
                });
            }
        });
    })
}

exports.verifyNewReleasesCommandsChannel = verifyNewReleasesCommandsChannel;
exports.addArtistsToGuild = addArtistsToGuild;
exports.sendNewReleases = sendNewReleases;
exports.removeArtistsGuild = removeArtistsGuild;
exports.seeArtistsGuild = seeArtistsGuild;