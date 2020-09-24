/**
 * Check if a certain release is released today (or on the next day)
 * @param {string} releaseDateString 
 * @returns true if it is released today (or on the next day)
 */

function checkTodayRelease(releaseDateString){
    const currentDate = new Date();
    const releaseDate = new Date(releaseDateString);
    currentDate.setHours(0, 0, 0, 0);
    return releaseDate >= currentDate
}

/**
 * Number of miliseconds that the program needs to wait in order to be able to complete the requests
 * 
 * Useful to deal with rate limit
 * @param {number} ms Time in miliseconds
 */

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Get id from Spotify URI or URL
 * 
 * The id can be associated to a track, album or artist
 * @param {string} input Spotify URL or URI
 */

function getSpotifyId(input, typeOfId){
    const prefixURI = input.startsWith("spotify:");

    switch(prefixURI){
        case true:
            const uriParts = input.split(':');
            if(typeOfId === uriParts[1]){
                return uriParts[2];
            }
            return undefined;
        case false:
            const prefixURL = input.startsWith("https://open.spotify.com/");

            if(prefixURL){
                const urlParts = input.split('/');
                if(typeOfId === urlParts[3]){
                    if(input.indexOf('?') !== -1){
                        return input.substring(input.lastIndexOf('/') + 1, input.lastIndexOf('?'));
                    } else {
                        return input.substring(input.lastIndexOf('/') + 1);
                    }
                }
            }
            return undefined;
    }
}

exports.checkTodayRelease = checkTodayRelease;
exports.sleep = sleep;
exports.getSpotifyId = getSpotifyId;