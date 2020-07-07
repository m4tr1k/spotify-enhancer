const discordClient = require('../api/discord-properties').discordClient
const db = require('../api/mongoDB-funcs');

async function welcome(guild){
    Promise.all(
        [discordClient.users.cache.get(guild.ownerID).send("**Hello there** 👋\nThank you for using me to enhance your spotify experience 🚀\n\nI created a new channel 'releases-commands' where you can control me and add your favourite artists!\n If you have any doubts, You can type at any time '!SE help' for more information.\n\nHope to enhance your spotify experience 🧡")], 
        [createChannel(guild)]
    ); 
}

async function createChannel(guild){
    const newReleasesRole = await createRole(guild);
    const everyoneRole = guild.roles.cache.find(role => role.name === '@everyone');

    const idReleasesCommandsChannel = await guild.channels.create('releases-commands', { 
        type: 'text',
        permissionOverwrites: [
            {
                allow: ['SEND_MESSAGES', 'ADD_REACTIONS', 'VIEW_CHANNEL'],
                id: newReleasesRole.id
            },
            {
                deny: ['SEND_MESSAGES', 'ADD_REACTIONS', 'VIEW_CHANNEL'],
                id: everyoneRole.id
            },
            {
                allow: ['SEND_MESSAGES', 'ADD_REACTIONS', 'VIEW_CHANNEL'],
                id: guild.me.id
            }  
        ] 
    })

    db.insertGuildDB(guild.id, idReleasesCommandsChannel.id);
}

async function createRole(guild){
    if(!guild.roles.cache.some(role => role.name === 'New Releases Manager')){
        const role = await guild.roles.create({
            data: {
                name: 'New Releases Manager',
                color: [29, 185, 84]
            }
        })
        return role;
    } else {
        return guild.roles.cache.find(role => role.name === 'New Releases Manager');
    }
}

async function removeGuild(guild){
    db.removeGuildDB(guild.id);
}

exports.welcome = welcome;
exports.removeGuild = removeGuild