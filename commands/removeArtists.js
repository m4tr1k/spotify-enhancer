const removeArtists = require('../src/checkReleases').removeArtistsGuild;

async function removeArtistsGuild(msgDiscord, content, cursor){
    const isReleasesCommandsChannel = await cursor.hasNext();
    if(isReleasesCommandsChannel){
        if(content.length != 0){
            const possibleArtists = content.join(' ').split(',').map(item => item.trim());
            removeArtists(possibleArtists, cursor, msgDiscord);
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
    usage: ['`!SE- name_artist/SpotifyURI/URL, (...)`'],
    execute(msgDiscord, content, cursor){
        removeArtistsGuild(msgDiscord, content, cursor);
    }
}