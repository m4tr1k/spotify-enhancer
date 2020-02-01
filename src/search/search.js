const spotifyProps = require('../../api/spotify-properties');

function searchArtists(artists){
    var aux = 0;
    return new Promise ( returnArray => {
        for(var i = 0; i < artists.length; i++){
            new Promise ( res => {
                res(i);
            }).then( number => {
                if(artists[number].startsWith("spotify:artist:")){
                    artists[number] = artists[number].replace("spotify:artist:", "");
                    aux++;
                    if(aux === artists.length){
                        returnArray(artists);
                    }
                } else {
                    new Promise ( resolve => {
                        spotifyProps.spotifyClient.searchArtists(artists[number], { limit : 20, offset : 0 }).then( dataArtist => {
                            if(dataArtist.body.artists.items.length !== 0){
                                const artistID = dataArtist.body.artists.items[0].id;
                                artists[number] = artistID;
                                resolve();
                            } else {
                                artists[number] = artists[number].replace(artists[number], "");
                                resolve();
                            }
                        })
                    }).then( () => {
                        aux++;
                        if(aux === artists.length){
                            returnArray(artists);
                        }
                    })
                }
            }) 
        }
    })
}

exports.searchArtists = searchArtists;