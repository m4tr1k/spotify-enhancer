const axios = require('axios');
const Discord = require('discord.js');
const spotify = require('../api/spotify-properties').client;

var Album = function(props){
    this.nameAlbum = props.nameAlbum;
    this.artists = props.artists;
    this.featArtists = props.featArtists;
    this.label = props.label
    this.releaseDate = props.releaseDate;
    this.tracklist = props.tracklist;
    this.spotifyLink = props.spotifyLink;
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
        const releaseDate = 'Release Date: ' + splitDate[2] + '-' + splitDate[1] + '-' + splitDate[0];
        
        let description;
        let title;
        if(fullAlbumDetails.total_tracks > 1){
            title = artists + '\n' + nameAlbum;
            const tracklist = getTracklist(fullAlbumDetails, artists, title);
            const link = album.external_urls.spotify;
            description = label + '\n' + releaseDate + '\n\nTracklist:\n' + tracklist + '\n[🎧 Spotify Link](' + link + ')'; 
        } else {
            const featuredArtists = getFeaturedArtists(fullAlbumDetails, artists)
            if(featuredArtists !== ''){
                title = artists + ' ' + featuredArtists + '\n' + nameAlbum;
            } else {
                title = artists + '\n' + nameAlbum;
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
    return new Discord.MessageEmbed()
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

    let featuredArtists = '';
    if(trackArtists.length > 0){
        for(var i = 0; i < trackArtists.length - 1; i++){
            featuredArtists += trackArtists[i] + ' & ';
        }
        featuredArtists += trackArtists[trackArtists.length - 1];
    }

   return featuredArtists;
}

function getTracklist(fullAlbumDetails, titleArtists, title){
    let tracklist = '';
    const tracks = fullAlbumDetails.tracks.items;

    for(var i = 0; i < tracks.length; i++){
        tracklist += (i+1) + '. ' + tracks[i].name;
        if(tracks[i].artists.length > 1 && !tracks[i].name.toLowerCase().includes('remix')){
            const artistNames = tracks[i].artists.filter(artist => {
                if(!titleArtists.includes(artist.name) && !title.includes(artist.name)){
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
    const currentDate = new Date();
    const artistsNewReleases = [];
    const artists = guild.artists;
    const artistsIds = artists.map(artist => artist.idArtist);
    for(var i = 0; i < artists.length; i++){     
        const newestAlbums = await getLatestReleases(artistsIds[i]);
        if(newestAlbums !== ''){
            const releaseDate = Date.parse(newestAlbums.release_date);
            if(releaseDate > currentDate){
                if(!artistsNewReleases.some(obj => obj.uri === newestAlbums.uri)){
                    artistsNewReleases.push(newestAlbums);
                }
            }
        }
    }
    return artistsNewReleases;
}

async function getLatestReleases(artistId){
    const albums = await getLatestAlbumObjects(artistId);
    let latestReleases = [];

    for(var i = 0; i < albums.length; i++){
        const fullAlbumDetails = await getFullAlbumDetails(albums[i].href);
        const artists = getAuthors(albums[i]);
        const nameAlbum = albums[i].name;
        const splitDate = albums[i].release_date.split('-');
        const releaseDate = splitDate[2] + '-' + splitDate[1] + '-' + splitDate[0];
        
        let link;
        let tracklist;
        let featuredArtists;
        let album;

        if(fullAlbumDetails.total_tracks > 1){
            const title = artists + '\n' + nameAlbum;
            tracklist = getTracklist(fullAlbumDetails, artists, title);
            link = albums[i].external_urls.spotify;
            album = new Album({
                nameAlbum: nameAlbum,
                artists: artists,
                featArtists: '',
                label: fullAlbumDetails.label,
                releaseDate: releaseDate,
                tracklist: tracklist,
                spotifyLink: link
            })
        } else {
            featuredArtists = getFeaturedArtists(fullAlbumDetails, artists);
            link = fullAlbumDetails.tracks.items[0].external_urls.spotify;
            album = new Album({
                nameAlbum: nameAlbum,
                artists: artists,
                featArtists: featuredArtists,
                label: fullAlbumDetails.label,
                releaseDate: releaseDate,
                tracklist: '',
                spotifyLink: link
            })
        }

        

        latestReleases.push(album);
    }

    return latestReleases;
}

async function getLatestAlbumObjects(artistId){
    let latestReleases = [];
    const dataAlbums = await spotify.spotifyClient.getArtistAlbums(artistId, {offset: 0, include_groups: 'album,single,appears_on'})
    if(dataAlbums.body.items.length !== 0){
        dataAlbums.body.items.sort((a, b) => a.release_date.localeCompare(b.release_date));
        dataAlbums.body.items.reverse();

        let count = 0;

        while(dataAlbums.body.items[count].album_type === 'compilation'){
            count++;
        }

        latestReleases.push(dataAlbums.body.items[count]);

        let existsMoreLatestReleases = true;
        let countAux = count + 1;
        
        while(existsMoreLatestReleases && countAux < 20){
            if(dataAlbums.body.items[countAux].release_date === dataAlbums.body.items[count].release_date){
                latestReleases.push(dataAlbums.body.items[count]);
                countAux++;
            } else {
                existsMoreLatestReleases = false;
            }
        }
    }

    return latestReleases;
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

exports.checkNewReleases = checkNewReleases;
exports.sendNewReleases = sendNewReleases;
exports.getLatestReleases = getLatestReleases;
exports.createEmbeds = createEmbeds;
