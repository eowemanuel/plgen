plgen
=====

Playlist generator for organized iTunes media libraries in node.js

### Usage
* Generate a playlist with the top N most popular songs for each band, using [LastFm](http://www.last.fm/api):<br>
  `node plgen-top.js ~/Music/iTunes/iTunes\ Media/Music my-playlist.m3u 10`
* Or playlists for all albums organized by years, using [MusicBrainz](http://musicbrainz.org/doc/Development/XML_Web_Service/Version_2):<br>
  `node plgen-years.js ~/Music/iTunes/iTunes\ Media/Music`
