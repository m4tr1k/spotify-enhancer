const {MessageEmbed} = require('discord.js');
const {commands, releasesCommandsChannels} = require('../api/discord-properties')

function showHelpCommands(msgDiscord, content){
    switch(content.length){
        case 0:
            showDefaultHelpCommand(msgDiscord)
            break;
        case 1:
            showSpecificHelpCommand(msgDiscord, content[0])
            break;
        default:
            msgDiscord.reply('I can only show help for one command!')
    }
}

async function showDefaultHelpCommand(msgDiscord){
    let helpMessage = new MessageEmbed()
                        .setColor('#1DB954')
                        .setTitle('Need some help?')
                        .setDescription("Explore any available command with the following instructions:");

    let helpCommands = [];

    const isReleasesCommandsChannel = releasesCommandsChannels.some(releasesCommandsChannel => releasesCommandsChannel === msgDiscord.channel.id);

    commands.filter(command => command.releasesCommand === isReleasesCommandsChannel || command.releasesCommand === null)
            .each(command => helpCommands.push({name: command.title, value: '`!SE help ' + command.name + '`', inline: true}));

    helpMessage.addFields(helpCommands);
    msgDiscord.channel.send(helpMessage);
}

async function showSpecificHelpCommand(msgDiscord, desiredCommand){
    const isReleasesCommandsChannel = releasesCommandsChannels.some(releasesCommandsChannel => releasesCommandsChannel === msgDiscord.channel.id);

    const selectedCommand = commands.find(command => (command.releasesCommand === isReleasesCommandsChannel || command.releasesCommand === null) && command.name === desiredCommand.toLowerCase());

    if(selectedCommand !== undefined){
        let helpMessage = new MessageEmbed()
                        .setColor('#1DB954')
                        .setTitle(selectedCommand.title + '\n`!SE ' + selectedCommand.name + '`')
                        .setDescription(selectedCommand.description)

        if(selectedCommand.note !== undefined) helpMessage.addField('Note:', selectedCommand.note)

        helpMessage.addField('Usage:', selectedCommand.usage.join('\n\n'))
        
        msgDiscord.channel.send(helpMessage);
    } else {
        msgDiscord.reply('The command you introduced does not exist!');
    }
}

module.exports = {
    name: 'help',
    execute(msgDiscord, content){
        showHelpCommands(msgDiscord, content)
    }
}