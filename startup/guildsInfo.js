const discordClient = require('../api/discord-properties');

const getGuildsInfo = require('../api/mongoDB-funcs').getGuildsInfo;
const removeGuilds = require('../api/mongoDB-funcs').removeGuildsDB;
const removeReleasesChannels = require('../api/mongoDB-funcs').removeReleasesChannels;

async function loadGuildsInfo(){
    const guildsInfoCursor = getGuildsInfo();
    let guildInfo = await guildsInfoCursor.next();

    if(guildInfo !== null){
        let unregisteredGuilds = [];
        while(guildInfo !== null){
            const guild = discordClient.guilds.cache.get(guildInfo._id);

            if(guild === undefined){
                unregisteredGuilds.push(guildInfo);
            } else {
                const unregisteredChannels = loadReleasesChannels(guildInfo);
                if(unregisteredChannels.length > 0){
                    removeReleasesChannels(unregisteredChannels, guildInfo._id);
                }
            }

            guildInfo = await guildsInfoCursor.next();
        }

        if(unregisteredGuilds.length > 0){
            console.log('The bot was kicked/banned from ' + unregisteredGuilds.length + ' guilds while it was offline :(');
            await removeGuilds(unregisteredGuilds);
            console.log('All the info regarding those guilds was deleted')
        }
    }
}

function loadReleasesChannels(guildInfo){
    let unregisteredChannels = [];
    let registeredChannels = [];

    for(const idChannel of guildInfo.idReleasesChannels){
        const channel = discordClient.channels.cache.get(idChannel);
        if(channel === undefined){
            unregisteredChannels.push(idChannel);
        } else {
            registeredChannels.push(idChannel);
        }
    }

    discordClient.releasesChannels.set(guildInfo._id, registeredChannels);
    discordClient.releasesCommandsChannels.set(guildInfo._id, guildInfo.idReleasesCommandsChannel);

    return unregisteredChannels;
}

module.exports = loadGuildsInfo;