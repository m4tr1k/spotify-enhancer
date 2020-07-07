const removeArtists = require('../src/checkReleases').removeArtistsGuild;

async function removeArtistsGuild(msgDiscord, content, cursor){
    const possibleArtists = content.join(' ').replace('-', "").split(',').map(item => item.trim());
    removeArtists(possibleArtists, cursor, msgDiscord);
}

exports.removeArtistsGuild = removeArtistsGuild