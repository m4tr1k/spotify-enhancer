const db = require('../api/mongoDB-funcs');
const fs = require('fs');
const tmp = require('tmp');

function seeArtists(msgDiscord, content, cursor){
    switch(content.length){
        case 1:
            seeArtistsGuild(msgDiscord, cursor)
            break
        case 2:
            seeArtistsChannel(msgDiscord, content[1], cursor)
            break
        default:
            msgDiscord.channel.send('The command has not the correct structure!')
            break
    }
}

async function seeArtistsGuild(msgDiscord, cursor){
    const guild = await cursor.next();
    const artistsGuild = await db.getArtistsGuild(guild.idReleasesChannels);
    if(artistsGuild === ''){
        msgDiscord.channel.send('There are no artists registered in this server at the moment...');
    } else {
        sendRegisteredArtists(artistsGuild, msgDiscord);
    }
}

async function seeArtistsChannel(msgDiscord, idReleasesChannel, cursor){
    const guild = await cursor.next();

    idReleasesChannel = idReleasesChannel.substring(2, idReleasesChannel.length - 1);

    if(guild.idReleasesChannels.includes(idReleasesChannel)){
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

exports.seeArtists = seeArtists;