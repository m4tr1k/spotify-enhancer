const search = require('../src/search/search');
const releases = require('../src/releases');
const getArtistDB = require('../api/mongoDB-funcs').getArtist;

async function newReleases(msgDiscord, cursor){
    let artistIDs = [];
    var possibleArtists = msgDiscord.content.replace('$SE new', "").split(',').map(item => item.trim());
    
    for(let i = 0; i < possibleArtists.length; i++){
        if(possibleArtists[i].startsWith("spotify:artist:") || possibleArtists[i].startsWith("https://open.spotify.com/artist/")){
            const id = search.getId(possibleArtists[i]);
            artistIDs.push(id);
        } else {
            const artistInfo = await search.searchArtistByName(possibleArtists[i], msgDiscord);
            if(artistInfo !== '' && artistInfo !== null){
                artistIDs.push(artistInfo.artistId);
            }
        }
    }

    if(artistIDs.length != 0){
        let idReleasesChannel = [];
        const guild = await cursor.next();
        idReleasesChannel.push(guild.idReleasesChannel);

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