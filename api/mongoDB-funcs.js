const mongoose = require('mongoose');
const client = mongoose.connection;
const pastebin = require('./pastebin-properties');
const releases = require('../src/releases');

async function newConnection(){
    await mongoose.connect('mongodb://localhost:27017/spotify-enhancer', {useNewUrlParser: true, useUnifiedTopology: true});
}

async function checkConnection(){
    if(client.readyState === 0){
        await newConnection();
    }
}

async function findChannel(idChannel){
    await checkConnection();
    const cursor = client.db.collection('guild').find({
        idReleasesCommandsChannel: idChannel
    });
    return cursor
}

async function findGuild(idServer){
    const number = await client.db.collection('guild').find({
        _id: idServer
    }).count();
    return number;
}

async function insertGuildDB(idServer, idReleasesChannel, idReleasesCommandsChannel){
    await checkConnection();
    
    const number = await findGuild(idServer);

    if(number === 0){
        await client.db.collection('guild').insertOne({
            _id: idServer, 
            idReleasesChannel: idReleasesChannel,
            idReleasesCommandsChannel: idReleasesCommandsChannel
        })
    }
}

async function removeGuildDB(idServer){
    await checkConnection();

    const number = await findGuild(idServer);

    if(number !== 0){
        await client.db.collection('guild').deleteOne({
            _id: idServer
        })
    }
}

async function insertArtistsDB(artists, guild, msgDiscord){
    let newArtists = false;
    let artistsAddedDB = '**';
    for(var i = 0; i < artists.length; i++){
        const cursor = client.collection('artist').find({
            _id: artists[i].artistId
        })
        const isArtistDB = await cursor.hasNext();
        if(isArtistDB){
            const artist = await cursor.next();
            if(artist.idGuildChannels.includes(guild.idReleasesChannel)){
                msgDiscord.channel.send('**' + artists[i].artistName + '** is already registed in the database!'); 
            } else {
                const document = await client.collection('artist').findOneAndUpdate(
                    {_id: artists[i].artistId},
                    {
                        $push: { idGuildChannels: guild.idReleasesChannel }
                    }
                )
                
                const currentDate = new Date();
                const releaseDate = new Date(document.value.latestReleases[0].releaseDate);
                currentDate.setHours(0,0,0,0);

                if(releaseDate >= currentDate){
                    const idGuildChannel = [];
                    idGuildChannel.push(guild.idReleasesChannel);
                    releases.createEmbeds(document.value.latestReleases, idGuildChannel);
                }
                if(artistsAddedDB === '**'){
                    artistsAddedDB += artists[i].artistName;
                } else {
                    artistsAddedDB += ', ' + artists[i].artistName;
                }
                newArtists = true;
            }
        } else {
            const latestReleases = await releases.getLatestReleases(artists[i].artistId);
            const currentDate = new Date();
            const releaseDate = new Date(latestReleases[0].releaseDate);
            currentDate.setHours(0,0,0,0);

            if(releaseDate >= currentDate){
                const idGuildChannel = [];
                idGuildChannel.push(guild.idReleasesChannel);
                releases.createEmbeds(latestReleases, idGuildChannel);
            }

            await client.collection('artist').insertOne({
                _id: artists[i].artistId,
                nameArtist: artists[i].artistName,
                nameArtist_lowerCase: artists[i].artistName.toLowerCase(),
                latestReleases: latestReleases,
                idGuildChannels: [
                    guild.idReleasesChannel
                ]
            })
            if(artistsAddedDB === '**'){
                artistsAddedDB += artists[i].artistName;
            } else {
                artistsAddedDB += ', ' + artists[i].artistName;
            }
            newArtists = true;
        }           
    }

    if(newArtists){
        artistsAddedDB += '**';
        const message = await getArtistsGuild(guild.idReleasesChannel);
        Promise.all([pastebin.editPaste(message, guild), msgDiscord.channel.send(artistsAddedDB + ' registered in the server successfully!')])
    }
}

async function removeArtistsDB(artistNames, guild, msgDiscord){
    let removedArtists = false;
    for(var i = 0; i < artistNames.length; i++){
        const newDocument = await client.collection('artist').updateOne(
            {nameArtist_lowerCase: artistNames[i].toLowerCase()},
            {
                $pull: { idGuildChannels: guild.idReleasesChannel }
            }
        )

        if(newDocument.result.nModified === 0){
            msgDiscord.channel.send('**' + artistNames[i] + '** does not exist in the database!');
        } else {
            removedArtists = true;
        }
    }

    if(removedArtists){
        const message = await getArtistsGuild(guild.idReleasesChannel);
        Promise.all([pastebin.editPaste(message, guild), msgDiscord.channel.send('Artists successfully deleted!')])
    }
}

async function getArtistsGuild(idReleasesChannel){
    await checkConnection();

    let artists = '';
    const cursor = client.db.collection('artist').find({
        idGuildChannels: idReleasesChannel
    }).sort({nameArtist: 1});

    let hasNextArtist = await cursor.hasNext();
    while(hasNextArtist){
        const artist = await cursor.next();
        artists += artist.nameArtist + '\n';
        hasNextArtist = await cursor.hasNext();
    }

    return artists;
}

async function getPaste(idServer){
    await checkConnection();
    const cursor = await client.db.collection('guild').find({
        _id: idServer
    }, {projection: {idPaste: 1, _id: 0}}).toArray();
    const idPaste = cursor.map(obj => obj.idPaste)
    return idPaste[0]; 
}

async function getAllArtists(){
    await checkConnection();
    const cursor = client.db.collection('artist').find({
        idGuildChannels: { $exists: true, $ne: [] }
    })
    return cursor;
}

async function getIdGuildsArtist(artistName){
    await checkConnection();
    const cursor = await client.db.collection('artist').find({
        nameArtist: artistName
    }).toArray();
    const idGuildChannels = cursor.map(obj => obj.idGuildChannels);
    return idGuildChannels;
}

exports.insertGuildDB = insertGuildDB
exports.removeGuildDB = removeGuildDB
exports.insertArtistsDB = insertArtistsDB
exports.findChannel = findChannel
exports.client = client
exports.removeArtistsDB = removeArtistsDB
exports.getPaste = getPaste
exports.getAllArtists = getAllArtists
exports.getIdGuildsArtist = getIdGuildsArtist