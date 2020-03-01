const express = require('express');
const discordClient = require('./api/discord-properties').discordClient;
const spotify = require('./api/spotify-properties').client;
const auth = require('./auth.json');

const newReleases = require('./src/releases');
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

          console.log(`Spotify connection working...`);
        },
        err => {
          console.log('Something went wrong!', err);
      }).then( () => {
        var localTime = new Date();
        var timeUntilCheck = new Date(localTime.getFullYear(), localTime.getMonth(), localTime.getDate(), 11, 29, 0, 0) - localTime;
        if(timeUntilCheck > 0){
          console.log(timeUntilCheck);
          setTimeout(() => {sendNewReleases(), setInterval(() => sendNewReleases(), 86400000)}, timeUntilCheck);
        } else {
          setInterval(() => sendNewReleases(), 86400000)
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
      checkReleases.verifyNewReleasesChannel(msg.channel.id).then(cursor => {
        cursor.hasNext().then( result => {
          if(result){
            switch(msg.content.substring(3, 4)){
              case '+': 
                var possibleArtists = msg.content.replace(prefix + '+', "").split(',').map(item => item.trim());
                search.searchArtists(possibleArtists, msg).then( artists => {
                  msg.delete();
                  checkReleases.addArtistsToGuild(artists, cursor);
                })
                break;
              case '-':
                var possibleArtists = msg.content.replace(prefix + '-', "").split(',').map(item => item.trim());
                msg.delete();
                checkReleases.removeArtistsGuild(possibleArtists, cursor);
                break;
              default:
                msg.delete();
                if(msg.content.trim() === '!SE artists'){
                  checkReleases.seeArtistsGuild(cursor);
                } else {
                  msg.reply("I don't know what you want to do...");
                }
                break;
            }
          }
        })
      })
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