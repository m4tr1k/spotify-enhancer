const discordClient = require('../../api/discord-properties');
const { createEmbeds, createEmbedAlbum } = require('./embedCreation');

function sendReleasesChannel(releases, idReleasesChannel){
    const releasesEmbeds = createEmbeds(releases);
    const channel = discordClient.channels.cache.find(channel => channel.id === idReleasesChannel);

    for(const releaseEmbed of releasesEmbeds){
        releaseEmbed.send(channel);
    }
}

function sendReleaseChannels(release, idReleasesChannels){
    const releaseEmbed = createEmbedAlbum(release);

    for(const idReleasesChannel of idReleasesChannels){
        const channel = discordClient.channels.cache.find(channel => channel.id === idReleasesChannel);
        releaseEmbed.send(channel);
    }
}

exports.sendReleasesChannel = sendReleasesChannel;
exports.sendReleaseChannels = sendReleaseChannels;