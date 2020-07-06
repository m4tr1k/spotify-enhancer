const checkReleases = require('../src/checkReleases');

async function removeArtistsGuild(msgDiscord, content, cursor){
    const possibleArtists = content.join(' ').replace('-', "").split(',').map(item => item.trim());
    checkReleases.removeArtistsGuild(possibleArtists, cursor, msgDiscord);
}

exports.removeArtistsGuild = removeArtistsGuild