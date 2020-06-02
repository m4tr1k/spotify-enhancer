const express = require('express');
const discordClient = require('./api/discord-properties').discordClient;
const spotify = require('./api/spotify-properties').client;
const auth = require('./auth.json');

const help = require('./commands/help');
const checkReleases = require('./src/checkReleases');
const seeArtistsGuild = require('./commands/artists').seeArtistsGuild;
const newReleases = require('./commands/new').newReleases;
const server = require('./src/server');
const reset = require('./commands/reset');
const search = require('./src/search/search');
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
                seeArtistsGuild(msg, cursor);
                break;
              case 'new':
                newReleases(msg, cursor);
                break;
              case '+':
                var possibleArtists = content.replace('+', "").split(',').map(item => item.trim());
                if(possibleArtists.length < 20){
                  search.searchArtists(possibleArtists, msg).then( artists => {
                    if(artists !== null){
                      checkReleases.addArtistsToGuild(artists, cursor, msg);
                    }
                  })
                } else {
                  msg.channel.send("It is not possible to search more than 20 artists in a single search!");
                }
                break;
              case '-':
                var possibleArtists = content.replace('-', "").split(',').map(item => item.trim());
                checkReleases.removeArtistsGuild(possibleArtists, cursor, msg);
                break;
              default:
                msg.reply("I don't know what you want to do...")
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

console.log('Listening on 8888');
discordClient.login(auth.token);
app.listen(8888);