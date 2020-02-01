const Discord = require('discord.js');
const express = require('express');
const discordClient = new Discord.Client();
const auth = require('./auth.json');

const newReleases = require('./src/newReleases');
const spotifyProps = require('./api/spotify-properties');
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

          console.log(`Running...`);
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
        search.searchArtists(artists).then( artistsIds => {
          newReleases.createMessageNewReleases(artistsIds, msg);
        })
    }   
});

console.log('Listening on 8888');
discordClient.login(auth.token);
app.listen(8888);