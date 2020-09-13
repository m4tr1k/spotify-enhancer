const fs = require('fs');
const spotify = require('../api/spotify-properties');
const { discordToken } = require('../config.json');
const discordClient = require('../api/discord-properties');

const checkNewReleases = require('../src/checkReleases');
const loadGuildsInfo = require('./guildsInfo');

async function startup() {
    try {
        //Connection to Spotify API
        const data = await spotify.client.clientCredentialsGrant()
        spotify.client.setAccessToken(data.body['access_token'])
        console.log(`Spotify connection established!`)

        //Refresh token after 1 hour
        setInterval(refreshToken, 3600000)

        //Load all the available commands
        loadAllCommands()
        console.log('All the commands were successfully loaded!')

        //Login on Discord API
        await discordClient.login(discordToken);
        discordClient.setImmediate(() => {
            Promise.all([
                discordClient.user.setStatus('dnd'),
                discordClient.user.setActivity("Initializing...")
            ]);
        })
        console.log('Bot is logged in!')
    } catch (err) {
        console.log('Something went wrong! Application must restart!', err);
    }
}

async function refreshToken() {
    try {
        const data = await spotify.client.clientCredentialsGrant();
        spotify.client.setAccessToken(data.body['access_token']);
        console.log('Refreshed token! Expires in ' + data.body.expires_in + ' seconds');
    } catch (err) {
        console.log('Could not refresh access token', err);
    }
}

function loadAllCommands() {
    const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const command = require(`../commands/${file}`);
        discordClient.commands.set(command.name, command);
    }
}

function setupCheckNewReleases() {
    let localTime = new Date();
    if (localTime.getMinutes() === 0) {
        checkNewReleases();
        setInterval(() => checkNewReleases(), 3600000);
    } else {
        localTime.setHours(localTime.getHours() + 1);
        localTime.setMinutes(0);
        localTime.setSeconds(0);
        localTime.setMilliseconds(0);
        const timeUntilCheck = localTime - new Date();
        setTimeout(() => { checkNewReleases(), setInterval(() => checkNewReleases(), 3600000) }, timeUntilCheck);
    }
}

discordClient.on('ready', async () => {
    //Load all the info about the guilds
    await loadGuildsInfo();
    console.log('All info about registered guilds successfully loaded!');

    //Setup the timeouts and intervals for new releases
    setupCheckNewReleases()

    //Setup discord.js event handlers
    require('./setupEventHandlers');
    console.log('Event Handlers setup successfully!');

    Promise.all([
        discordClient.user.setStatus('available'),
        discordClient.user.setActivity("!SE help", { type: 'LISTENING' })
    ])

    console.log('Bot is ready to use!');
});

module.exports = startup;