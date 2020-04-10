const discordClient = require('../api/discord-properties').discordClient
const db = require('../api/mongoDB-funcs');

var listenerReaction;

async function welcome(guild){
    const msg = await discordClient.users.cache.get(guild.ownerID).send('**Hello there** 👋\nThank you for using me to enhance your spotify experience 🚀\n\nBefore start using my features, would you like to create a dedicated channel on __**' + guild.name + '**__ for new releases?')
    await msg.react('✅');
    await msg.react('❎');
    await createNewReleasesChannel(guild, msg);
    discordClient.removeListener('messageReactionAdd', listenerReaction)
}

async function createNewReleasesChannel(guild, msg){
    return new Promise ( resolve => {
        listenerReaction = (reaction, user) => {
            if(reaction.message.id === msg.id && reaction.emoji.name === '✅' && !user.bot){
                createRole(guild).then(role => {
                    createChannels(guild, role).then( () => {
                        discordClient.users.cache.get(guild.ownerID)
                        .send("Nice to hear that 😄\n\n__**Some things to keep in mind:**__\n\n-> Anyone can add or remove artists with the new role 'New Releases Manager' *(and admins of course)*\n-> The new releases will be posted in 'new-releases'\n\nEveryday I will check if your favourite artists have new releases\nIn the meantime, you can still use my features to search the latest release of any artist\n\nI hope to enhance your spotify experience 🧡\nBest regards,\n_Spotify Enhancer_")
                        .then(() => resolve());
                    })
                })
            } else if (reaction.message.id === msg.id && reaction.emoji.name === '❎' && !user.bot){
                discordClient.users.cache.get(guild.ownerID).send("No problem 👍\nYou can still use my features to search the latest release of any artist\n\nI hope to enhance your spotify experience 🧡\nBest regards,\n_Spotify Enhancer_").then(() => resolve());
            }
        }
        discordClient.on('messageReactionAdd', listenerReaction)
    })
}

async function createRole(guild){
    if(!guild.roles.cache.some(role => role.name === 'New Releases Manager')){
        const role = await guild.roles.create({
            data: {
                name: 'New Releases Manager',
                color: [29, 185, 84],
                mentionable: true 
            }
        })
        return role;
    } else {
        return guild.roles.cache.find(role => role.name === 'New Releases Manager');
    }
}

async function createChannels(guild, createdRole){
    const hasNewReleasesChannel = guild.channels.cache.some(channel => channel.name === 'new-releases');
    const hasNewReleasesCommandsChannel = guild.channels.cache.some(channel => channel.name === 'releases-commands');
    let idReleasesChannel, idReleasesCommandsChannel;

    if(!hasNewReleasesChannel){
        idReleasesChannel = await createChannel('new-releases', 'Check the new releases from your favourite artists here 🤟', guild, createdRole);
    } else {
        idReleasesChannel = await editChannel('new-releases', guild, createdRole);
    }

    if(!hasNewReleasesCommandsChannel){
        idReleasesCommandsChannel = await createChannel('releases-commands', '', guild, createdRole);
    } else {
        idReleasesCommandsChannel = await editChannel('releases-commands', guild, createdRole);
    }

    db.insertGuildDB(guild.id, idReleasesChannel, idReleasesCommandsChannel);
}

async function createChannel(channelName, channelTopic, guild, createdRole){
    const everyoneRole = guild.roles.cache.find(role => role.name === '@everyone');

    const channel = await guild.channels.create(channelName, { 
        type: 'text',
        topic: channelTopic,
        permissionOverwrites: [
            {
                allow: ['SEND_MESSAGES', 'ADD_REACTIONS'],
                id: createdRole.id
            },
            {
                deny: ['SEND_MESSAGES', 'ADD_REACTIONS'],
                id: everyoneRole.id
            },
            {
                allow: ['SEND_MESSAGES', 'ADD_REACTIONS'],
                id: guild.me.id
            }  
        ] 
    })

    return channel.id;
}

async function editChannel(nameChannel, guild, createdRole){
    const everyoneRole = guild.roles.cache.find(role => role.name === '@everyone');
    const channel = guild.channels.cache.find(channel => channel.name === nameChannel);
    channel.edit({
        permissionOverwrites: [
            {
                allow: ['SEND_MESSAGES', 'ADD_REACTIONS'],
                id: createdRole.id
            },
            {
                deny: ['SEND_MESSAGES', 'ADD_REACTIONS'],
                id: everyoneRole.id
            },
            {
                allow: ['SEND_MESSAGES', 'ADD_REACTIONS'],
                id: guild.me.id
            }
        ] 
    })
    return channel.id;
}

async function removeGuild(guild){
    db.removeGuildDB(guild.id);
}

exports.welcome = welcome;
exports.removeGuild = removeGuild