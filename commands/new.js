const search = require('../src/search/search');
const releases = require('../src/releases');
const getArtistDB = require('../api/mongoDB-funcs').getArtist;

async function newReleases(msgDiscord, content, cursor){
    const guild = await cursor.next()
    switch(guild.idReleasesChannels.length){
        case 0:
            msgDiscord.channel.send("You don't have registered releases channels!");
            break
        case 1:
            newReleasesUniqueGuildChannel(msgDiscord, content, guild.idReleasesChannels[0]);
            break
        default:
            newReleasesGuildChannel(msgDiscord, content, guild.idReleasesChannels);
            break
    }
}

async function newReleasesUniqueGuildChannel(msgDiscord, content, idReleasesChannel){
    const possibleArtists = content.join(' ').replace('new', "").split(',').map(item => item.trim());
    printNewReleases(msgDiscord, possibleArtists, idReleasesChannel)
}

async function newReleasesGuildChannel(msgDiscord, content, releasesChannels){
    const releasesChannel = content[content.length - 1];
    const idReleasesChannel = releasesChannel.substring(2, releasesChannel.length - 1);
    
    if(releasesChannels.includes(idReleasesChannel)){
        const possibleArtists = content.join(' ').replace(releasesChannel, "").replace('new', "").split(',').map(item => item.trim());
        printNewReleases(msgDiscord, possibleArtists, idReleasesChannel)
    } else {
        msgDiscord.channel.send("You did not mention a correct channel or that channel is not a registered releases channel...");
    }
}

async function printNewReleases(msgDiscord, possibleArtists, releasesChannel){
    let artistIDs = [];

    for(let i = 0; i < possibleArtists.length; i++){
        if(possibleArtists[i].startsWith("spotify:artist:") || possibleArtists[i].startsWith("https://open.spotify.com/artist/")){
            const id = search.getId(possibleArtists[i]);
            artistIDs.push(id);
        } else {
            const artist = await search.searchArtistByName(possibleArtists[i], msgDiscord);
            if(artist !== ''){
                artistIDs.push(artist.id);
            }
        }
    }

    if(artistIDs.length != 0){
        let idReleasesChannel = [];
        
        idReleasesChannel.push(releasesChannel);

        for(let i = 0; i < artistIDs.length; i++){
            const cursorArtist = getArtistDB(artistIDs[i]);
            const artistExists = await cursorArtist.hasNext();

            if(artistExists){
                const artist = await cursorArtist.next();
                releases.createEmbeds(artist.latestReleases, idReleasesChannel);
            } else {
                const latestReleases = await releases.getLatestReleases(artistIDs[i]);
                if(latestReleases != '' && latestReleases.length != 0){
                    releases.createEmbeds(latestReleases, idReleasesChannel);
                }
            }
        }

        msgDiscord.channel.send("Latest releases of the selected artists printed!");
    }
}

exports.newReleases = newReleases;