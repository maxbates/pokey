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

  initialize() {}

  error() {}

  destroy() {}

  /**
   *
   * @param {String} eventName
   * @param {Structured} data
   * @returns {*}
   * //todo - ensure this binding
   */
  send(...args) {
    return this.port.send(...args);
  }

  /**
   *
   * @param {String} requestName
   * @param {Promise} promise resolved by other end
   * @returns {*}
   * //todo - ensure this binding
   */
  request(...args) {
    return this.port.request(...args);
  }
}

export default Service;