const spotify = require('../../api/spotify-properties').client;
const discordClient = require('../../api/discord-properties').discordClient;

var info;
var verifyHandler = false;
var listener;

var InfoIDs = function(props){
    this.artistId = props.artistId;
    this.messageId = props.messageId;
}

async function searchArtists(artists, msgDiscord){
    var arrayIndex = [];
    const artistsNames = await selectArtistsByName(artists, arrayIndex);
    for(var i = 0; i < artistsNames.length; i++){
        await searchArtistByName(artistsNames[i], artists, msgDiscord, arrayIndex[i]);
    }
    return new Promise ( returnArtistArray => returnArtistArray(artists));
}

async function selectArtistsByName(artists, arrayIndex){
    return new Promise(returnArray => {
        var artistsNames = [];
        var aux = 0;
        for (var i = 0; i < artists.length; i++) {
            if (artists[i].startsWith("spotify:artist:")) {
                artists[i] = artists[i].replace("spotify:artist:", "");
            } else {
                arrayIndex[aux] = i;
                artistsNames[aux] = artists[i];
                aux++;
            }
        }
        returnArray(artistsNames);
    });
}

 async function searchArtistByName(artistName, artists, msgDiscord, number){
    const search = await spotify.spotifyClient.searchArtists(artistName, { limit : 20, offset : 0 });
    const possibleArtists = search.body.artists.items;
    if(possibleArtists.length !== 0){
        const msgReply = await msgDiscord.reply('Which "_' + artistName + '_" are you looking for? (React with ✅ on the desired artist)');
        const artistDetails = await buildMessage(possibleArtists, 0);

        const result = await Promise.all([sendMessage(artistDetails, msgDiscord), await chooseArtist(possibleArtists, 0, msgDiscord)])

        const artistID = result.map(value => value)[1];
        msgReply.delete();
        artists[number] = artistID;
    } else {
        artists[number] = '';
    }
}

async function buildMessage(possibleArtists, number){
    return new Promise (returnArtistDetails => {
        if(verifyHandler){
            discordClient.emit('delete-reaction-add');
        }
        verifyHandler = true;
        const currentArtist = possibleArtists[number];
        info = new InfoIDs({
            artistId: currentArtist.id,
            messageId: ''
        })
        var artistDetails = '**' + currentArtist.name + '** (' + currentArtist.external_urls.spotify + ')' + '\nGenres: ';
        if(currentArtist.genres.length === 0){
            artistDetails += '*(not specified)*';
        } else {
            for(var l = 0; l < currentArtist.genres.length - 1; l++){
                artistDetails += currentArtist.genres[l] + ', ';
            }
            artistDetails += currentArtist.genres[currentArtist.genres.length - 1];
        }
        returnArtistDetails(artistDetails)
    })
}

async function sendMessage(artistDetails, msgDiscord){
    const msgReaction = await msgDiscord.channel.send(artistDetails);
    info.messageId = msgReaction.id;
    await msgReaction.react('✅');
    await msgReaction.react('❎');
}

async function chooseArtist(possibleArtists, number, msgDiscord){
    return new Promise ( returnArtistID => {
        listener = (reaction, user) => {
            if(reaction.emoji.name === '✅' && info.messageId === reaction.message.id && !user.bot){
                reaction.message.delete()
                returnArtistID(info.artistId)
            } else if(reaction.emoji.name === '❎' && info.messageId === reaction.message.id && !user.bot){
                if(number < possibleArtists.length - 1){
                    var aux = ++number;
                    reaction.message.delete().then(() => {
                        buildMessage(possibleArtists, aux).then( artistDetails => {
                            sendMessage(artistDetails, msgDiscord).then( () => {
                                chooseArtist(possibleArtists, aux, msgDiscord).then( artistID => {
                                    returnArtistID(artistID)
                                })
                            })
                        })
                    })
                } else {
                    returnArtistID('');
                }
            }
        }
    
        discordClient.on('messageReactionAdd', listener);
    })
}

discordClient.addListener('delete-reaction-add', () => {
    discordClient.removeListener('messageReactionAdd', listener)
})

exports.searchArtists = searchArtists;