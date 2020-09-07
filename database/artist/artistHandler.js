const mongoClient = require('../../api/mongoDB-properties');
const { insertArtistsDB, updateArtistsDB } = require('./addArtists');

async function addArtists(artists, idReleasesChannel) {
    //Artists that are registered in the database and on a certain guild
    const registeredArtistsGuildCursor = getRegisteredArtistsGuild(artists, idReleasesChannel);

    const registeredArtistsGuild = await registeredArtistsGuildCursor.next();
    let unregisteredArtists, unregisteredArtistsNames = [];

    if (registeredArtistsGuild === null) {
        unregisteredArtists = artists;
    } else {
        unregisteredArtists = artists.filter(artist => {
            if (!registeredArtistsGuild.artistNames.includes(artist.artistName)) {
                return artist;
            }
        });
    }

    if (unregisteredArtists.length > 0) {
        //Save the unregistered artists names to print later
        unregisteredArtistsNames = unregisteredArtists.map(artist => artist.artistName);

        //Artists that are registered in the database but not on a certain guild
        const registeredArtistsDBCursor = getRegisteredArtistsDB(unregisteredArtists);

        const registeredArtistsDB = await registeredArtistsDBCursor.next();

        if (registeredArtistsDB !== null) {
            await updateArtistsDB(registeredArtistsDB, idReleasesChannel);
            unregisteredArtists = unregisteredArtists.filter(artist => {
                if (!registeredArtistsDB.artistIds.includes(artist.artistId)) {
                    console.log(boas);
                    return artist;
                }
            })
        }

        if (unregisteredArtists.length > 0) {
            await insertArtistsDB(unregisteredArtists, idReleasesChannel);
        }
    }

    return unregisteredArtistsNames;
}

/**
    Returns object with an array of the artists that:
    - Are registered in the database 
    - Are registered on a certain guild
*/

function getRegisteredArtistsGuild(artists, idReleasesChannel) {
    const idArtists = artists.map(artist => artist.artistId);

    return mongoClient.collection('artist').aggregate([
        { $match: { _id: { $in: idArtists }, idGuildChannels: idReleasesChannel } },
        {
            $group: {
                _id: null,
                artistNames: { $addToSet: "$nameArtist" }
            }
        },
        {
            $project: {
                _id: 0,
                artistNames: 1
            }
        }
    ])
}

/**
    Returns object with an array of the artists (and their releases of that day) that:
    - Are registered in the database 
    - Are NOT registered on a certain guild
*/

function getRegisteredArtistsDB(artists) {
    const idArtists = artists.map(artist => artist.artistId);

    return mongoClient.collection('artist').aggregate([
        { $match: { _id: { $in: idArtists } } },
        { $unwind: "$latestReleases" },
        {
            $group: {
                _id: null,
                artistIds: { $addToSet: "$_id" },
                latestReleases: { $addToSet: "$latestReleases" }
            }
        },
        {
            $project: {
                _id: 0,
                artistIds: 1,
                latestReleases: 1 
            }
        }
    ])
}

async function removeArtistsDB(artistNames, idReleasesChannels, msgDiscord) {
    let removedArtists = false;
    for (var i = 0; i < artistNames.length; i++) {
        const newDocument = await client.collection('artist').updateOne(
            { nameArtist_lowerCase: artistNames[i].toLowerCase() },
            {
                $pull: { idGuildChannels: { $in: idReleasesChannels } }
            }
        )

        if (newDocument.result.nModified === 0) {
            msgDiscord.channel.send('**' + artistNames[i] + '** does not exist in the database!');
        } else {
            removedArtists = true;
        }
    }

    if (removedArtists) {
        msgDiscord.channel.send('Artists successfully deleted!');
    }
}

exports.addArtists = addArtists;