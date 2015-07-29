import {assert} from './utils';

//can just pass string (get promise), string and callback (callback), or object with named consumers
export function connect(serviceName, callback) {
  if (typeof serviceName === 'object') {
    return connectConsumers(this, serviceName);
  } else if (callback) {
    return connectCallbacks(this, serviceName, callback);
  } else {
    return connectPromise(this, serviceName);
  }
}

export function registerHandler (pokey, serviceName, options) {
  let port = pokey.ports[serviceName];

  if (port) {
    //todo
  }
}

export function portFor(serviceName) {
  var port = this.ports[serviceName];
  assert(port, "You asked for the port for the service named '" + serviceName + ", but the environment did not provide one.");
  return port;
}

function connectPromise (pokey, serviceName) {
  //todo
}

function connectCallbacks (pokey, serviceName, callback) {
  //todo
}

function connectConsumers (pokey, consumerMap) {
  //todo
}