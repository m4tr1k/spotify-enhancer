const { removeArtists } = require('../database/artist/artistHandler')
const { releasesCommandsChannels, releasesChannels } = require('../api/discord-properties');

async function removeArtistsGuild(msgDiscord, content) {
    const isReleasesCommandsChannel = releasesCommandsChannels.some(releasesCommandsChannel => releasesCommandsChannel === msgDiscord.channel.id);

    if (isReleasesCommandsChannel) {
        if (content.length != 0) {
            const possibleArtists = content.join(' ').split(',').map(item => item.trim());
            const idReleasesChannels = releasesChannels.get(msgDiscord.guild.id);

            let message = '';
            const removedArtists = await removeArtists(possibleArtists, idReleasesChannels, msgDiscord);         

            switch(removedArtists.length){
                case 0:
                    message += 'All the mentioned artists are not registered in the server!';
                    break;
                default:
                    message += '**' + removedArtists.join(', ') + '** removed from the server! '
                    if(removedArtists.length !== possibleArtists.length){
                        message += 'The others are not registered!';
                    }
            }

            msgDiscord.channel.send(message);
        } else {
            msgDiscord.reply('This command needs arguments (type `!SE help` for more details)');
        }
    } else {
        msgDiscord.reply('You cannot execute this command here!');
    }
}

module.exports = {
    name: '-',
    title: 'Remove Artist(s)',
    releasesCommand: true,
    description: 'Remove an artist that is registered in the server.\nIt is possible to remove several artists using a comma `,`',
    usage: ['`!SE- name_artist, (...)`'],
    execute(msgDiscord, content) {
        removeArtistsGuild(msgDiscord, content);
    }
}