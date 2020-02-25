const db = require('../api/mongoDB-funcs');
const releases = require('./releases');
const discordClient = require('../api/discord-properties').discordClient;

async function verifyNewReleasesChannel(idChannel){
    const isNewReleasesChannel = await db.findChannel(idChannel);
    return isNewReleasesChannel;
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
    let message = 'Artists registered on this server:\n';
    const guild = await cursor.next();
    const channel = discordClient.channels.find(channel => channel.id === guild.idReleasesChannel);
    const artists = guild.artists.map(artist => artist.nameArtist);
    if(artists.length === 0){
        message += '*there are no artists registered at the moment...*';
    } else {
        message += '```' + artists.join('\n') + '```';
    }
    channel.send(message);
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

exports.verifyNewReleasesChannel = verifyNewReleasesChannel;
exports.addArtistsToGuild = addArtistsToGuild;
exports.sendNewReleases = sendNewReleases;
exports.removeArtistsGuild = removeArtistsGuild;
exports.seeArtistsGuild = seeArtistsGuild;