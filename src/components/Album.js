class Album {
    constructor(props){
        this.nameAlbum = props.nameAlbum;
        this.artists = props.artists;
        this.featArtists = props.featArtists;
        this.label = props.label
        this.releaseDate = props.releaseDate;
        this.tracklist = props.tracklist;
        this.coverArt = props.coverArt;
        this.spotifyLink = props.spotifyLink;
    }
}

module.exports = Album;