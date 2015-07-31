import {assert, Deferred} from './utils';
import Port from './Port';

//todo - refactor away from this weird setupCapability and rejectCapability thing. Maybe get rid of callbacks.

/**
 * main entry point that allows sandboxes to connect back to their containing environment.
 * can just pass string (get promise), string and callback (callback), or object with named consumers.
 * @example
 // Using promises
 Oasis.connect('foo').then( function (port) {
      port.send('hello');
    }, function () {
      // error
    });

 * @example
 // using callbacks
 Oasis.connect('foo', function (port) {
      port.send('hello');
    }, errorHandler);
 *
 * @param {String} capability the name of the service to connect to, or an object containing named consumers to connect.
 * @param {Function?} callback the callback to trigger once the other side of the connection is available.
 * @param {Function?} errorCallback the callback to trigger if there is an error.
 * @return {Promise} a promise that will be resolved once the other side of the connection is available. You can use this instead of the callbacks.
 */

export function connect (capability, callback, errorCallback) {
  if (typeof capability === 'object') {
    return connectConsumers(this, capability);
  } else if (callback) {
    return connectCallbacks(this, capability, callback, errorCallback);
  } else {
    return connectPromise(this, capability);
  }
}

export function registerHandler (pokey, capability, options) {
  let port = pokey.ports[capability];

  if (port) {
    //found port, set up capability
    options.setupCapability(port);

    if (options.promise) {
      options.promise.
        then(port.start).
        catch(() => {});
    } else {
      port.start();
    }
  } else if (!pokey.receivedPorts) {
    //no ports found, save handler for capability
    pokey.handlers[capability] = options;
  } else {
    //no port sent for capability...
    options.rejectCapability();
  }
}

export function portFor (capability) {
  let port = this.ports[capability];
  assert(port, "You asked for the port for the capability named '" + capability + ", but didn't have one");
  return port;
}

//todo - clean
export function connectCapabilities (capabilities, eventPorts) {
  let pokey = this;
  capabilities.forEach((capability, i) => {
    let handler = pokey.handlers[capability],
        port    = new Port(pokey, eventPorts[i]);

    if (handler) {
      Promise.resolve(handler.setupCapability(port)).
        then(function () {
          port.start();
        }).
        catch(() => {})
    }

    pokey.ports[capability] = port;
  });

  // for each handler without a capability, reject
  for (let prop in pokey.handlers) {
    if (!pokey.ports[prop]) {
      pokey.handlers[prop].rejectCapability();
    }
  }

  this.receivedPorts = true;
}

function connectPromise (pokey, capability) {
  let deferred = new Deferred();
  registerHandler(pokey, capability, {
    promise         : deferred.promise,
    setupCapability : function (port) {
      deferred.resolve(port);
      return deferred.promise;
    },
    rejectCapability: function () {
      deferred.reject('Capability ' + capability + ' rejected. Make sure it is registered.');
    }
  });
  return deferred.promise;
}

function connectCallbacks (pokey, capability, callback, errorCallback) {
  registerHandler(pokey, capability, {
    setupCapability : function (port) {
      callback(port);
    },
    rejectCapability: function () {
      if (errorCallback) {
        errorCallback();
      }
    }
  });
}

//todo - clean
//todo - verify this works
function connectConsumers (pokey, consumers) {
  function setupCapability (Consumer, name) {
    return function (port) {
      let consumer          = new Consumer(port);
      pokey.consumers[name] = consumer;
      consumer.initialize(port, name);
    };
  }

  function rejectCapability (prop) {
    return function () {
      consumers[prop].prototype.error();
    };
  }

  for (let prop in consumers) {
    registerHandler(pokey, prop, {
      setupCapability : setupCapability(consumers[prop], prop),
      rejectCapability: rejectCapability(prop)
    });
  }
}