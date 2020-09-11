const { releasesCommandsChannels, releasesChannels } = require('../api/discord-properties');
const { moveArtists } = require('../database/artist/artistHandler');

async function moveArtistsChannel(msgDiscord, content) {
    const isReleasesCommandsChannel = releasesCommandsChannels.some(releasesCommandsChannel => releasesCommandsChannel === msgDiscord.channel.id);
    if (isReleasesCommandsChannel) {
        if (content.length >= 2) {
            const releasesChannel = content.splice(content.length - 1, 1).join();
            const futureIdReleasesChannel = releasesChannel.substring(2, releasesChannel.length - 1);

            const idReleasesChannels = releasesChannels.get(msgDiscord.guild.id);
            if (idReleasesChannels.includes(futureIdReleasesChannel)) {
                const artistName = content.join(' ');
                const hasMoved = await moveArtists(artistName, idReleasesChannels, futureIdReleasesChannel);
                if (hasMoved) {
                    msgDiscord.channel.send('Artists moved successfully!')
                } else {
                    msgDiscord.channel.send('**' + artistName + '** is not registered in the server!');
                }
            } else {
                msgDiscord.channel.send("You did not mention a correct channel or that channel is not a registered releases channel...");
            }
        } else {
            msgDiscord.reply('The command has not the correct structure! (type `!SE help` for more details)')
        }
    } else {
        msgDiscord.reply('You cannot execute this command here!');
    }
}

module.exports = {
    name: 'move',
    title: 'Move Artists',
    releasesCommand: true,
    description: 'Moves the upcoming artist releases from one channel to another',
    note: 'Command only possible if there is more than one releases channel',
    usage: ['`!SE move name_artist #name-channel`'],
    execute(msgDiscord, content) {
        moveArtistsChannel(msgDiscord, content)
    }
}