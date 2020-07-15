const search = require('../src/search/search');
const releases = require('../src/releases');
const getArtistDB = require('../api/mongoDB-funcs').getArtist;

async function newReleases(msgDiscord, releasesChannel, cursor){
    let artistIDs = [];

    const guild = await cursor.next()
    const idChannel = releasesChannel.substring(2, releasesChannel.length - 1);
    
    if(guild.idReleasesChannels.includes(idChannel)){
        //TODO melhorar esta linha
        const possibleArtists = msgDiscord.content.replace(releasesChannel, "").replace('!SE new', "").split(',').map(item => item.trim());

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
            
            idReleasesChannel.push(idChannel);
    
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
    } else {
        msgDiscord.channel.send("You did not mention a correct channel or that channel is not a registered releases channel...");
    }
}

exports.newReleases = newReleases;