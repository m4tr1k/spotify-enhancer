const Spotify = require('spotify-web-api-node');
const {clientId, clientSecret} = require('../auth.json');

class SpotifyClient{
    constructor(){
        this.client = new Spotify({
            clientId: clientId,
            clientSecret: clientSecret
        });
    }

    getAuthOptions(){
        return {
            headers: {
                Authorization: 'Bearer ' + this.client.getAccessToken()
            }
        }
    }
}

const client = new SpotifyClient();
module.exports = client;
