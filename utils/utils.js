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

exports.checkTodayRelease = checkTodayRelease;