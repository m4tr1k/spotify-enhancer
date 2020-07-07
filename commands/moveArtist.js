const moveArtists = require('../api/mongoDB-funcs').moveArtistsChannel;

async function moveArtistsChannel(msgDiscord, content, cursor){
    const releasesChannel = content[content.length - 1];
    const idReleasesChannel = releasesChannel.substring(2, releasesChannel.length - 1);

    const guild = await cursor.next();
    if(guild.idReleasesChannels.includes(idReleasesChannel)){
        const artistName = content.join(' ').replace('move', "").replace(releasesChannel, "").trim();
        const hasMoved = await moveArtists(artistName, idReleasesChannel, guild.idReleasesChannels);
        if(hasMoved){
            msgDiscord.channel.send('Artists moved successfully!')
        } else {
            msgDiscord.channel.send('**' + artistName + '** is not registered in the server!');
        }
    } else {
        msgDiscord.channel.send("You did not mention a correct channel or that channel is not a registered releases channel...");
    }
}

exports.moveArtistsChannel = moveArtistsChannel