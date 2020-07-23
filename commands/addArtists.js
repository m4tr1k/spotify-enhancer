const checkReleases = require('../src/checkReleases');
const search = require('../src/search/search');

async function addArtistsToGuild(msgDiscord, content, cursor){
    const isReleasesCommandsChannel = await cursor.hasNext();
    if(isReleasesCommandsChannel){
        if(content.length != 0){
            const guild = await cursor.next();
            switch(guild.idReleasesChannels.length){
                case 0:
                    msgDiscord.channel.send("You don't have registered releases channels!");
                    break
                case 1:
                    addArtistsToGuildUniqueChannel(msgDiscord, content, guild.idReleasesChannels[0])
                    break
                default:
                    addArtistsToGuildChannel(msgDiscord, content, guild.idReleasesChannels)
                    break
            }
        } else {
            msgDiscord.reply('This command needs arguments (type `!SE help` for more details)');
        }
    } else {
        msgDiscord.reply('You cannot execute this command here!');
    }
}

function addArtistsToGuildChannel(msgDiscord, content, idReleasesChannels){
    const releasesChannel = content[content.length - 1];
    
    const idReleasesChannel = releasesChannel.substring(2, releasesChannel.length - 1);
    
    if(idReleasesChannels.includes(idReleasesChannel)){
        const possibleArtists = content.join(' ').replace(releasesChannel, "").split(',').map(item => item.trim());
        addArtists(msgDiscord, possibleArtists, idReleasesChannel);
    } else {
        msgDiscord.channel.send("You did not mention a correct channel or that channel is not a registered releases channel...");
    }
}

function addArtistsToGuildUniqueChannel(msgDiscord, content, idReleasesChannel){
    const possibleArtists = content.join(' ').split(',').map(item => item.trim());
    addArtists(msgDiscord, possibleArtists, idReleasesChannel);
}

async function addArtists(msgDiscord, possibleArtists, idReleasesChannel){
    if(possibleArtists.length < 20){
        const artists = await search.searchArtists(possibleArtists, msgDiscord)
        if(artists !== null){
            checkReleases.addArtistsToGuild(artists, idReleasesChannel, msgDiscord);
        }
    } else {
        msgDiscord.channel.send("It is not possible to search more than 20 artists in a single search!");
    }
}

module.exports = {
    name: '+',
    title: 'Add Artist(s)',
    releasesCommand: true,
    description: 'Add an artist to the server/registered releases channel.\nIt is possible to add several artists using a comma `,`',
    note: '- You need to have registered releases channels in order to add artists to the server!\n- It is only possible to add 20 artists at a time!',
    usage: [
        '`!SE+ name_artist/SpotifyURI/URL, (...)`\nCommand for only one releases channel',
        '`!SE+ name_artist/SpotifyURI/URL, (...) #name-channel`\nCommand for more than one releases channel'
    ],
    execute(msgDiscord, content, cursor){
        addArtistsToGuild(msgDiscord, content, cursor);
    }
}