(function() {
  'use strict';

  var fs = require('fs');

  var Walker = {
    walkMediaLibrary: function(path, callback) {
      function onFile(file) {
        console.log('Parsing ' + file);

        // Getting id3 tags takes too much time; fortunately, if the iTunes media library
        // is organized, all tracks are stored in a Artist/Album/song hierarchy.
        // Note: using iTunes Music Library.xml would probably be smarter.
        var parts = file.split('/');
        var currentTrack = parts.pop().replace(/[0-9-]*\s*/, '').replace(/\.[^\.]+$/, '');
        var currentAlbum = parts.pop();
        var currentArtist = parts.pop();
        console.log('Artist: ' + currentArtist +
                    ', album: ' + currentAlbum +
                    ', track: ' + currentTrack);

        console.log('Got track ' + currentArtist + ' - ' + currentAlbum + ' - ' + currentTrack);
        callback(file, currentTrack, currentAlbum, currentArtist);
      }

      function onDir(dir) {
        console.log('Recursing ' + dir);
        this.walkDir(dir, walkerHandlers); // Recurse ALL the folders!
      }

      var walkerHandlers = {
        onFile: onFile.bind(this),
        onDir: onDir.bind(this)
      };

      this.walkDir(path, walkerHandlers);
    },
    walkDir: function(path, handlers) {
      console.log('Walking ' + path);

      fs.readdir(path, function(err, files) {
        files.forEach(function(file) {
          var filePath = path + '/' + file;
          console.log('Scanning ' + filePath);

          if (file[0] == '.') {
            return;
          }
          fs.stat(filePath, function(err, stats) {
            if (stats) {
              if (stats.isFile()) {
                handlers.onFile(filePath);
              }
              if (stats.isDirectory()) {
                handlers.onDir(filePath);
              }
            }
          });
        });
      });
    }
  };

  module.exports = Walker;
})();
