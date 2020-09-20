const { MessageEmbed } = require("discord.js");

class ReleaseEmbed extends MessageEmbed {
    constructor(props){
        super();
        this.setColor('#1DB954');
        this.setTitle(props.title);
        this.setDescription(props.description);
        this.setThumbnail(props.coverArt);
    }

    send(channel){
        channel.send(this).then(lstMsg => {
            lstMsg.react('👍')
                .then(() => lstMsg.react('👎'))
                .then(() => lstMsg.react('❤️'));
        });
    }
}

module.exports = ReleaseEmbed;