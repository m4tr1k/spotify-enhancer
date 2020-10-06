const { releasesCommandsChannels, releasesChannels } = require('../api/discord-properties');

function seeChannels(msgDiscord, content){
    switch (content.length) {
        case 0:
            seeRegisteredChannels(msgDiscord)
            break
        default:
            msgDiscord.channel.send('The command has not the correct structure! (type `!SE help` for more details)')
            break
    }
}

function seeRegisteredChannels(msgDiscord){
    const isReleasesCommandsChannel = releasesCommandsChannels.some(releasesCommandsChannel => releasesCommandsChannel === msgDiscord.channel.id);
    if (isReleasesCommandsChannel) {
        const idReleasesChannels = releasesChannels.get(msgDiscord.guild.id);
        if(idReleasesChannels.length > 0){
            const channels = idReleasesChannels.map(idReleasesChannel => '<#' + idReleasesChannel + '>').join('\n');
            msgDiscord.channel.send('Registered releases channels:\n' + channels);
        } else {
            msgDiscord.channel.send('There are no registered releases channels!');
        }        
    } else {
        msgDiscord.reply('You cannot execute this command here!');
    }
}

module.exports = {
    name: 'channels',
    title: 'See Releases Channels',
    releasesCommand: true,
    description: 'See all the releases channels registered in the server',
    usage: [
        '`!SE channels`'
    ],
    execute(msgDiscord, content) {
        seeChannels(msgDiscord, content)
    }
}