const removeChannel = require('../src/setupReleasesChannel').removeChannel;
const {releasesCommandsChannels} = require('../api/discord-properties');

async function removeReleasesChannel(msgDiscord, content){
    const isReleasesCommandsChannel = releasesCommandsChannels.some(releasesCommandsChannel => releasesCommandsChannel === msgDiscord.channel.id);

    if(!isReleasesCommandsChannel){
        if(content.length == 0){
            removeChannel(msgDiscord);
        } else {
            msgDiscord.reply('This command does not have arguments! (type `!SE help` for more details)');
        }
    } else {
        msgDiscord.reply('You cannot execute this command here!');
    }
}

module.exports = {
    name: 'removechannel',
    title: 'Remove Releases Channel',
    releasesCommand: false,
    description: 'Remove a releases channel from the server',
    note: 'You must have the New Releases Manager role assigned in order to remove channels.',
    usage: ['`!SE removechannel`'],
    execute(msgDiscord, content){
        removeReleasesChannel(msgDiscord, content)
    }
}