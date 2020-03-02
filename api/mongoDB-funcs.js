const mongoose = require('mongoose');
const client = mongoose.connection;

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
    const cursor = await client.db.collection('guild').find({
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

async function insertGuildDB(idServer, idReleasesChannel){
    await checkConnection();
    
    const number = await findGuild(idServer);

    if(number === 0){
        await client.db.collection('guild').insertOne({
            _id: idServer, 
            idReleasesChannel: idReleasesChannel,
            artists: []
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

async function insertArtistsDB(artists, idServer){
    for(var i = 0; i < artists.length; i++){
        const number = await client.collection('guild').find({
            _id: idServer,
            artists: {
                idArtist: artists[i].artistId,
                nameArtist: artists[i].artistName,
                nameArtist_lowerCase: artists[i].artistName.toLowerCase()
            }
        }).count();
        console.log(number);
        if(number === 0){
            await client.collection('guild').updateOne(
                {_id: idServer},
                {
                    $push: { artists: 
                        { 
                            idArtist: artists[i].artistId,
                            nameArtist: artists[i].artistName,
                            nameArtist_lowerCase: artists[i].artistName.toLowerCase()
                        } 
                    } 
                }
            )
        }            
    }
}

async function removeArtistsDB(artistNames, idServer){
    for(var i = 0; i < artistNames.length; i++){
        await client.collection('guild').updateOne(
            {_id: idServer},
            {
                $pull: { artists: 
                    {
                        nameArtist_lowerCase: artistNames[i].toLowerCase()
                    }
                }
            }
        )
    }
}

async function getAllGuilds(){
    await checkConnection();
    const cursor = client.collection('guild').find();
    return cursor;
}

exports.insertGuildDB = insertGuildDB
exports.removeGuildDB = removeGuildDB
exports.insertArtistsDB = insertArtistsDB
exports.findChannel = findChannel
exports.client = client
exports.getAllGuilds = getAllGuilds
exports.removeArtistsDB = removeArtistsDB