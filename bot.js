const express = require('express');
const discordClient = require('./api/discord-properties').discordClient;
const pastebin = require('./api/pastebin-properties');
const spotify = require('./api/spotify-properties').client;
const auth = require('./auth.json');

const checkReleases = require('./src/checkReleases');
const server = require('./src/server');
const search = require('./src/search/search');
const prefix = '!SE';

var app = express();

discordClient.on('ready', () => {

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
          pastebin.loginPastebin();

          console.log(`Spotify connection working...`);
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
      const content = msg.content.replace(prefix, '').trim();
      const option = content.split(' ')[0].toLowerCase();
      switch(option){
        case 'artists':
          checkReleases.seeArtistsGuild(msg)
          break;
        case '+':
          checkReleases.verifyNewReleasesCommandsChannel(msg.channel.id).then(cursor => {
            cursor.hasNext().then( result => {
              if(result){
                var possibleArtists = content.replace('+', "").split(',').map(item => item.trim());
                search.searchArtists(possibleArtists, msg).then( artists => {
                  if(artists !== null){
                    checkReleases.addArtistsToGuild(artists, cursor, msg);
                  }
                })
              } else {
                msg.reply("This is not the channel to add or remove artists...")
              }
            })
          })
          break;
        case '-':
          checkReleases.verifyNewReleasesCommandsChannel(msg.channel.id).then(cursor => {
            cursor.hasNext().then( result => {
              if(result){
                var possibleArtists = content.replace('-', "").split(',').map(item => item.trim());
                checkReleases.removeArtistsGuild(possibleArtists, cursor, msg);
              } else {
                msg.reply("This is not the channel to add or remove artists...")
              }
            })
          })
          break;
        default:
          msg.reply("I don't know what you want to do...")
          break;
      }
    }   
});

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

console.log('Listening on 8888');
discordClient.login(auth.token);
app.listen(8888);