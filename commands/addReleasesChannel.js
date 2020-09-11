const { addChannel } = require('../src/setupReleasesChannel');
const { releasesCommandsChannels } = require('../api/discord-properties');

async function addReleasesChannel(msgDiscord, content) {
    const isReleasesCommandsChannel = releasesCommandsChannels.some(releasesCommandsChannel => releasesCommandsChannel === msgDiscord.channel.id);

    if (!isReleasesCommandsChannel) {
        if (content.length == 0) {
            addChannel(msgDiscord);
        } else {
            msgDiscord.reply('This command does not have arguments! (type `!SE help` for more details)');
        }
    } else {
        msgDiscord.reply('You cannot execute this command here!');
    }
}

module.exports = {
    name: 'addchannel',
    title: 'Add Releases Channel',
    releasesCommand: false,
    description: 'Register a channel to be a releases channel.',
    note: '- You must have the New Releases Manager role assigned in order to add channels.\n- You can only have 10 releases channels in the server!',
    usage: ['`!SE addchannel`'],
    execute(msgDiscord, content) {
        addReleasesChannel(msgDiscord, content)
    }
}