const { getAllGuilds } = require('./getGuilds');
const { removeAllArtistsChannels } = require('../artist/removeArtists')
const { addGuild } = require('./addGuilds');
const { removeUnregisteredGuilds, removeGuild } = require('./removeGuilds');
const { removeUnregisteredChannels } = require('./channel/removeChannels');
const { addChannel } = require('./channel/addChannels');
const { removeChannel } = require('./channel/removeChannels');

function getGuildsInfo() {
    return getAllGuilds();
}

async function addGuildDB(guildID, releasesCommandsChannelID){
    await addGuild(guildID, releasesCommandsChannelID);
}

async function removeGuildsDB(guilds) {
    let idReleasesChannels = [].concat(...guilds.map(guild => guild.idReleasesChannels));

    if (idReleasesChannels.length > 0) {
        await removeAllArtistsChannels(idReleasesChannels)
    }

    let idGuilds = guilds.map(guild => guild._id);

    await removeUnregisteredGuilds(idGuilds);
}

async function removeGuildDB(guildID, channelIDs){
    Promise.all([
        removeGuild(guildID),
        removeAllArtistsChannels(channelIDs)
    ])
}

async function removeReleasesChannels(channelIDs, guildID) {
    Promise.all([
        removeUnregisteredChannels(guildID, channelIDs),
        removeAllArtistsChannels(channelIDs)
    ])
}

async function removeReleasesChannel(channelID, guildID) {
    Promise.all([
        removeChannel(channelID, guildID),
        removeAllArtistsChannels([channelID])
    ])
}

async function addReleasesChannel(channelID, guildID){
    await addChannel(channelID, guildID);
}

exports.addGuildDB = addGuildDB;
exports.removeGuildDB = removeGuildDB;
exports.removeReleasesChannels = removeReleasesChannels;
exports.removeReleasesChannel = removeReleasesChannel;
exports.removeGuildsDB = removeGuildsDB;
exports.getGuildsInfo = getGuildsInfo;
exports.addReleasesChannel = addReleasesChannel;

