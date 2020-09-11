const { addReleasesChannel, removeReleasesChannel } = require('../database/guild/guildHandler')
const { releasesChannels } = require('../api/discord-properties');

async function addChannel(msgDiscord) {
    const hasPermission = msgDiscord.member.roles.cache.some(role => role.name === 'New Releases Manager');

    if (hasPermission) {
        let idReleasesChannels = releasesChannels.get(msgDiscord.guild.id);

        if (!idReleasesChannels.includes(msgDiscord.channel.id)) {
            if (idReleasesChannels.length < 10) {
                idReleasesChannels.push(msgDiscord.channel.id);
                Promise.all([
                    addReleasesChannel(msgDiscord.channel.id, msgDiscord.guild.id),
                    releasesChannels.set(msgDiscord.guild.id, idReleasesChannels)
                ])
                msgDiscord.channel.send("Channel added successfully!");
            } else {
                msgDiscord.channel.send("It's not possible to add more than 10 seperated releases channels!");
            }
        } else {
            msgDiscord.channel.send("This channel is already registered!");
        }
    } else {
        msgDiscord.reply("You don't have permission to add channels!")
    }
}

async function removeChannel(msgDiscord) {
    const hasPermission = msgDiscord.member.roles.cache.some(role => role.name === 'New Releases Manager');

    if (hasPermission) {
        let idReleasesChannels = releasesChannels.get(msgDiscord.guild.id);

        if (idReleasesChannels.includes(msgDiscord.channel.id)) {
            const index = idReleasesChannels.indexOf(msgDiscord.channel.id);
            idReleasesChannels.splice(index, 1);
            Promise.all([
                removeReleasesChannel(msgDiscord.channel.id, msgDiscord.guild.id),
                releasesChannels.set(msgDiscord.guild.id, idReleasesChannels)
            ]);
            msgDiscord.channel.send("Channel deleted successfully!");
        } else {
            msgDiscord.channel.send("This channel is not registered!");
        }
    } else {
        msgDiscord.reply("You don't have permission to remove channels!")
    }
}

async function channelDelete(channel) {
    let idReleasesChannels = releasesChannels.get(channel.guild.id);

    if (idReleasesChannels.includes(channel.id)) {
        removeReleasesChannel(channel.id, channel.guild.id);
    }
}

exports.addChannel = addChannel;
exports.removeChannel = removeChannel;
exports.channelDelete = channelDelete;