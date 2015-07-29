export default class Events {
  constructor () {
    this.subscribers = {};
  }

  on (eventName, listener) {
    let listeners = (this.subscribers[eventName] = this.subscribers[eventName] || []);

    listeners.push(listener);
  }

  off (eventName, listener) {
    let listeners = this.subscribers[eventName];
    if (!listeners) {
      return;
    }

    for (var i = 0; i < listeners.length; ++i) {
      if (listeners[i] === listener) {
        listeners.splice(i, 1);
        break;
      }
    }
  }

  clear (eventName) {
    delete this.subscribers[eventName];
  }

  trigger (eventName) {
    var listeners = this.subscribers[eventName];
    if (!listeners) {
      return;
    }

    var args = Array.prototype.slice.call(arguments, 1);

    for (var i = 0; i < listeners.length; ++i) {
      listeners[i].apply(null, args);
    }
  }
}