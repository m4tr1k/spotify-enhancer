const express = require('express');
const discordClient = require('./api/discord-properties').discordClient;
const spotify = require('./api/spotify-properties').client;
const auth = require('./auth.json');

const dbNewConnection = require('./api/mongoDB-funcs').newConnection;
const help = require('./commands/help');
const checkReleases = require('./src/checkReleases');
const seeArtists = require('./commands/artists').seeArtists;
const newReleases = require('./commands/new').newReleases;
const server = require('./src/server');
const reset = require('./commands/reset');
const addArtistsToGuild = require('./commands/addArtists').addArtistsToGuild;
const removeArtistsGuild = require('./commands/removeArtists').removeArtistsGuild;
const moveArtistsChannel = require('./commands/moveArtist').moveArtistsChannel;
const setupReleasesChannel = require('./src/setupReleasesChannel');

const prefix = '!SE';

var app = express();

discordClient.on('ready', () => {

  discordClient.user.setActivity("!SE help", {type: 'LISTENING'});

  app.get('/', (req, res) => {
    res.redirect(spotify.getAuthorizeURL());
  })

  app.get('/callback', (req, res) => {
    var code = req.query.code || null;
    var state = req.query.state || null;

    if(state !== null){
      spotify.spotifyClient.authorizationCodeGrant(code).then(
        data => {
          spotify.spotifyClient.setAccessToken(data.body['access_token']);
          spotify.spotifyClient.setRefreshToken(data.body['refresh_token']);

          console.log(`Spotify connection working...`);
          dbNewConnection();
        },
        err => {
          console.log('Something went wrong!', err);
      }).then( () => {
        var localTime = new Date();
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
        setInterval(refreshToken, 3600000);
      })
    }
  })
});


function sendNewReleases(){
  checkReleases.sendNewReleases();
}

function refreshToken(){
  spotify.spotifyClient.refreshAccessToken().then(
    data => {
      spotify.spotifyClient.setAccessToken(data.body['access_token']);
    },
    err => {
      console.log('Could not refresh access token', err);
    }
  );
}

discordClient.on('message', msg => {
    if(msg.content.startsWith(prefix)) {
      const content = msg.content.replace(prefix, '').trim().split(' ');
      const option = content[0].toLowerCase();
      checkReleases.verifyNewReleasesCommandsChannel(msg.channel.id).then(cursor => {
        cursor.hasNext().then( result => {
          if(result){
            switch(option){
              case 'reset':
                reset.resetDB(msg);
                break;
              case 'help':
                help.showHelpCommands(msg);
                break;
              case 'artists':
                seeArtists(msg, content, cursor);
                break;
              case 'new':
                newReleases(msg, content[content.length - 1], cursor);
                break;
              case '+':
                addArtistsToGuild(msg, content, cursor);
                break;
              case '-':
                removeArtistsGuild(msg, content, cursor);
                break;
              case 'move':
                moveArtistsChannel(msg, content, cursor);
                break;
              default:
                msg.reply("I don't know what you want to do...")
                break;
            }
          } else {
            switch(option){
              case 'addchannel':
                setupReleasesChannel.addChannel(msg);
                break;
              case 'removechannel':
                setupReleasesChannel.removeChannel(msg);
                break;
            }
          }
        })   
      })
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

console.log('Listening on 8888');
discordClient.login(auth.token);
app.listen(8888);