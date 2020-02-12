const mongoose = require('mongoose');
const client = mongoose.connection

async function newConnection(){
    await mongoose.connect('mongodb://localhost:27017/spotify-enhancer', {useNewUrlParser: true, useUnifiedTopology: true});
}

async function checkConnection(){
    if(client.readyState === 0){
        await newConnection();
    }
}

async function findGuild(idServer){
    const number = await client.db.collection('guild').find({
        id: idServer
    }).count();
    return number;
}

async function insertGuildDB(idServer){
    await checkConnection();
    
    const number = await findGuild(idServer);

    if(number === 0){
        await client.db.collection('guild').insertOne({
            id: idServer
        })
    }

    await client.close();
}

async function removeGuildDB(idServer){
    await checkConnection();

    const number = await findGuild(idServer);

    if(number !== 0){
        await client.db.collection('guild').deleteOne({
            id: idServer
        })
    }

    await client.close();
}

exports.insertGuildDB = insertGuildDB
exports.removeGuildDB = removeGuildDB