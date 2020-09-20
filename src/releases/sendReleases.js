const discordClient = require('../../api/discord-properties');
const { getArtistsReleasesChannels } = require('../../database/artist/getArtists')
const { createEmbeds, createEmbedAlbum } = require('./embedCreation');

/**
 * Send several releases to one channel (used in new command and in artist update) 
 */

function sendReleasesChannel(releases, idReleasesChannel){
    const releasesEmbeds = createEmbeds(releases);
    const channel = discordClient.channels.cache.find(channel => channel.id === idReleasesChannel);

    for(const releaseEmbed of releasesEmbeds){
        releaseEmbed.send(channel);
    }
}

/**
 * Send one release to several channels (used in hourly releases search)
 */

async function sendReleaseChannels(release){
    const releaseEmbed = createEmbedAlbum(release.album);
    const releasesChannelsCursor = getArtistsReleasesChannels(release.artistIds);
    const releasesChannels = await releasesChannelsCursor.next();

    for(const idReleasesChannel of releasesChannels.idChannels){
        const channel = discordClient.channels.cache.find(channel => channel.id === idReleasesChannel);
        releaseEmbed.send(channel);
    }
}

exports.sendReleasesChannel = sendReleasesChannel;
exports.sendReleaseChannels = sendReleaseChannels;