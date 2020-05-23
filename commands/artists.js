const db = require('../api/mongoDB-funcs');
const fs = require('fs');
const tmp = require('tmp');

async function seeArtistsGuild(msgDiscord, cursor){
    const guild = await cursor.next();
    const artistsDB = await db.getArtistsGuild(guild.idReleasesChannel);
    if(artistsDB === ''){
        msgDiscord.channel.send('There are no artists registered in this server at the moment...');
    } else {
        const file = tmp.fileSync({mode: 0o644, name: 'artistsServer.txt'});
        fs.writeFileSync(file.name, artistsDB);

        await msgDiscord.channel.send('You can check the registered artists in the server here: ', {files: [file.name]});

        file.removeCallback();
    }
}

exports.seeArtistsGuild = seeArtistsGuild;