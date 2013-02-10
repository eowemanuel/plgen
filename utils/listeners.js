(function() {
  'use strict';

  var eventListeners = [];

  function addEventListener(name, callback) {
    eventListeners.push({
      name: name,
      callback: callback
    });
  }

  function invokeEventListeners(name, detail) {
    eventListeners.filter(function(listener) { return listener.name == name; })
                  .forEach(function(listener) { listener.callback(detail); });
  }

  module.exports.addEventListener = addEventListener;
  module.exports.invokeEventListeners = invokeEventListeners;
})();
