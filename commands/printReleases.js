const { releasesCommandsChannels, releasesChannels } = require('../api/discord-properties');
const { getReleases } = require('../src/releases/getReleases');
const { sendReleasesChannel } = require('../src/releases/sendReleases');
const { getSpotifyId } = require('../utils/utils');
const { ALBUM } = require('../constants/constants');

function printReleases(msgDiscord, content) {
    const isReleasesCommandsChannel = releasesCommandsChannels.some(releasesCommandsChannel => releasesCommandsChannel === msgDiscord.channel.id);
    if (isReleasesCommandsChannel) {
        if (content.length != 0) {
            const idReleasesChannels = releasesChannels.get(msgDiscord.guild.id);
            switch (idReleasesChannels.length) {
                case 0:
                    msgDiscord.channel.send("You don't have registered releases channels!");
                    break
                case 1:
                    sendReleases(msgDiscord, content, idReleasesChannels[0]);
                    break
                default:
                    printReleasesGuildChannel(msgDiscord, content, idReleasesChannels);
                    break
            }
        } else {
            msgDiscord.reply('This command needs arguments (type `!SE help` for more details)');
        }
    } else {
        msgDiscord.reply('You cannot execute this command here!');
    }
}

function printReleasesGuildChannel(msgDiscord, content, releasesChannels) {
    const releasesChannel = content.splice(content.length - 1, 1);
    const idReleasesChannel = releasesChannel[0].substring(2, releasesChannel[0].length - 1);

    if (releasesChannels.includes(idReleasesChannel)) {
        sendReleases(msgDiscord, content, idReleasesChannel);
    } else {
        msgDiscord.channel.send("You did not mention a correct channel or that channel is not a registered releases channel...");
    }
}

async function sendReleases(msgDiscord, content, idReleasesChannel) {
    const possibleAlbums = content.join(' ').split(',').map(item => item.trim());

    let idAlbums = [];

    for (const value of possibleAlbums) {
        const albumID = getSpotifyId(value, ALBUM);
        if (albumID !== undefined) {
            idAlbums.push(albumID);
        }
    }

    if (idAlbums.length > 0) {
        const albums = await getReleases(idAlbums);
        sendReleasesChannel(albums, idReleasesChannel);
        msgDiscord.channel.send("Desired releases printed!");
    } else {
        msgDiscord.channel.send("It was not possible to print the desired releases!");
    }
}

module.exports = {
    name: 'print',
    title: 'Print Releases',
    releasesCommand: true,
    description: 'Print the releases specified on the message.\nYou can use both Spotify URI and/or URL.\nIt is possible to print several releases using a comma `,`',
    note: '- You need to have registered releases channels in order to print releases!',
    usage: [
        '`!SE print SpotifyURI/URL, (...)`\nCommand for one releases channel',
        '`!SE print SpotifyURI/URL, (...) #name-channel`\nCommand for more than one releases channel'
    ],
    execute(msgDiscord, content) {
        printReleases(msgDiscord, content)
    }
}