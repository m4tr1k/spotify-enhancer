const mongoose = require('mongoose');
const client = mongoose.connection
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
    const cursor = await client.db.collection('guild').find({
        idReleasesChannel: idChannel
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

async function insertArtistsDB(artistsIds, idServer){
    for(var i = 0; i < artistsIds.length; i++){
        const latestRelease = await releases.getLatestRelease(artistsIds, i);
        const idLatestRelease = latestRelease.id

        const number = await client.collection('guild').find({
            _id: idServer,
            artists: {
                idArtist: artistsIds[i],
                idLatestRelease: idLatestRelease
            }
        }).count();
        console.log(number);
        if(number === 0){
            await client.collection('guild').updateOne(
                {_id: idServer},
                {
                    $push: { artists: 
                        { 
                            idArtist: artistsIds[i],
                            idLatestRelease: idLatestRelease
                        } 
                    } 
                }
            )
        }            
    }
}

async function removeArtistsDB(artistsIds, idServer){
    for(var i = 0; i < artistsIds.length; i++){
        await client.collection('guild').updateOne(
            {_id: idServer},
            {
                $pull: { artists: 
                    {
                        idArtist: artistsIds[i]
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

async function updateLatestRelease(idArtist, updatedIdRelease, idServer){
    await client.collection('guild').updateOne(
        {
            _id: idServer,
            artists: {
                idArtist: idArtist
            }
        },
        {
            artists: {
                idLatestRelease: updatedIdRelease
            }
        }
    )
}

exports.insertGuildDB = insertGuildDB
exports.removeGuildDB = removeGuildDB
exports.insertArtistsDB = insertArtistsDB
exports.findChannel = findChannel
exports.client = client
exports.getAllGuilds = getAllGuilds
exports.updateLatestRelease = updateLatestRelease
exports.removeArtistsDB = removeArtistsDB