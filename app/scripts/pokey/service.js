/**
 Base class services (in containing environment) + consumers (in sandbox) can subclass to implement several events + requests

 accepts

 initialize (function) - called when other side initiates connection

 events (object) - map of event names and callbacks, called when other end triggers respective event

 requests (object) - map of request names and callbacks, called when other end requests
 */

class Service {
  constructor (port, sandbox, params = {}) {
    let self = this;

    this.port    = port;
    this.sandbox = sandbox;

    function wrapCb (cb) {
      return function () {
        return cb.apply(self, arguments);
      }
    }

    for (let prop in params.events) {
      let callback = params.events[prop];
      port.on(prop, wrapCb(callback));
    }

    for (let prop in params.requests) {
      let callback = params.requests[prop];
      port.onRequest(prop, wrapCb(callback));
    }
  }

  /**
   This hook is called when the connection is established. When
   `initialize` is called, it is safe to register listeners and
   send data to the other side.

   The implementation of Oasis makes it impossible for messages
   to get dropped on the floor due to timing issues.

   @param {OasisPort} port the port to the other side of the connection
   @param {String} name the name of the service
   */
  initialize() {}

  /**
   This hooks is called when an attempt is made to connect to a capability the
   environment does not provide.
   */
  error() {}

  /**
   This hook is called when the connection is stopped. When
   `destroy` is called, it is safe to unregister listeners.
   */
  destroy() {}

  /**
   * send events to the other side of the
   connection
   * @param {String} eventName
   * @param {Structured} data
   * @returns {*}
   * //verify this binding
   */
  send(...args) {
    return this.port.send(...args);
  }

  /**
   * request data from the other side of
   the connection
   * @param {String} requestName
   * @param {Promise} promise resolved by other end
   * @returns {*}
   * //verify this binding
   */
  request(...args) {
    return this.port.request(...args);
  }
}

export default Service;