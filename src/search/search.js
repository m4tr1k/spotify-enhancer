const spotify = require('../../api/spotify-properties').client;
const discordClient = require('../../api/discord-properties').discordClient;

var info;
var verifyHandler = false;
var listener;

var InfoIDs = function(props){
    this.artistId = props.artistId;
    this.artistName = props.artistName;
    this.messageId = props.messageId;
}

async function searchArtists(artists, msgDiscord){
    let artistsInfos = [];
    let artistIDs = [];
    for(var i = 0; i < artists.length; i++){
        if(artists[i] !== ''){
            if(artists[i].startsWith("spotify:artist:") || artists[i].startsWith("https://open.spotify.com/artist/")){
                const id = getId(artists[i]);
                artistIDs.push(id);
            } else {
                const artist = await searchArtistByName(artists[i], msgDiscord);
                if(artist !== '' && artist !== null){
                    artistsInfos.push(artist);
                }
            } 
        }
    }

    if(artistIDs.length != 0){
        const artistDetails = await spotify.spotifyClient.getArtists(artistIDs);

        for(let i = 0; i < artistDetails.body.artists.length; i++){
            if(artistDetails.body.artists[i] != null){
                info = new InfoIDs({
                    artistId: artistIDs[i],
                    artistName: artistDetails.body.artists[i].name
                })
                artistsInfos.push(info);
            } else {
                msgDiscord.reply('It seems that the artist with the id **' + artistIDs[i] + '** does not exist');
            }
        }
    }

    return artistsInfos;
}

function getId(artist){
    const prefixURI = artist.startsWith("spotify:artist:");
    let id;

    switch(prefixURI){
        case true:
            id = artist.replace("spotify:artist:", "");
            break;
        case false:
            if(artist.indexOf('?') !== -1){
                id = artist.substring(artist.lastIndexOf('/') + 1, artist.lastIndexOf('?'));
            } else {
                id = artist.substring(artist.lastIndexOf('/') + 1);
            }
            break;
    }

    return id;
}

 async function searchArtistByName(artistName, msgDiscord){
    const search = await spotify.spotifyClient.searchArtists(artistName, { limit : 20, offset : 0 });
    
    const possibleArtists = search.body.artists.items;
    
    if(possibleArtists.length !== 0){
        const msgReply = await msgDiscord.reply('Which "_' + artistName + '_" are you looking for? (React with ✅ on the desired artist, ⛔ to cancel the search)');
        const artistDetails = await buildMessage(possibleArtists, 0);
    
        const result = await Promise.all([sendMessage(artistDetails, msgDiscord), await chooseArtist(possibleArtists, 0, msgDiscord)])
    
        const artistID = result.map(value => value)[1];
        msgReply.delete();
        if(artistID === ''){
            msgDiscord.reply('It seems that this *' + artistName + '* does not exist...');
        }
        return artistID;
    } else {
        msgDiscord.reply('It seems that this *' + artistName + '* does not exist...');
        return '';    
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
            artistName: currentArtist.name,
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
    await msgReaction.react('⛔');
}

async function chooseArtist(possibleArtists, number, msgDiscord){
    return new Promise ( returnArtistID => {
        listener = (reaction, user) => {
            if(reaction.emoji.name === '✅' && info.messageId === reaction.message.id && !user.bot){
                reaction.message.delete()
                returnArtistID(info)
            } else if(reaction.emoji.name === '❎' && info.messageId === reaction.message.id && !user.bot){
                if(number < possibleArtists.length - 1){
                    var aux = ++number;
                    reaction.message.delete().then(() => {
                        buildMessage(possibleArtists, aux).then( artistDetails => {
                            sendMessage(artistDetails, msgDiscord).then( () => {
                                chooseArtist(possibleArtists, aux, msgDiscord).then( result => {
                                    returnArtistID(result)
                                })
                            })
                        })
                    })
                } else {
                    reaction.message.delete();
                    returnArtistID('');
                }
            } else if(reaction.emoji.name === '⛔' && info.messageId === reaction.message.id && !user.bot){
                reaction.message.delete();
                returnArtistID(null);
            }
        }
    
        discordClient.on('messageReactionAdd', listener);
    })
}

discordClient.addListener('delete-reaction-add', () => {
    discordClient.removeListener('messageReactionAdd', listener)
})

exports.searchArtists = searchArtists;
exports.getId = getId;
exports.searchArtistByName = searchArtistByName;