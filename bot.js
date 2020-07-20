const startup = require('./startup');
const discordClient = require('./api/discord-properties').discordClient;

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
startup();

discordClient.on('ready', () => {
  discordClient.user.setActivity("!SE help", {type: 'LISTENING'});
});

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
                newReleases(msg, content, cursor);
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