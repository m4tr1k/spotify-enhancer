const axios = require('axios');
const spotify = require('../api/spotify-properties').client;
const db = require('../api/mongoDB-funcs')

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
                spotify.spotifyClient.getArtistAlbums(artistID, {offset: 0, include_groups: 'album,single'}).then( dataAlbum => {
                    if(dataAlbum.body.items.length === 0){
                        channel.send('**WARNING:** it seems the artist you chose does not have any release...')
                    } else {          
                        axios.get(dataAlbum.body.href, spotify.getAuthOptions()).then( res => {
                            var resultado = res.data.items;
                
                            resultado.sort((a, b) => a.release_date.localeCompare(b.release_date));
                            resultado.reverse();
                
                            const album = resultado[0];
                            const albumArtists = album.artists.filter(artist => {
                                if(!album.name.includes(artist.name)){
                                    return artist.name
                                }
                            }).map(artist => artist.name);
                            
                            var artistNames = '';
                
                            for(var i = 0; i < albumArtists.length - 1; i++){
                                artistNames += albumArtists[i] + ' & ';
                            }
                
                            artistNames += albumArtists[albumArtists.length - 1];
                
                            axios.get(album.href, spotify.getAuthOptions()).then( res => {
                                var fullAlbum = res.data;
                
                                if(fullAlbum.total_tracks > 1){
                                    var latestRelease = '__**' + artistNames + ' - ' + album.name + '**__\n\nLabel: ' + fullAlbum.label + '\nRelease Date: ';
                                    const splitDate = album.release_date.split('-');
                                    const releaseDate = splitDate[2] + '/' + splitDate[1] + '/' + splitDate[0];
                                    latestRelease += releaseDate + '\n\n';

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
                                    const trackArtists = fullAlbum.tracks.items[0].artists.filter(artist => {
                                        if(!albumArtists.includes(artist.name) && !fullAlbum.name.includes(artist.name)){
                                            return artist.name
                                        }
                                    }).map(artist => artist.name);

                                   if(trackArtists.length > 0){
                                       artistNames += ' (ft. ';
                                       for(var i = 0; i < trackArtists.length - 1; i++){
                                           artistNames += trackArtists[i] + ' & ';
                                       }
                                       artistNames += trackArtists[trackArtists.length - 1] + ')';
                                   }

                                    var latestRelease = '__**' + artistNames + ' - ' + album.name + '**__\n\nLabel: ' + fullAlbum.label + '\nRelease Date: ';
                                    const splitDate = album.release_date.split('-');
                                    const releaseDate = splitDate[2] + '/' + splitDate[1] + '/' + splitDate[0];
                                    latestRelease += releaseDate + '\n\n';

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

async function checkNewReleases(guild){
    const artistsNewReleases = [];
    const artists = guild.artists;
    const artistsIds = artists.map(artist => artist.idArtist);
    for(var i = 0; i < artists.length; i++){     
        const newestAlbum = await getLatestRelease(artistsIds, i);
        if(newestAlbum !== ''){
            if(artists[i].idLatestRelease !== newestAlbum.id){
                db.updateLatestRelease(artists[i].idArtist, newestAlbum.id, guild._id);
                const message = await createMessage(newestAlbum);
                if(!artistsNewReleases.includes(message)){
                    artistsNewReleases.push(message);
                }
            }
        }
    }
    return artistsNewReleases;
}

async function getLatestRelease(artists, number){
    const dataAlbums = await spotify.spotifyClient.getArtistAlbums(artists[number], {offset: 0, include_groups: 'album,single'})
    if(dataAlbums.body.items.length !== 0){
        const result = await axios.get(dataAlbums.body.href, spotify.getAuthOptions());
        const albums = result.data.items;
        albums.sort((a, b) => a.release_date.localeCompare(b.release_date));
        albums.reverse();

        return albums[0];
    } else {
        return '';
    }
}

async function createMessage(album){
    const albumArtists = album.artists.filter(artist => {
        if(!album.name.includes(artist.name)){
            return artist.name
        }
    }).map(artist => artist.name);                      
    var artistNames = '';

    for(var i = 0; i < albumArtists.length - 1; i++){
        artistNames += albumArtists[i] + ' & ';
    }

    artistNames += albumArtists[albumArtists.length - 1];

    const result = await axios.get(album.href, spotify.getAuthOptions());
    const fullAlbum = result.data;

    if(fullAlbum.total_tracks > 1){
        var latestRelease = '__**' + artistNames + ' - ' + album.name + '**__\n\nLabel: ' + fullAlbum.label + '\nRelease Date: ';
        const splitDate = album.release_date.split('-');
        const releaseDate = splitDate[2] + '/' + splitDate[1] + '/' + splitDate[0];
        latestRelease += releaseDate + '\n\n';

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
        return latestRelease;
    } else {
        const trackArtists = fullAlbum.tracks.items[0].artists.filter(artist => {
            if(!albumArtists.includes(artist.name) && !fullAlbum.name.includes(artist.name)){
                return artist.name
            }
        }).map(artist => artist.name);

       if(trackArtists.length > 0){
           artistNames += ' (ft. ';
           for(var i = 0; i < trackArtists.length - 1; i++){
               artistNames += trackArtists[i] + ' & ';
           }
           artistNames += trackArtists[trackArtists.length - 1] + ')';
       }

        var latestRelease = '__**' + artistNames + ' - ' + album.name + '**__\n\nLabel: ' + fullAlbum.label + '\nRelease Date: ';
        const splitDate = album.release_date.split('-');
        const releaseDate = splitDate[2] + '/' + splitDate[1] + '/' + splitDate[0];
        latestRelease += releaseDate + '\n\n';

        latestRelease += fullAlbum.tracks.items[0].external_urls.spotify;
        return latestRelease;
    }
}

function sendNewReleases(messages, channel){
    for(var i = 0; i < messages.length; i++){
        channel.send(messages[i]).then( lstMsg => {
            lstMsg.react('👍')
            .then(() => lstMsg.react('👎'))
            .then(() => lstMsg.react('❤️'));
        }); 
    }
}

exports.createMessageNewReleases = createMessageNewReleases;
exports.checkNewReleases = checkNewReleases;
exports.sendNewReleases = sendNewReleases;
exports.getLatestRelease = getLatestRelease;
