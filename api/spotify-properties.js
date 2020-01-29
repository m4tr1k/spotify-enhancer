const Spotify = require('spotify-web-api-node');
const auth = require('../auth.json');

var spotifyClient = new Spotify({
    redirectUri: auth.redirectUri,
    clientId: auth.clientId,
    clientSecret: auth.clientSecret
});

const scopes = ['user-read-private', 'user-read-email'];

const authorizeURL = spotifyClient.createAuthorizeURL(scopes, auth.state);

exports.spotifyClient = spotifyClient;
exports.URL = authorizeURL;