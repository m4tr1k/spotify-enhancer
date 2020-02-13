const db = require('../api/mongoDB-funcs');
const releases = require('./releases');
const discordClient = require('../api/discord-properties').discordClient;

async function verifyNewReleasesChannel(idChannel){
    const isNewReleasesChannel = await db.findChannel(idChannel);
    return isNewReleasesChannel;
}

async function addArtistsToGuild(artistsIds, cursor){
    const guild = await cursor.next();
    await db.insertArtistsDB(artistsIds, guild._id);
    await db.client.close();
}

async function sendNewReleases(){
    const cursor = await db.getAllGuilds();
    cursor.forEach(guild => {
        releases.checkNewReleases(guild.artists).then( messages => {
            if(messages.length > 0){
                const channel = discordClient.channels.find(channel => channel.id === guild.idReleasesChannel);
                releases.sendNewReleases(messages, channel);
            }
        });
    })
    await db.client.close();
}

exports.verifyNewReleasesChannel = verifyNewReleasesChannel;
exports.addArtistsToGuild = addArtistsToGuild;
exports.sendNewReleases = sendNewReleases;