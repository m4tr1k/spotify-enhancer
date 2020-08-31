const db = require('../api/mongoDB-funcs');
const fs = require('fs');
const tmp = require('tmp');
const {releasesChannels} = require('../api/discord-properties');

function seeArtists(msgDiscord, content){
    switch(content.length){
        case 0:
            seeArtistsGuild(msgDiscord)
            break
        case 1:
            seeArtistsChannel(msgDiscord, content[0])
            break
        default:
            msgDiscord.channel.send('The command has not the correct structure! (type `!SE help` for more details)')
            break
    }
}

async function seeArtistsGuild(msgDiscord){
    const guildReleasesChannels = releasesChannels.get(msgDiscord.guild.id);
    const artistsGuild = await db.getArtistsGuild(guildReleasesChannels);
    if(artistsGuild === ''){
        msgDiscord.channel.send('There are no artists registered in this server at the moment...');
    } else {
        sendRegisteredArtists(artistsGuild, msgDiscord);
    }
}

async function seeArtistsChannel(msgDiscord, idReleasesChannel){
    const guildReleasesChannels = releasesChannels.get(msgDiscord.guild.id);
    idReleasesChannel = idReleasesChannel.substring(2, idReleasesChannel.length - 1);

    if(guildReleasesChannels.includes(idReleasesChannel)){
        const artistsChannel = await db.getArtistsChannel(idReleasesChannel)

        if(artistsChannel === ''){
            msgDiscord.channel.send('There are no artists registered in this server at the moment...');
        } else {
            sendRegisteredArtists(artistsChannel, msgDiscord);
        }
    } else {
        msgDiscord.channel.send("That channel is not a registered releases channel...");
    }
}

async function sendRegisteredArtists(artists, msgDiscord){
    const file = tmp.fileSync({mode: 0o644, name: 'artistsServer.txt'});
    fs.writeFileSync(file.name, artists);

    await msgDiscord.channel.send('You can check the registered artists here: ', {files: [file.name]});

    file.removeCallback();
}

module.exports = {
    name: 'artists',
    title: 'See Artists',
    releasesCommand: null,
    description: 'See the artists registered in the server or in a particular channel',
    usage: [
        '`!SE artists`\nAll artists registered on the server',
        '`!SE artists #name-channel`\nAll artists on a particular channel'
    ],
    execute(msgDiscord, content){
        seeArtists(msgDiscord, content)
    }
}