import {noop, mustImplement} from './utils';

class Port {
  constructor (pokey, port) {
    this.pokey = pokey;
    this.port = port;
    this._callbacks = [];
  }

  /**
   register an event handler for a particular event name.

   @param {String} eventName the name of the event
   @param {Function} callback the callback to call when the event occurs
   @param {*?} binding an optional value of `this` inside of the callback
   */
  on (eventName, callback, binding) {
    var pokey = this.pokey;

    function wrappedCallback (event) {
      if (event.data.type === eventName) {
        pokey.configuration.eventCallback(function () {
          return callback.call(binding, event.data.data);
        });
      }
    }

    this._callbacks.push([callback, wrappedCallback]);
    this.port.addEventListener('message', wrappedCallback);
  }
  /**
   register an event handler that is called for all events that are sent to the port, e.g. wiretaps
   */
  all (callback, binding) {
    let pokey = this.pokey;

    function wrappedCallback (event) {
      pokey.configuration.eventCallback(function () {
        callback.call(binding, event.data.type, event.data.data);
      });
    }

    this.port.addEventListener('message', wrappedCallback);
  }

  /**
   unregister an event handler for an event name
   and callback

   @param {String} eventName the name of the event
   @param {Function} callback a reference to the callback that was
   passed into `.on`.
   */
  off (eventName, callback) {
    var foundCallback;

    for (var i = 0, l = this._callbacks.length; i < l; i++) {
      foundCallback = this._callbacks[i];
      if (foundCallback[0] === callback) {
        this.port.removeEventListener('message', foundCallback[1]);
      }
    }
  }

  /**
   sends an event to the other side of the connection

   @param {String} eventName the name of the event
   @param {Structured?} data optional data to pass along with the event
   */
  send (eventName, data) {
    this.port.postMessage({
      type: eventName,
      data: data
    });
  }

  /**
   @private
   Adapters should implement this to start receiving messages from the other side of the connection. It is up to the adapter to make sure that no messages are dropped if they are sent before `start` is called.
   */
  start () {
    this.port.start();
  }

  /**
   @private
   Adapters should implement this to stop receiving messages from the other side of the connection.
   */
  close () {
    var foundCallback;

    for (var i = 0, l = this._callbacks.length; i < l; i++) {
      foundCallback = this._callbacks[i];
      this.port.removeEventListener('message', foundCallback[1]);
    }
    this._callbacks = [];

    this.port.close();
  }

  /**
   sends a request to the other side of the connection

   @param {String} eventName the name of the request
   @return {Promise} a promise that will be resolved with the value
   provided by the other side of the connection, or rejected if the other
   side indicates retrieving the value resulted in an error. The fulfillment
   value must be structured data.
   */
  request (eventName) {
    let pokey = this.pokey;
    let port = this;
    let args = [].slice.call(arguments, 1);

    return new Promise(function (resolve, reject) {
      let requestId = getRequestId(pokey);

      let clearObservers = () => {
        port.off('@response:' + eventName, observer);
        port.off('@errorResponse:' + eventName, errorObserver);
      };

      let observer = (event) => {
        if (event.requestId === requestId) {
          clearObservers();
          resolve(event.data);
        }
      };

      let errorObserver = (event) => {
        if (event.requestId === requestId) {
          clearObservers();
          reject(event.data);
        }
      };

      port.on('@response:' + eventName, observer, port);
      port.on('@errorResponse:' + eventName, errorObserver, port);
      port.send('@request:' + eventName, { requestId: requestId, args: args });
    });
  }

  /**
   This method registers a callback to be called when a request is made
   by the other side of the connection.

   The callback will be called with any arguments passed in the request.  It
   may either return a value directly, or return a promise if the value must be
   retrieved asynchronously.

   Examples:

   // This completes the request immediately.
   service.onRequest('name', function () {
        return 'David';
      });


   // This completely the request asynchronously.
   service.onRequest('name', function () {
        return new Oasis.RSVP.Promise(function (resolve, reject) {
          setTimeout( function() {
            resolve('David');
          }, 200);
        });
      });

   @param {String} eventName the name of the request
   @param {Function} callback the callback to be called when a request
   is made.
   @param {any?} binding the value of `this` in the callback
   */
  onRequest (eventName, callback, binding) {
    var self = this;

    this.on('@request:' + eventName, (data) => {
      let requestId = data.requestId,
          args = data.args,
          getResponse = new Promise(function (resolve, reject) {
            var value = callback.apply(binding, args);
            if (undefined !== value) {
              resolve(value);
            } else {
              reject("@request:" + eventName + " [" + data.requestId + "] did not return a value.  If you want to return a literal `undefined` return `Promise.resolve(undefined)`");
            }
          });

      getResponse.then((value) => {
        self.send('@response:' + eventName, {
          requestId: requestId,
          data: value
        });
      }, (error) => {
        let value = error;
        if (error instanceof Error) {
          value = {
            message: error.message,
            stack: error.stack
          };
        }
        self.send('@errorResponse:' + eventName, {
          requestId: requestId,
          data: value
        });
      });
    });

  }
}

function getRequestId (pokey) {
  return pokey.pokeyId + '-' + pokey.requestId++;
}

export default Port;