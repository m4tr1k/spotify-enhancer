const fs = require('fs');
const spotify = require('./api/spotify-properties');
const dbNewConnection = require('./api/mongoDB-funcs').newConnection;
const {discordToken, prefix} = require('./config.json');
const discordClient = require('./api/discord-properties');
const sendNewReleases = require('./src/checkReleases').sendNewReleases;

const checkReleases = require('./src/checkReleases');
const server = require('./src/server');
const setupReleasesChannel = require('./src/setupReleasesChannel');

async function startup(){
    try{
        //Connection to Spotify API
        const data = await spotify.client.clientCredentialsGrant()
        spotify.client.setAccessToken(data.body['access_token'])
        console.log(`Spotify connection established!`)

        //Refresh token after 1 hour
        setInterval(refreshToken, 3600000)

        //Configure a new connection to MongoDB
        await dbNewConnection()

        //Load all the available commands
        loadAllCommands()
        console.log('All the commands were successfully loaded!')

        //Login on Discord API
        discordClient.login(discordToken);
        console.log('Bot is online!')

        //Setup the timeouts and intervals for new releases
        setupCheckNewReleases()

        console.log('Bot is ready to use :D')
    } catch (err){
        console.log('Something went wrong! Application must restart!', err);
    }
}

async function refreshToken(){
    try{
        const data = await spotify.client.clientCredentialsGrant();
        spotify.client.setAccessToken(data.body['access_token']);
        console.log('Refreshed token! Expires in ' + data.body.expires_in + ' seconds');
    } catch (err){
        console.log('Could not refresh access token', err);
    }
}

function loadAllCommands(){
    const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const command = require(`./commands/${file}`);
        discordClient.commands.set(command.name, command);
    }
}

function setupCheckNewReleases(){
    let localTime = new Date();
    if(localTime.getMinutes() === 0){
        sendNewReleases();
        setInterval(() => sendNewReleases(), 3600000);
    } else {
        localTime.setHours(localTime.getHours() + 1);
        localTime.setMinutes(0);
        localTime.setSeconds(0);
        localTime.setMilliseconds(0);
        const timeUntilCheck = localTime - new Date();
        console.log(timeUntilCheck);
        setTimeout(() => {sendNewReleases(), setInterval(() => sendNewReleases(), 3600000)}, timeUntilCheck);
    }
}

discordClient.on('ready', () => {
    discordClient.user.setActivity("!SE help", {type: 'LISTENING'});
  });
  
discordClient.on('message', msg => {
    if(msg.content.startsWith(prefix)) {
        const content = msg.content.replace(prefix, '').trim().split(/ +/);
        const option = content.shift().toLowerCase();

        if(discordClient.commands.has(option)){
            checkReleases.verifyNewReleasesCommandsChannel(msg.channel.id).then(cursor => {
                discordClient.commands.get(option).execute(msg, content, cursor); 
            })
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

module.exports = startup;