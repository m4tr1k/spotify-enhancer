const mongoClient = require('../../api/mongoDB-properties');

async function updateNewReleases(newestRelease) {
    await mongoClient.collection('artist').updateMany(
        { _id: { $in: newestRelease.artistIds }, latestReleases: { $ne: newestRelease.album } },
        { $push: { latestReleases: newestRelease.album } }
    )
}

async function removeOldReleases(oldReleases, artistID) {
    await mongoClient.collection('artist').updateOne(
        { _id: artistID },
        { $pull: { latestReleases: { $in: oldReleases } } }
    )
}

exports.updateNewReleases = updateNewReleases;
exports.removeOldReleases = removeOldReleases;