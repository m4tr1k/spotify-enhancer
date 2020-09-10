const { removeAllArtists } = require('../database/artist/artistHandler')
const { releasesCommandsChannels, releasesChannels } = require('../api/discord-properties')

async function resetDB(msgDiscord, content) {
    const isReleasesCommandsChannel = releasesCommandsChannels.some(releasesCommandsChannel => releasesCommandsChannel === msgDiscord.channel.id);
    console.log(content);
    if (isReleasesCommandsChannel) {
        if (content.length === 0) {
            if (msgDiscord.author.id == msgDiscord.guild.ownerID) {
                const idReleasesChannels = releasesChannels.get(msgDiscord.guild.id);
                if(idReleasesChannels.length !== 0){
                    await removeAllArtists(idReleasesChannels);
                    msgDiscord.channel.send("Database reset successfully done!");
                } else {
                    msgDiscord.channel.send('There are no registered releases channel to reset!');
                }
            } else {
                msgDiscord.channel.send("You're not allowed to reset the database!");
            }
        } else {
            msgDiscord.reply('This command does not have arguments! (type `!SE help` for more details)');
        }
    } else {
        msgDiscord.reply('You cannot execute this command here!');
    }
}

module.exports = {
    name: 'reset',
    title: 'Reset DB',
    releasesCommand: true,
    description: 'Deletes all the artists registered in the server.\nThis command cannot be undone!',
    note: '- Only the server owner can execute this command!',
    usage: ['`!SE reset`'],
    execute(msgDiscord, content) {
        resetDB(msgDiscord, content);
    }
}