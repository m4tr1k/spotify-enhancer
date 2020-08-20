const search = require('../src/search/search');
const releases = require('../src/releases');
const getArtistDB = require('../api/mongoDB-funcs').getArtist;

async function newReleases(msgDiscord, content, cursor){
    const isReleasesCommandsChannel = await cursor.hasNext();
    if(isReleasesCommandsChannel){
        if(content.length != 0){
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
        } else {
            msgDiscord.reply('This command needs arguments (type `!SE help` for more details)');
        }
    } else {
        msgDiscord.reply('You cannot execute this command here!');
    }
}

async function newReleasesUniqueGuildChannel(msgDiscord, content, idReleasesChannel){
    const possibleArtists = content.join(' ').split(',').map(item => item.trim());
    printNewReleases(msgDiscord, possibleArtists, idReleasesChannel)
}

async function newReleasesGuildChannel(msgDiscord, content, releasesChannels){
    const releasesChannel = content[content.length - 1];
    const idReleasesChannel = releasesChannel.substring(2, releasesChannel.length - 1);
    
    if(releasesChannels.includes(idReleasesChannel)){
        const possibleArtists = content.join(' ').replace(releasesChannel, "").split(',').map(item => item.trim());
        printNewReleases(msgDiscord, possibleArtists, idReleasesChannel)
    } else {
        msgDiscord.channel.send("You did not mention a correct channel or that channel is not a registered releases channel...");
    }
}

async function printNewReleases(msgDiscord, possibleArtists, releasesChannel){
    let printedReleases = false;
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
                if(artist.latestReleases.length !== 0){
                    releases.createEmbeds(artist.latestReleases, idReleasesChannel);
                    printedReleases = true;
                }
            } else {
                const latestReleases = await releases.getLatestReleases(artistIDs[i]);
                if(latestReleases != '' && latestReleases.length != 0){
                    releases.createEmbeds(latestReleases, idReleasesChannel);
                    printedReleases = true;
                }
            }
        }

        if(printedReleases){
            msgDiscord.channel.send("Latest releases of the selected artists printed!");
        } else {
            msgDiscord.channel.send("It was not possible to print the latest releases of the selected artists!");
        }
    }
}

module.exports = {
    name: 'new',
    title: 'New Releases of Artist(s)',
    releasesCommand: true,
    description: 'Print the latest releases of any artist to a specific releases channel.\nIt is possible to add several artists using a comma `,`',
    note: '- You need to have registered releases channels in order to add artists to the server!',
    usage: [
        '`!SE new name_artist/SpotifyURI/URL, (...)`\nCommand for one releases channel',
        '`!SE new name_artist/SpotifyURI/URL, (...) #name-channel`\nCommand for more than one releases channel'
    ],
    execute(msgDiscord, content, cursor){
        newReleases(msgDiscord, content, cursor)
    }
}