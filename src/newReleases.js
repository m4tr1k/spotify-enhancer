const axios = require('axios');
const spotifyProps = require('../api/spotify-properties');

function createMessageNewReleases(artistsIds, channel){
    var a;
    var messages = [];
    for(a = 0; a < artistsIds.length; a++){
        new Promise ((resolve) => {
            resolve(a);
        }).then(a => {
            var artistID = artistsIds[a];
            if(artistID === ''){
                channel.send('**WARNING:** it seems artist number ' + (a+1) + ' does not exist...');
            } else {
                spotifyProps.spotifyClient.getArtistAlbums(artistID, {offset: 0, include_groups: 'album,single'}).then( dataAlbum => {
                    if(dataAlbum.body.items.length === 0){
                        channel.send('**WARNING:** it seems the artist you chose does not have any release...')
                    } else {
                        var authOptions = {
                            headers: {
                                Authorization: 'Bearer ' + spotifyProps.spotifyClient.getAccessToken()
                            }
                        };
            
                        axios.get(dataAlbum.body.href, authOptions).then( res => {
                            var resultado = res.data.items;
                
                            resultado.sort((a, b) => a.release_date.localeCompare(b.release_date));
                            resultado.reverse();
                
                            const album = resultado[0];
                            const artists = album.artists;
                            var artistNames = '';
                
                            for(var i = 0; i < artists.length - 1; i++){
                                artistNames += artists[i].name + ' & ';
                            }
                
                            artistNames += artists[artists.length - 1].name;
                
                            axios.get(album.href, authOptions).then( res => {
                                var fullAlbum = res.data;
    
                                var latestRelease = '__**' + artistNames + ' - ' + album.name + '**__\n\nLabel: ' + fullAlbum.label + '\nRelease Date: ';
                                const splitDate = album.release_date.split('-');
                                const releaseDate = splitDate[2] + '/' + splitDate[1] + '/' + splitDate[0];
                                latestRelease += releaseDate + '\n\n';
                
                                if(fullAlbum.total_tracks > 1){
                                    var tracklist = "";
                                    const tracks = fullAlbum.tracks.items;
                    
                                    for(var i = 0; i < tracks.length; i++){
                                        tracklist += (i+1) + '. ' + tracks[i].name;
                                        if(tracks[i].artists.length > 1 && !tracks[i].name.toLowerCase().includes('remix')){
                                            const artists = tracks[i].artists;
                                            tracklist += ' (w/ ';
                                            for(var j = 1; j < artists.length - 1; j++){
                                                tracklist += artists[j].name + ' & ';
                                            }
                                            tracklist += artists[artists.length - 1].name + ')'; 
                                        }
                                        tracklist += '\n';
                                    }
                    
                                    latestRelease += 'Tracklist:\n' + tracklist + '\n' + album.external_urls.spotify;
                                    if(!messages.includes(latestRelease)){
                                        messages.push(latestRelease);
                                        channel.send(latestRelease).then( lstMsg => {
                                            lstMsg.react('👍')
                                            .then(() => lstMsg.react('👎'))
                                            .then(() => lstMsg.react('❤️'));
                                        }); 
                                    }
                                } else {
                                    latestRelease += fullAlbum.tracks.items[0].external_urls.spotify;
                                    if(!messages.includes(latestRelease)){
                                        messages.push(latestRelease);
                                        channel.send(latestRelease).then( lstMsg => {
                                            lstMsg.react('👍')
                                            .then(() => lstMsg.react('👎'))
                                            .then(() => lstMsg.react('❤️'));
                                        }); 
                                    }  
                                }
                            })
                        })
                    } 
                })
            }                
        })
    }
}

exports.createMessageNewReleases = createMessageNewReleases;
