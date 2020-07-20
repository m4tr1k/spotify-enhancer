const Spotify = require('spotify-web-api-node');
const auth = require('../auth.json');

class SpotifyClient{
    constructor(){
        this.spotifyClient = new Spotify({
            clientId: auth.clientId,
            clientSecret: auth.clientSecret
        });
    }

    getAuthOptions(){
        return {
            headers: {
                Authorization: 'Bearer ' + this.spotifyClient.getAccessToken()
            }
        }
    }
}

const client = new SpotifyClient();
exports.client = client;
