const MessageEmbed = require('discord.js').MessageEmbed;
const description = "Here's a list with all the commands available:" 

async function showHelpCommands(msg){
    msg.channel.send(new MessageEmbed()
                        .setColor('#1DB954')
                        .setTitle('Need some help?')
                        .setDescription(description)
                        .addFields({name: "**!SE artists**", value: "List of all artists registered in this server"},
                        {name: "**!SE reset**", value: "Server database reset (command only available for the admin)"},
                        {name: "**!SE new** *Name of the artist/Spotify URI/Spotify URL, Name of the artist/Spotify URI/Spotify URL...*", value: "Add new releases of an artist without adding it to the server"},
                        {name: "**!SE+** *Name of the artist/Spotify URI/Spotify URL, Name of the artist/Spotify URI/Spotify URL...*", value: "Add one or more artists (up to 20 in a single search) to the server (seperated with commas)"},
                        {name: "**!SE-** *Name of the artist, Name of the artist...*", value: "Remove one or more artists to the server (seperated with commas)"}))
                        
}

exports.showHelpCommands = showHelpCommands;