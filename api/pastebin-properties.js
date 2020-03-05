var pastebin = require("better-pastebin");
var auth = require("../auth.json");
var mongo = require('./mongoDB-funcs').client;

var Options = function(message){
    this.contents = message;
    this.privacy = 1;
    this.name = "Artists registered on the server";
}

pastebin.setDevKey(auth.pastebinDevKey);

function loginPastebin(){
    pastebin.login(auth.pastebinUsername, auth.pastebinPassword, (success, data) => {
        if(success){
            console.log('Pastebin api working correctly...');
        }
    })
}

async function editPaste(message, guild, channel){
    var options = new Options(message);
    if(!guild.hasOwnProperty('idPaste')){
        pastebin.create(options, (success, data) => {
            if(success){
                mongo.collection('guild').updateOne(
                    {_id: guild._id},
                    {$set: {idPaste: data}}
                )
                channel.send('You can check the artist registered in this server here: ' + data);
            }
        })
    } else {
        pastebin.edit(guild.idPaste, options, (success) => {
            if(success){
                channel.send('You can check the artist registered in this server here: ' + guild.idPaste);
            }
        })
    }
}

exports.loginPastebin = loginPastebin;
exports.editPaste = editPaste;