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
    let artistsIDs = [];
    for(var i = 0; i < artists.length; i++){
        if(artists[i].startsWith("spotify:artist:")){
            const id = artists[i].replace("spotify:artist:", "");
            const artist = await spotify.spotifyClient.getArtist(id);
            info = new InfoIDs({
                artistId: id,
                artistName: artist.body.name
            })
            artistsIDs.push(info);
        } else {
            const artist = await searchArtistByName(artists[i], msgDiscord);
            if(artist !== null){
                console.log(artist);
                artistsIDs.push(artist);
            }
        } 
    }
    return new Promise ( returnArtistArray => returnArtistArray(artistsIDs));
}

 async function searchArtistByName(artistName, msgDiscord){
    const search = await spotify.spotifyClient.searchArtists(artistName, { limit : 20, offset : 0 });
    
    const possibleArtists = search.body.artists.items;
    
    if(possibleArtists.length !== 0){
        const msgReply = await msgDiscord.reply('Which "_' + artistName + '_" are you looking for? (React with ✅ on the desired artist)');
        const artistDetails = await buildMessage(possibleArtists, 0);
    
        const result = await Promise.all([sendMessage(artistDetails, msgDiscord), await chooseArtist(possibleArtists, 0, msgDiscord)])
    
        const artistID = result.map(value => value)[1];
        msgReply.delete();
        if(artistID === null){
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
                    reaction.message.delete().then(returnArtistID(null));
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