const mongoose = require('mongoose');
const client = mongoose.connection;
const pastebin = require('./pastebin-properties');

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
    for(var i = 0; i < artists.length; i++){
        const cursor = client.collection('artist').find({
            _id: artists[i].artistId
        })
        const isArtistDB = await cursor.hasNext();
        if(isArtistDB){
            const artist = await cursor.next();
            if(artist.idGuilds.includes(guild._id)){
                msgDiscord.channel.send('**' + artists[i].artistName + '** is already registed in the database!'); 
            } else {
                await client.collection('artist').updateOne(
                    {_id: artists[i].artistId},
                    {
                        $push: { idGuilds: guild._id}
                    }
                )
                newArtists = true;
            }
        } else {
            await client.collection('artist').insertOne({
                _id: artists[i].artistId,
                nameArtist: artists[i].artistName,
                nameArtist_lowerCase: artists[i].artistName.toLowerCase(),
                idLatestReleases: [],
                idGuilds: [
                    guild._id
                ]
            })
            newArtists = true;
        }           
    }

    if(newArtists){
        const message = await getArtistsGuild(guild._id);
        Promise.all([pastebin.editPaste(message, guild), msgDiscord.channel.send('Artists registered in the server successfully!')])
    }
}

async function removeArtistsDB(artistNames, guild, msgDiscord){
    let removedArtists = false;
    for(var i = 0; i < artistNames.length; i++){
        const newDocument = await client.collection('artist').updateOne(
            {nameArtist_lowerCase: artistNames[i].toLowerCase()},
            {
                $pull: { idGuilds: guild._id }
            }
        )

        if(newDocument.result.nModified === 0){
            msgDiscord.channel.send('This artist does not exist in the database!');
        } else {
            removedArtists = true;
        }
    }

    if(removedArtists){
        const message = await getArtistsGuild(guild._id);
        Promise.all([pastebin.editPaste(message, guild), msgDiscord.channel.send('Artists successfully deleted!')])
    }
}

async function getArtistsGuild(idServer){
    await checkConnection();

    let artists = '';
    const cursor = client.db.collection('artist').find({
        idGuilds: idServer
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

exports.insertGuildDB = insertGuildDB
exports.removeGuildDB = removeGuildDB
exports.insertArtistsDB = insertArtistsDB
exports.findChannel = findChannel
exports.client = client
exports.removeArtistsDB = removeArtistsDB
exports.getPaste = getPaste