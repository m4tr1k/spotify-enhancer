const discordClient = require('../../api/discord-properties').discordClient;

var listener;
var verifyHandler = false;
var info;

var InfoIDs = function(props){
    this.artistId = props.artistId;
    this.messageId = props.messageId;
}

function chooseArtist(msgDiscord, artists, number){
    return new Promise ( returnArtistID => {
        if(verifyHandler){
            discordClient.emit('delete-reaction-add');
        }
        verifyHandler = true;
        const currentArtist = artists[number];
        var artistDetails = '**' + currentArtist.name + '** (' + currentArtist.external_urls.spotify + ')' + '\nGenres: ';
        if(currentArtist.genres.length === 0){
            artistDetails += '*(not specified)*';
        } else {
            for(var l = 0; l < currentArtist.genres.length - 1; l++){
                artistDetails += currentArtist.genres[l] + ', ';
            }
            artistDetails += currentArtist.genres[currentArtist.genres.length - 1];
        }
        
        msgDiscord.channel.send(artistDetails).then( lstMsg => {
            info = new InfoIDs({
                artistId: currentArtist.id,
                messageId: lstMsg.id
            })
            lstMsg.react('✅')
            .then(() => lstMsg.react('❎'))
        })

        listener = (reaction, user) => {
            if(reaction.emoji.name === '✅' && info.messageId === reaction.message.id && !user.bot){
                reaction.message.delete()
                .then(() => {
                    returnArtistID(info.artistId);
                })
                
            } else if(reaction.emoji.name === '❎' && info.messageId === reaction.message.id && !user.bot){
                reaction.message.delete()
                .then( () => {
                    if(number < artists.length - 1){
                        chooseArtist(msgDiscord, artists, ++number).then( artistID => {
                            returnArtistID(artistID);
                        });
                    } else {
                        returnArtistID('');
                    }
                });
            }
        }

        discordClient.on('messageReactionAdd', listener);
    })
}

discordClient.addListener('delete-reaction-add', () => {
    discordClient.removeListener('messageReactionAdd', listener)
})

exports.chooseArtist = chooseArtist;