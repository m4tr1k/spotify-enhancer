const db = require('../api/mongoDB-funcs');
const releases = require('./releases');
const discordClient = require('../api/discord-properties').discordClient;
const pastebin = require('../api/pastebin-properties');

async function verifyNewReleasesCommandsChannel(idChannel){
    const isNewReleasesCommandsChannel = await db.findChannel(idChannel);
    return isNewReleasesCommandsChannel;
}

async function addArtistsToGuild(artists, cursor){
    const guild = await cursor.next();
    await db.insertArtistsDB(artists, guild._id);
}

async function removeArtistsGuild(artists, cursor){
    const guild = await cursor.next();
    await db.removeArtistsDB(artists, guild._id);
}

async function seeArtistsGuild(cursor){
    let message = '';
    const guild = await cursor.next();
    const channel = discordClient.channels.find(channel => channel.id === guild.idReleasesCommandsChannel);
    const artists = guild.artists.map(artist => artist.nameArtist);
    if(artists.length === 0){
        message += 'there are no artists registered at the moment...';
    } else {
        message += artists.join('\n');
    }
    pastebin.editPaste(message, guild, channel);
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