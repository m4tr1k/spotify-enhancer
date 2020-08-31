const Discord = require('discord.js');
const discordClient = new Discord.Client();
discordClient.commands = new Discord.Collection();
discordClient.releasesChannels = new Discord.Collection();
discordClient.releasesCommandsChannels = new Discord.Collection();

module.exports = discordClient;