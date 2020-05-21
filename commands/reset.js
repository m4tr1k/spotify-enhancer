const mongoDB = require('../api/mongoDB-funcs')

async function resetDB(msgDiscord){
    if(msgDiscord.author.id == msgDiscord.guild.ownerID){
        await mongoDB.deleteAllArtists(msgDiscord.guild.id);
        msgDiscord.channel.send("Database reset successfully done!");
    } else {
        msgDiscord.channel.send("You're not allowed to reset the database!");
    }
}

exports.resetDB = resetDB;