const discordClient = require('../api/discord-properties').discordClient

var listenerReaction;
var listenerRole;

async function welcome(guild){
    const firstMsg = await discordClient.users.get(guild.ownerID).send('Hello there 👋!\nThank you for using me to enhance your spotify experience 🚀\nBefore start using my features, please make sure that I have at permission to manage channels.\nAfter you done that, this message will be automatically deleted');
    await checkRole(guild);
    discordClient.removeListener('guildMemberUpdate', listenerRole);
    await firstMsg.delete();
    const secondMsg = await discordClient.users.get(guild.ownerID).send('Great 😄\nOne last thing, would you like to create a dedicated channel on __**' + guild.name + '**__ for new releases?')
    await secondMsg.react('✅');
    await secondMsg.react('❎');
    await createNewReleasesChannel(guild, secondMsg);
    discordClient.removeListener('messageReactionAdd', listenerReaction)
}

async function checkRole(guild){
    return new Promise ( resolve => {
        listenerRole = (oldMember, newMember) => {
            if(newMember.user.username === guild.me.user.username && newMember.hasPermission('MANAGE_CHANNELS')){
                resolve()
            }
        }
        discordClient.on('guildMemberUpdate', listenerRole);
    })
}

async function createNewReleasesChannel(guild, msg){
    return new Promise ( resolve => {
        listenerReaction = (reaction, user) => {
            if(reaction.message.id === msg.id && reaction.emoji.name === '✅' && !user.bot){
                createChannel(guild).then( () => {
                    discordClient.users.get(guild.ownerID)
                    .send("Nice to hear that 😄\nEveryday I will check if your favourite artists have new releases\nIn the meantime, you can still use my features to search the latest release of any artist\n\nI hope to enhance your spotify experience 🧡\nBest regards,\n_Spotify Enhancer_")
                    .then(() => resolve());
                })
            } else if (reaction.message.id === msg.id && reaction.emoji.name === '❎' && !user.bot){
                discordClient.users.get(guild.ownerID).send("No problem 👍\nYou can still use my features to search the latest release of any artist\n\nI hope to enhance your spotify experience 🧡\nBest regards,\n_Spotify Enhancer_").then(() => resolve());
            }
        }
        discordClient.on('messageReactionAdd', listenerReaction)
    })
}

async function createChannel(guild){
    return new Promise ( res => {
        if(!guild.channels.array().some(channel => channel.name === 'new-releases')){
            guild.createChannel('new-releases', { type: 'text' })
            .then(() => res())
        }
        res();
    })
}

exports.welcome = welcome;