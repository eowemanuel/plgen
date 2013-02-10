// Usage: node plgen-top.js ~/Music/iTunes/iTunes\ Media/Music my-playlist.m3u 10
'use strict';

var Clerk = require('./utils/clerk');
var Walker = require('./utils/walker');
var Levenshtein = require('levenshtein');
var fs = require('fs');

var root = process.argv[2] || '.'; // Root folder containing all music in the iTunes media library.
var out = process.argv[3] || 'playlist.m3u'; // Playlist output path.
var max = process.argv[4] || 15; // Number of top tracks to add.
var stderr = process.argv[5] || 'stderr.txt'; // File where errors should be dumped.

var clerk = new Clerk('dd00ff1ef043454e9c61e10c88fe85c7',
                      '0e31599848a01724f56e3eb530760709');
var tracks = [];
var playlist = {};

Walker.walkMediaLibrary(root, function(file, track, album, artist) {
  tracks.push({
    file: file,
    name: track,
    album: album.replace(/_/g, '.'),
    artist: artist.replace(/_/g, '.')
  });

  if (playlist[artist]) {
    return;
  }
  playlist[artist] = true;
  handleArtist(artist);
});

function handleArtist(artist, store) {
  var store = [];
  var attempt = 1;

  function request(artist) {
    attempt++;
    clerk.getTopTracks(max, artist, {
      onSuccess: onSuccess,
      onError: onError
    });
  }

  function onError(error) {
    function shallowSanitize(str) {
      return str.replace(/_/g, '').trim();
    }
    function aggressiveSanitize(str) {
      return str.replace(/[\._]/g, '').replace(/\W/g, ' ').trim();
    }

    // Some non-latin characters confuse last.fm, replace with whitespace.
    if (attempt == 2) {
      logError('Error: ' + artist + ', ' + error.message + '\n' +
               'Trying ' + aggressiveSanitize(artist));

      request(aggressiveSanitize(artist));
      return;
    }
    if (attempt == 3) {
      logError('Error: ' + artist + ', ' + error.message + '\n' +
               'Trying again with ' + shallowSanitize(artist));

      request(shallowSanitize(artist));
      return;
    }
    if (attempt == 4) {
      logError('Error: Couldn\'t get top tracks' +
               ', neither for ' + aggressiveSanitize(artist) +
               ', nor ' + shallowSanitize(artist));
    }
  }

  function onSuccess(topTracks) {
    console.log('Got top tracks for ' + artist);
    console.log(JSON.stringify(topTracks));

    topTracks.forEach(function(topTrack) {
      console.log('Searching for ' + topTrack.artist + ' - ' + topTrack.name);

      tracks.forEach(function(track) {
        if (!topTrack) {
          return;
        }
        if (track.name[0].toLowerCase() != topTrack.name[0].toLowerCase() ||
            track.artist[0].toLowerCase() != topTrack.artist[0].toLowerCase()) {
          return;
        }

        console.log('Comparing with ' + track.artist + ' - ' + track.name);

        if (new Levenshtein(track.name.toLowerCase(), topTrack.name.toLowerCase()).distance > 2 ||
            new Levenshtein(track.artist.toLowerCase(), topTrack.artist.toLowerCase()).distance > 2) {
          return;
        }

        console.log('Success: ' + track.artist + ' - ' + track.name + ' found');

        store.push(track.file);
        topTrack = null; // Break.
      });

      if (topTrack) {
        logError('Warning: ' + topTrack.artist + ' - ' + topTrack.name + ' not found');
      }
    });

    if (store.length) {
      fs.appendFileSync(out, store.join('\n') + '\n');
    }
  }

  request(artist);
}

function logError(str) {
  console.log(str);
  fs.appendFileSync(stderr, str + '\n');
}
