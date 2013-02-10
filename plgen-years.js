// Usage: node plgen-years.js ~/Music/iTunes/iTunes\ Media/Music
'use strict';

var Clerk = require('./utils/clerk');
var Walker = require('./utils/walker');
var listeners = require('./utils/listeners');
var fs = require('fs');

var root = process.argv[2] || '.'; // Root folder containing all music in the iTunes media library.
var stderr = process.argv[3] || 'stderr.txt'; // File where errors should be dumped.

var clerk = new Clerk();
var requests = {};
var years = {};

Walker.walkMediaLibrary(root, function(file, track, album, artist) {
  artist = artist.replace(/_/g, ' ');
  album = album.replace(/_/g, ' ');

  var tuple = [artist, album].join();

  function onFetched(year) {
    fs.appendFileSync(year + '.m3u', file + '\n');
  }

  switch (requests[tuple]) {
    case 'fetched':
      onFetched(years[tuple]);
      break;

    case 'fetching':
      listeners.addEventListener(tuple, onFetched);
      break;

    default:
      requests[tuple] = 'fetching';
      listeners.addEventListener(tuple, onFetched);

      clerk.getYear(artist, album, function(year) {
        if (!year) {
          logError'Couldn\'t get year for ' + artist + ' - ' + album);
          return;
        }

        console.log('Got year for ' + artist + ' - ' + album + ': ' + year);

        years[tuple] = year;
        requests[tuple] = 'fetched';
        listeners.invokeEventListeners(tuple, year);
      });
      break;
  }
});

function logError(str) {
  console.log(str);
  fs.appendFileSync(stderr, str + '\n');
}
