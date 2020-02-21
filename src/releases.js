const axios = require('axios');
const Discord = require('discord.js');
const spotify = require('../api/spotify-properties').client;
const db = require('../api/mongoDB-funcs')

async function createMessageNewReleases(artistsIds, channel){
    const albums = [];
    for(var i = 0; i < artistsIds.length; i++){
        const album = await getLatestRelease(artistsIds, i);
        if(!albums.some(obj => obj.uri === album.uri)){
            albums.push(album);
        }
    }
    const messages = await createEmbeds(albums);
    sendNewReleases(messages, channel);
}

async function createEmbeds(albums){
    var messages = [];
    for(var i = 0; i < albums.length; i++){
        const album = albums[i];
        const fullAlbumDetails = await getFullAlbumDetails(album.href);
        const artists = getAuthors(album);
        const nameAlbum = album.name;
        const label = 'Label: ' + fullAlbumDetails.label;
        const splitDate = album.release_date.split('-');
        const releaseDate = 'Release Date: ' + splitDate[2] + '/' + splitDate[1] + '/' + splitDate[0];
        
        let description;
        let title;
        if(fullAlbumDetails.total_tracks > 1){
            const tracklist = getTracklist(fullAlbumDetails, artists);
            const link = album.external_urls.spotify;
            title = artists + ' - ' + nameAlbum;
            description = label + '\n' + releaseDate + '\n\nTracklist:\n' + tracklist + '\n[🎧 Spotify Link](' + link + ')'; 
        } else {
            const featuredArtists = getFeaturedArtists(fullAlbumDetails, artists)
            if(featuredArtists !== undefined){
                title = artists + ' ' + featuredArtists + ' - ' + nameAlbum;
            } else {
                title = artists + ' - ' + nameAlbum;
            }
            const link = fullAlbumDetails.tracks.items[0].external_urls.spotify;
            
            description = label + '\n' + releaseDate + '\n\n[🎧 Spotify Link](' + link + ')';
        }

        //Creates embed based on info gathered
        const msg = createEmbed(title, description, fullAlbumDetails.images[0].url);
        
        if(!messages.includes(msg)){
            messages.push(msg);
        }
    }

    return messages;
}

function createEmbed(title, description, urlImage){
    return new Discord.RichEmbed()
        .setColor('#1DB954')
        .setTitle(title)
        .setDescription(description)
        .setThumbnail(urlImage)
}

async function getFullAlbumDetails(href){
    const result = await axios.get(href, spotify.getAuthOptions());
    const fullAlbumDetails = result.data;
    return fullAlbumDetails;
}

function getAuthors(album){
    const albumArtists = album.artists.filter(artist => {
        if(!album.name.includes(artist.name)){
            return artist.name
        }
    }).map(artist => artist.name);                      
    var authors = '';

    for(var i = 0; i < albumArtists.length - 1; i++){
        authors += albumArtists[i] + ' & ';
    }

    authors += albumArtists[albumArtists.length - 1];
    return authors
}

function getFeaturedArtists(fullAlbumDetails, artists){
    const trackArtists = fullAlbumDetails.tracks.items[0].artists.filter(artist => {
        if(!artists.includes(artist.name) && !fullAlbumDetails.name.includes(artist.name)){
            return artist.name
        }
    }).map(artist => artist.name);

    let featuredArtists;
    if(trackArtists.length > 0){
        featuredArtists = ' (ft. ';
        for(var i = 0; i < trackArtists.length - 1; i++){
            featuredArtists += trackArtists[i] + ' & ';
        }
        featuredArtists += trackArtists[trackArtists.length - 1] + ')';
    }

   return featuredArtists;
}

function getTracklist(fullAlbumDetails, titleArtists){
    let tracklist = '';
    const tracks = fullAlbumDetails.tracks.items;

    for(var i = 0; i < tracks.length; i++){
        tracklist += (i+1) + '. ' + tracks[i].name;
        if(tracks[i].artists.length > 1 && !tracks[i].name.toLowerCase().includes('remix')){
            const artistNames = tracks[i].artists.filter(artist => {
                if(!titleArtists.includes(artist.name)){
                    return artist.name
                }
            }).map(artist => artist.name);
            if(artistNames.length !== 0){
                tracklist += ' (w/ ';
                for(var j = 1; j < artistNames.length - 1; j++){
                    tracklist += artistNames[j] + ' & ';
                }
                tracklist += artistNames[artistNames.length - 1] + ')';
            }
        }
        tracklist += '\n';
    }

    return tracklist;
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
                if(!artistsNewReleases.some(obj => obj.uri === newestAlbum.uri)){
                    artistsNewReleases.push(newestAlbum);
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
exports.createEmbeds = createEmbeds;
