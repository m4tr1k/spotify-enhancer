const Spotify = require('spotify-web-api-node');
const auth = require('../auth.json');

class SpotifyClient{
    constructor(){
        this.spotifyClient = new Spotify({
            redirectUri: auth.redirectUri,
            clientId: auth.clientId,
            clientSecret: auth.clientSecret
        });
    }

    getAuthorizeURL(){
        const scopes = ['user-read-private', 'user-read-email'];
        return this.spotifyClient.createAuthorizeURL(scopes, auth.state);
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
