const search = require('../src/search/search');
const { getLatestReleases } = require('../src/releases');
const { sendReleasesChannel } = require('../src/releases/sendReleases');
const { getRegisteredArtistsDB } = require('../database/artist/getArtists');
const {releasesCommandsChannels, releasesChannels} = require('../api/discord-properties');

async function newReleases(msgDiscord, content){
    const isReleasesCommandsChannel = releasesCommandsChannels.some(releasesCommandsChannel => releasesCommandsChannel === msgDiscord.channel.id);
    if(isReleasesCommandsChannel){
        if(content.length != 0){
            const idReleasesChannels = releasesChannels.get(msgDiscord.guild.id);
            switch(idReleasesChannels.length){
                case 0:
                    msgDiscord.channel.send("You don't have registered releases channels!");
                    break
                case 1:
                    newReleasesUniqueGuildChannel(msgDiscord, content, idReleasesChannels[0]);
                    break
                default:
                    newReleasesGuildChannel(msgDiscord, content, idReleasesChannels);
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

    if(artistIDs.length !== 0){
        const cursorArtistsReleases = getRegisteredArtistsDB(artistIDs);
        const artistsReleases = await cursorArtistsReleases.next();

        let releasesToPrint = [];
        if(artistsReleases !== null){
            releasesToPrint = [...artistsReleases.latestReleases];
            artistIDs = artistIDs.filter(artistID => {
                if(!artistsReleases.artistIds.includes(artistID)){
                    return artistID
                }
            })
        }

        for(let i = 0; i < artistIDs.length; i++){
            const latestReleases = await getLatestReleases(artistIDs[i]);
            latestReleases.forEach(lrelease => {
                const containsRelease = releasesToPrint.some(release => {
                    return release.spotifyLink === lrelease.spotifyLink
                })

                if(!containsRelease){
                    releasesToPrint.push(lrelease);
                }
            })
            
        }

        if(releasesToPrint.length > 0){
            sendReleasesChannel(releasesToPrint, releasesChannel);
            msgDiscord.channel.send("Latest releases of the selected artists printed!");
        } else {
            msgDiscord.channel.send("It was not possible to print the latest releases of the desired artists");
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
    execute(msgDiscord, content){
        newReleases(msgDiscord, content)
    }
}