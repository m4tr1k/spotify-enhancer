const axios = require('axios');
const Discord = require('discord.js');
const discordClient = require('../api/discord-properties').discordClient;
const spotify = require('../api/spotify-properties').client;
const db = require('../api/mongoDB-funcs');

var Album = function(props){
    this.nameAlbum = props.nameAlbum;
    this.artists = props.artists;
    this.featArtists = props.featArtists;
    this.label = props.label
    this.releaseDate = props.releaseDate;
    this.tracklist = props.tracklist;
    this.coverArt = props.coverArt;
    this.spotifyLink = props.spotifyLink;
}

function createEmbeds(albums, idGuildChannels){
    for(var i = 0; i < albums.length; i++){
        createEmbedAlbum(albums[i], idGuildChannels);
    }
}

function createEmbedAlbum(album, idGuildChannels){
    const title = album.artists + ' ' + album.featArtists + '\n' + album.nameAlbum;

    const splitDate = album.releaseDate.split('-');
    const releaseDate = splitDate[2] + '-' + splitDate[1] + '-' + splitDate[0];

    let description = 'Label: ' + album.label + '\n' + 'Release Date: ' + releaseDate;
    
    if(album.tracklist !== ''){
        description += '\n\nTracklist:\n' + album.tracklist + '\n[🎧 Spotify Link](' + album.spotifyLink + ')'; 
    }

    description += '\n\n[🎧 Spotify Link](' + album.spotifyLink + ')';

    const msg = createEmbed(title, description, album.coverArt);

    idGuildChannels.forEach(idGuildChannel => {
        const channel = discordClient.channels.cache.find(channel => channel.id === idGuildChannel);
        sendMessages(msg, channel);
    })
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
        featuredArtists = '(ft. ';
        for(var i = 0; i < trackArtists.length - 1; i++){
            featuredArtists += trackArtists[i] + ' & ';
        }
        featuredArtists += trackArtists[trackArtists.length - 1] + ')';
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

async function checkNewReleases(artist){
    const currentDate = new Date();
    currentDate.setHours(0,0,0,0);
    const latestAlbumObjects = await getLatestAlbumObjects(artist._id);
    const latestReleaseDate = new Date(latestAlbumObjects[0].release_date);

    if(latestReleaseDate >= currentDate){
        return await getAlbumInfos(latestAlbumObjects);
    } else {
        return [];
    }
}

async function getLatestReleases(artistId){
    const albums = await getLatestAlbumObjects(artistId);
    return await getAlbumInfos(albums);
}

async function getAlbumInfos(albums){
    let latestReleases = [];
    for(var i = 0; i < albums.length; i++){
        const fullAlbumDetails = await getFullAlbumDetails(albums[i].href);
        const artists = getAuthors(albums[i]);
        const nameAlbum = albums[i].name;
        
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
                releaseDate: albums[i].release_date,
                tracklist: tracklist,
                coverArt: fullAlbumDetails.images[0].url,
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
                releaseDate: albums[i].release_date,
                tracklist: '',
                coverArt: fullAlbumDetails.images[0].url,
                spotifyLink: link
            })
        }

        latestReleases.push(album);
    }

    return latestReleases;
}

async function getLatestAlbumObjects(artistId){
    let latestReleases = [];
    let dataAlbums;
    try{
        dataAlbums = await spotify.spotifyClient.getArtistAlbums(artistId, {offset: 0, include_groups: 'album,single,appears_on'})
    } catch (err){
        setTimeout(() => getLatestAlbumObjects(artistId), (err.headers['retry-after'] * 1000))
        return [];
    }

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
                latestReleases.push(dataAlbums.body.items[countAux]);
                countAux++;
            } else {
                existsMoreLatestReleases = false;
            }
        }
    } else {
        return [];
    }

    return latestReleases;
}

async function sendNewReleases(album, idGuildChannelArray){
    const artists = album.artists.split('&');
    for(var i = 0; i < artists.length; i++){
        let idGuildChannels = await db.getIdGuildsArtist(artists[i].trim());
        if(idGuildChannels.length !== 0){
            for(var j = 0; j < idGuildChannels.length; j++){
                if(idGuildChannelArray.includes(idGuildChannels[j])){
                    idGuildChannelArray.push(idGuildChannels[j]);
                }
            }
            
        }
    }
    createEmbedAlbum(album, idGuildChannelArray);
}

function sendMessages(msg, channel){
    channel.send(msg).then( lstMsg => {
        lstMsg.react('👍')
        .then(() => lstMsg.react('👎'))
        .then(() => lstMsg.react('❤️'));
    });
}

exports.checkNewReleases = checkNewReleases;
exports.sendNewReleases = sendNewReleases;
exports.getLatestReleases = getLatestReleases;
exports.createEmbeds = createEmbeds;
exports.createEmbedAlbum = createEmbedAlbum;
