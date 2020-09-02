const discordClient = require('../api/discord-properties');
const {prefix} = require('../config.json');

const server = require('../src/server');
const setupReleasesChannel = require('../src/setupReleasesChannel');
   
discordClient.on('message', msg => {
    if(msg.content.startsWith(prefix)) {
        const content = msg.content.replace(prefix, '').trim().split(/ +/);
        const option = content.shift().toLowerCase();

        if(discordClient.commands.has(option)){
            discordClient.commands.get(option).execute(msg, content);
        } else {
            msg.reply("I don't know what you want to do...");
        }
    }
})
discordClient.on('guildCreate', guild => {
    if(guild.available){
        server.welcome(guild);
    }
})

discordClient.on('guildDelete', guild => {
    if(guild.available){
        server.removeGuild(guild);
    }
})

discordClient.on('channelDelete', channel => {
    setupReleasesChannel.channelDelete(channel);
})