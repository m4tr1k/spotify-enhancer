const MessageEmbed = require('discord.js').MessageEmbed;
const description = "Here's a list with all the commands available:" 

async function showHelpCommands(msg){
    msg.channel.send(new MessageEmbed()
                        .setColor('#1DB954')
                        .setTitle('Need some help?')
                        .setDescription(description)
                        .addFields({name: "**!SE artists**", value: "List of all artists registered in this server"},
                        {name: "**!SE reset**", value: "Database reset (command only available for the admin)"},
                        {name: "**!SE+** *Name of the artist/Spotify URI/Spotify URL, Name of the artist/Spotify URI/Spotify URL...*", value: "Add one or more artists to the database (seperated with commas)"},
                        {name: "**!SE-** *Name of the artist, Name of the artist...*", value: "Remove one or more artists to the database (seperated with commas)"}))
                        
}

exports.showHelpCommands = showHelpCommands;