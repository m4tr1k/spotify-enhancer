const spotify = require('./api/spotify-properties');
const dbNewConnection = require('./api/mongoDB-funcs').newConnection;
const auth = require('./auth.json');
const discordClient = require('./api/discord-properties');
const sendNewReleases = require('./src/checkReleases').sendNewReleases;

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

        //Login on Discord API
        discordClient.login(auth.token);
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

module.exports = startup;