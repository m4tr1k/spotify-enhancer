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

exports.checkTodayRelease = checkTodayRelease;
exports.sleep = sleep;