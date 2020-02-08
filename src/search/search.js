const spotifyClient = require('../../api/spotify-properties').spotifyClient;
const searchArtistByName = require('./chooseArtist');

function searchArtists(artists, msgDiscord){
    var aux = 0;
    return new Promise ( returnArray => {
        for(var i = 0; i < artists.length; i++){
            new Promise ( res => {
                res(i);
            }).then( number => {
                new Promise ( resolve => {
                    if(artists[number].startsWith("spotify:artist:")){
                        artists[number] = artists[number].replace("spotify:artist:", "");
                        resolve();
                    } else {
                        spotifyClient.searchArtists(artists[number], { limit : 20, offset : 0 }).then( dataArtist => {
                            if(dataArtist.body.artists.items.length !== 0){
                                var possibleArtists = dataArtist.body.artists.items;
                                msgDiscord.reply('Which "_' + artists[number] + '_" are you looking for? (React with ✅ on the desired artist)').then( msg => {
                                    searchArtistByName.chooseArtist(msgDiscord, possibleArtists, 0).then( artistID => {
                                        msg.delete().then( () => {
                                            artists[number] = artistID;
                                            resolve();
                                        })
                                    });
                                })
                            } else {
                                artists[number] = artists[number].replace(artists[number], "");
                                resolve();
                            }
                        })
                }
                }).then( () => {
                    aux++;
                    if(aux === artists.length){
                        returnArray(artists);
                    }
                }) 
            })
        }
    })
}

exports.searchArtists = searchArtists;