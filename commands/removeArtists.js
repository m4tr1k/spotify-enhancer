const removeArtists = require('../src/checkReleases').removeArtistsGuild;
const {releasesCommandsChannels, releasesChannels} = require('../api/discord-properties');

async function removeArtistsGuild(msgDiscord, content){
    const isReleasesCommandsChannel = releasesCommandsChannels.some(releasesCommandsChannel => releasesCommandsChannel === msgDiscord.channel.id);

    if(isReleasesCommandsChannel){
        if(content.length != 0){
            const possibleArtists = content.join(' ').split(',').map(item => item.trim());
            const idReleasesChannels = releasesChannels.get(msgDiscord.guild.id);
            removeArtists(possibleArtists, idReleasesChannels, msgDiscord);
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
    execute(msgDiscord, content){
        removeArtistsGuild(msgDiscord, content);
    }
}