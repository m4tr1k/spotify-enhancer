const checkReleases = require('../src/checkReleases');
const search = require('../src/search/search');

async function addArtistsToGuild(msgDiscord, content, cursor){
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
}

function addArtistsToGuildChannel(msgDiscord, content, idReleasesChannels){
    const releasesChannel = content[content.length - 1];
    
    const idReleasesChannel = releasesChannel.substring(2, releasesChannel.length - 1);
    
    if(idReleasesChannels.includes(idReleasesChannel)){
        const possibleArtists = content.join(' ').replace('+', "").replace(releasesChannel, "").split(',').map(item => item.trim());
        addArtists(msgDiscord, possibleArtists, idReleasesChannel);
    } else {
        msgDiscord.channel.send("You did not mention a correct channel or that channel is not a registered releases channel...");
    }
}

function addArtistsToGuildUniqueChannel(msgDiscord, content, idReleasesChannel){
    const possibleArtists = content.join(' ').replace('+', "").split(',').map(item => item.trim());
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

exports.addArtistsToGuild = addArtistsToGuild