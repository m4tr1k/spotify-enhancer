class Artist {
    constructor(props){
        this._id = props.id;
        this.nameArtist = props.nameArtist;
        this.nameArtist_lowerCase = props.nameArtist.toLowerCase();
        this.latestReleases = props.latestReleases;
        this.idGuildChannels = [props.idReleasesChannel]
    }
}

module.exports = Artist;