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

async function insertArtistsDB(artists, guild, msgDiscord){
    let newArtists = false;
    for(var i = 0; i < artists.length; i++){
        const number = await client.collection('guild').find({
            _id: guild._id,
            artists: {
                idArtist: artists[i].artistId,
                nameArtist: artists[i].artistName,
                nameArtist_lowerCase: artists[i].artistName.toLowerCase()
            }
        }).count();
        if(number === 0){
            newArtists = true;
            await client.collection('guild').updateOne(
                {_id: guild._id},
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
        } else {
            msgDiscord.channel.send('**' + artists[i].artistName + '** is already registed in the database!');
        }           
    }

    if(newArtists){
        const artists = await getArtistsGuild(guild._id);
        const message = artists.join('\n');
        Promise.all([pastebin.editPaste(message, guild), msgDiscord.channel.send('Artists registered in the server successfully!')])
    }
}

async function removeArtistsDB(artistNames, guild){
    for(var i = 0; i < artistNames.length; i++){
        await client.collection('guild').updateOne(
            {_id: guild._id},
            {
                $pull: { artists: 
                    {
                        nameArtist_lowerCase: artistNames[i].toLowerCase()
                    }
                }
            }
        )
    }
    const artists = await getArtistsGuild(guild._id);
    const message = artists.join('\n');
    pastebin.editPaste(message, guild);
}

async function getArtistsGuild(idServer){
    await checkConnection();
    const cursor = client.db.collection('guild').find({
        _id: idServer
    })
    const guild = await cursor.next();
    const artists = guild.artists.map(artist => artist.nameArtist).sort();
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
exports.getPaste = getPaste