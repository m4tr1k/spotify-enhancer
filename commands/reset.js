const mongoDB = require('../api/mongoDB-funcs')

async function resetDB(msgDiscord, content, cursor){
    const isReleasesCommandsChannel = await cursor.hasNext();
    if(isReleasesCommandsChannel){
        if(content.length != 0){
            if(msgDiscord.author.id == msgDiscord.guild.ownerID){
                await mongoDB.deleteAllArtists(msgDiscord.guild.id);
                msgDiscord.channel.send("Database reset successfully done!");
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
    execute(msgDiscord, content, cursor){
        resetDB(msgDiscord, content, cursor);
    }
}