const express = require('express');
const discordClient = require('./api/discord-properties').discordClient;
const spotifyProps = require('./api/spotify-properties');
const auth = require('./auth.json');

const newReleases = require('./src/newReleases');
const server = require('./src/server');
const search = require('./src/search/search');
const prefix = '!sptEn ';

var app = express();

discordClient.on('ready', () => {

  app.get('/', (req, res) => {
    res.redirect(spotifyProps.URL);
  })

  app.get('/callback', (req, res) => {
    var code = req.query.code || null;
    var state = req.query.state || null;

    if(state !== null){
      spotifyProps.spotifyClient.authorizationCodeGrant(code).then(
        data => {
          spotifyProps.spotifyClient.setAccessToken(data.body['access_token']);
          spotifyProps.spotifyClient.setRefreshToken(data.body['refresh_token']);

          console.log(`Spotify connection working...`);
        },
        err => {
          console.log('Something went wrong!', err);
      }).then( () => {
        setInterval(refreshToken, 3600000);
      })
    }
  })
});

function refreshToken(){
  spotifyProps.spotifyClient.refreshAccessToken().then(
    data => {
      spotifyProps.spotifyClient.setAccessToken(data.body['access_token']);
    },
    err => {
      console.log('Could not refresh access token', err);
    }
  );
}

discordClient.on('message', msg => {
    if (msg.content.includes(prefix)) {
        var artists = msg.content.replace(prefix, "").split(',').map(item => item.trim());
        search.searchArtists(artists, msg).then( artistsIds => {
          newReleases.createMessageNewReleases(artistsIds, msg);
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