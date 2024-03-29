const spotify = require('../../api/spotify-properties');
const { getSpotifyId } = require('../../utils/utils');
const { ARTIST } = require('../../constants/constants');

var InfoIDs = function(props){
    this.artistId = props.artistId;
    this.artistName = props.artistName;
}

async function searchArtists(artists, msgDiscord){
    let artistsInfos = [];
    let artistIDs = [];
    for(var i = 0; i < artists.length; i++){
        if(artists[i] !== ''){
            const id = getSpotifyId(artists[i], ARTIST);
            if(id !== undefined){
                artistIDs.push(id);
            } else {
                const artist = await searchArtistByName(artists[i], msgDiscord);
                if(artist !== ''){
                    const artistInfo = new InfoIDs({
                        artistId: artist.id,
                        artistName: artist.name
                    })
                    artistsInfos.push(artistInfo);
                }
            }           
        }
    }

    if(artistIDs.length != 0){
        const artistDetails = await spotify.client.getArtists(artistIDs);

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

 async function searchArtistByName(artistName, msgDiscord){
    const search = await spotify.client.searchArtists(artistName, { limit : 20, offset : 0 });
    
    const possibleArtists = search.body.artists.items;
    
    if(possibleArtists.length !== 0){
        const msgReply = await msgDiscord.reply('Which "_' + artistName + '_" are you looking for? (React with ✅ on the desired artist, ⛔ to cancel the search)');
    
        const msg = await sendMessage(msgDiscord, possibleArtists[0])
        const artistID = await chooseArtist(possibleArtists, 0, msg, msgDiscord.author.id)
    
        msg.delete();

        switch(artistID){
            case undefined:
                msgReply.edit('It seems that this *' + artistName + '* does not exist...');
                return '';
            case null:
                msgReply.delete();
                return '';
            default: 
                msgReply.delete();
                return artistID;
        }
    } else {
        msgDiscord.reply('It seems that this *' + artistName + '* does not exist...');
        return '';    
    }
}

async function sendMessage(msgDiscord, possibleArtist){
    const artistDetails = buildMessage(possibleArtist);
    const msg = await msgDiscord.channel.send(artistDetails);
    await msg.react('✅');
    await msg.react('❎');
    await msg.react('⛔');
    return msg;
}

function buildMessage(possibleArtist){
    var artistDetails = '**' + possibleArtist.name + '** (' + possibleArtist.external_urls.spotify + ')' + '\nGenres: ';
    if(possibleArtist.genres.length === 0){
        artistDetails += '*(not specified)*';
    } else {
        for(var l = 0; l < possibleArtist.genres.length - 1; l++){
            artistDetails += possibleArtist.genres[l] + ', ';
        }
        artistDetails += possibleArtist.genres[possibleArtist.genres.length - 1];
    }

    return artistDetails;
}

async function editMessage(artistsDetails, msg, authorID){
    Promise.all([msg.edit(artistsDetails), msg.reactions.cache.get('❎').users.remove(authorID)])
}

async function chooseArtist(possibleArtists, number, msg, authorID){
    const collectionReaction = await msg.awaitReactions((reaction, user) => (reaction.emoji.name === '✅' || reaction.emoji.name === '❎' || reaction.emoji.name === '⛔') && user.id === authorID, { time: 20000, max: 1 })
    if(collectionReaction.size !== 0){
        const reaction = collectionReaction.first();
        switch(reaction.emoji.name){
            case '✅':
                return possibleArtists[number];
            case '❎':
                if(possibleArtists.length > number + 1){
                    const artistDetails = buildMessage(possibleArtists[++number]);
                    await editMessage(artistDetails, msg, authorID);
                    return chooseArtist(possibleArtists, number++, msg, authorID);
                } else {
                    return undefined;
                }
            case '⛔':
                return null;
        }
    } else {
        return '';
    }
}

exports.searchArtists = searchArtists;
exports.searchArtistByName = searchArtistByName;