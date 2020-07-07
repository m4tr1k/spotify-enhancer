const db = require('../api/mongoDB-funcs');

async function addChannel(msgDiscord) {
    const hasPermission = msgDiscord.member.roles.cache.some(role => role.name === 'New Releases Manager');

    if(hasPermission){
        const numberReleasesChannels = await db.numberReleasesChannels(msgDiscord.guild.id);

        if(numberReleasesChannels < 10){
            const channelAdded = await db.addReleasesChannel(msgDiscord.channel.id, msgDiscord.guild.id);
            if(channelAdded){
                msgDiscord.channel.send("Channel added successfully!");
            } else {
                msgDiscord.channel.send("This channel is already registered!");
            }
        } else {
            msgDiscord.channel.send("It's not possible to add more than 10 seperated releases channels!");
        }
    } else {
        msgDiscord.reply("You don't have permission to add channels!")
    }
}

async function removeChannel(msgDiscord){
    const hasPermission = msgDiscord.member.roles.cache.some(role => role.name === 'New Releases Manager');

    if(hasPermission){
        const channelRemoved = await db.removeReleasesChannel(msgDiscord.channel.id, msgDiscord.guild.id);
        if(channelRemoved){
            await db.deleteAllArtistsReleasesChannel(msgDiscord.channel.id);
            msgDiscord.channel.send("Channel deleted successfully!");
        } else {
            msgDiscord.channel.send("This channel is not registered!");
        }
    } else {
        msgDiscord.reply("You don't have permission to remove channels!")
    }
}

async function channelDelete(channel){
    const channelRemoved = await db.removeReleasesChannel(channel.id);
    if(channelRemoved){
        db.deleteAllArtistsReleasesChannel(channel.id);
    }
}


exports.addChannel = addChannel;
exports.removeChannel = removeChannel;
exports.channelDelete = channelDelete;