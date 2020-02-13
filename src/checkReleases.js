const db = require('../api/mongoDB-funcs');
const newReleases = require('./newReleases');
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
        const channel = discordClient.channels.find(channel => channel.id === guild.idReleasesChannel);
        console.log(channel);
        newReleases.createMessageNewReleases(guild.artists, channel);
    })
    await db.client.close();
}

exports.verifyNewReleasesChannel = verifyNewReleasesChannel;
exports.addArtistsToGuild = addArtistsToGuild;
exports.sendNewReleases = sendNewReleases;