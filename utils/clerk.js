(function() {
  'use strict';

  var http = require('http');
  var LastFmNode = require('lastfm').LastFmNode;

  function Clerk(lastFmKey, lastFmSecret) {
    this.lastFmKey = lastFmKey;
    this.lastFmSecret = lastFmSecret;
  };

  Clerk.prototype = {
    _lastFm: null,
    _mbQueue: 0,

    get lastFM() {
      return this._lastFm || (this._lastFm = new LastFmNode({
        api_key: 'dd00ff1ef043454e9c61e10c88fe85c7', // Your api key and secret here; get them from http://www.last.fm/api
        secret: '0e31599848a01724f56e3eb530760709',
        useragent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.8; rv:20.0) Gecko/20130101 Firefox/20.0'
      }));
    },

    getTopTracks: function(maxTracks, artist, callbacks) {
      console.log('Getting ' + maxTracks + ' top tracks for ' + artist);
      var tracks = [];
      var handlers = {
        success: function(json) {
          try {
            json.toptracks.track.forEach(function(track) {
              tracks.push({
                name: track.name,
                artist: track.artist.name
              });
            });
          } catch (e) {
            throw new Error('No tracks found');
          }
          callbacks.onSuccess(tracks);
        },
        error: callbacks.onError
      };

      this.lastFM.request('artist.getTopTracks', {
        autocorrect: 1, // Some artists may be named differently, like ACDC vs. AC/DC.
        artist: artist,
        limit: maxTracks,
        handlers: handlers
      });
    },

    getYear: function(artist, album, callback) {
      console.log('Fetching year for ' + artist + ' - ' + album);

      var options = {
        host: encodeURI('www.musicbrainz.org'),
        path: encodeURI('/ws/2/release/?fmt=json&query=' +
          'release:' + album + ' AND ' +
          'artist:' + artist
        )
      };

      this._mbQueue++;
      console.log('Requesting ' + options.host + options.path);
      console.log('MusicBrainz web service queue: ' + this._mbQueue);

      setTimeout(function() {
        http.request(options, function onResponse(response) {
          var body = '';
          response.on('data', function(chunk) {
            body += chunk;
          });
          response.on('end', function() {
            var data = JSON.parse(body);
            var pool = gatherYears(data.releases || []);
            var year = getPredominantYear(pool);

            this._mbQueue--;
            callback(year);
          });

          function gatherYears(releases) {
            var pool = [];

            releases.forEach(function(release) {
              var releaseDate = new Date(Date.parse(release.date));
              var releaseYear = releaseDate.getFullYear();
              if (!pool[releaseYear]) {
                pool[releaseYear] = { year: releaseYear, weight: 1 };
              } else {
                pool[releaseYear].weight++;
              }
            });
            return pool;
          }

          function getPredominantYear(pool) {
            pool.sort(function(a, b) {
              if (!a || !b) {
                return 0;
              } else {
                return a.weight < b.weight ? 1 : -1;
              }
            });
            if (!pool.length) {
              return 0;
            } else {
              return pool[0].year;
            }
          }
        }).end();
      }, this._mbQueue * 1000); // The allowable rate limit is ~22 per 20 seconds.
    }
  };

  module.exports = Clerk;
})();
