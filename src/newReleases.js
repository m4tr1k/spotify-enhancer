const axios = require('axios');
const spotifyProps = require('../api/spotify-properties');

function createMessageNewReleases(artists, msgDiscord){
    var a;
    var messages = [];
    for(a = 0; a < artists.length; a++){
        new Promise ((resolve) => {
            resolve(a);
        }).then(a => {
            var artist = artists[a].trim();
            spotifyProps.spotifyClient.searchArtists(artist, { limit : 1, offset : 0 }).then( dataArtist => {
                if(dataArtist.body.artists.items.length !== 0){
                    const artistID = dataArtist.body.artists.items[0].id;
                    
                    spotifyProps.spotifyClient.getArtistAlbums(artistID, {offset: 0, include_groups: 'album,single'}).then( dataAlbum => {
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
                
                            axios.get(res.data.items[0].href, authOptions).then( res => {
                                var fullAlbum = res.data;
                
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
                    
                                    const latestRelease = '__**' + artistNames + ' - ' + album.name + '**__\n\nLabel: ' + fullAlbum.label + '\nRelease Date: ' + album.release_date + '\n\nTracklist:\n' + tracklist + '\n' + album.external_urls.spotify;
                                    if(!messages.includes(latestRelease)){
                                        messages.push(latestRelease);
                                        msgDiscord.channel.send(latestRelease).then( lstMsg => {
                                            lstMsg.react('👍')
                                            .then(() => lstMsg.react('👎'))
                                            .then(() => lstMsg.react('❤️'));
                                        }); 
                                    }
                                } else {
                                    const latestRelease = '__**' + artistNames + ' - ' + album.name + '**__\n\nLabel: ' + fullAlbum.label + '\nRelease Date: ' + album.release_date + '\n\n' + fullAlbum.tracks.items[0].external_urls.spotify;
                                    if(!messages.includes(latestRelease)){
                                        messages.push(latestRelease);
                                        msgDiscord.channel.send(latestRelease).then( lstMsg => {
                                            lstMsg.react('👍')
                                            .then(() => lstMsg.react('👎'))
                                            .then(() => lstMsg.react('❤️'));
                                        }); 
                                    }  
                                }
                            })
                        })
                    })
                } else {
                    msgDiscord.reply("it's seems that this __" + artist + '__ does not exist');
                }
            }, function(err){
                console.log(err);
                msgDiscord.reply('Something is not right');
            });
        })
    }
}

exports.createMessageNewReleases = createMessageNewReleases;
