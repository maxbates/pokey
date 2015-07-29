(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _pokeyMain = require('./pokey/main');

////////////////////

var _pokeyMain2 = _interopRequireDefault(_pokeyMain);

var log = document.querySelector('#log');

function addLogStatement(statement) {
  var p = document.createElement('p');
  var d = new Date();
  p.textContent = '' + statement + ' @ ' + [d.getMinutes(), d.getSeconds(), d.getMilliseconds()].join('.');
  log.appendChild(p);
}

addLogStatement('initialized');

/**********
 OASIS
 **********/

var sandbox = oasis.createSandbox({
  url: 'http://127.0.0.1:3000/external.html',
  type: 'html',
  capabilities: ['account'],
  height: "600"
});

sandbox.connect('account').then(function (port) {
  addLogStatement('connected on account');

  port.onRequest('profile', function () {
    return new Promise(function (resolve, reject) {
      setTimeout(function () {
        resolve({ email: 'wycats@gmail.com' });
      }, 1);
    });
  });

  document.querySelector('#email-input').addEventListener('keyup', function (event) {
    addLogStatement('sent');
    port.request('setProfile', event.target.value);
  });
});

document.getElementById('insertion').appendChild(sandbox.el);

},{"./pokey/main":7}],2:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _channel = require('./channel');

var _channel2 = _interopRequireDefault(_channel);

var _utils = require('./utils');

var AdapterBase = (function () {
  function AdapterBase() {
    _classCallCheck(this, AdapterBase);
  }

  _createClass(AdapterBase, [{
    key: 'createChannel',
    value: function createChannel(pokey) {
      var channel = new _channel2['default'](pokey);
      channel.port1.start();
      return channel;
    }

    //todo - signature update
  }, {
    key: 'connectSandbox',
    value: function connectSandbox(receiver, pokey) {
      var adapter = this;
    }
  }], [{
    key: 'environmentPort',
    value: function environmentPort(sandbox, channel) {
      return channel.port1;
    }
  }, {
    key: 'sandboxPort',
    value: function sandboxPort(sandbox, channel) {
      return channel.port2;
    }
  }, {
    key: 'proxyPort',
    value: function proxyPort(sandbox, port) {
      return port;
    }
  }]);

  return AdapterBase;
})();

Object.assign(AdapterBase, {
  initializeSandbox: (0, _utils.mustImplement)('AdapterBase', 'initializeSandbox')
});

//note - cannot assign readonly field name

exports['default'] = AdapterBase;
module.exports = exports['default'];

},{"./channel":4,"./utils":11}],3:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _adapter_base = require('./adapter_base');

var _adapter_base2 = _interopRequireDefault(_adapter_base);

var AdapterIFrame = (function (_AdapterBase) {
  _inherits(AdapterIFrame, _AdapterBase);

  function AdapterIFrame() {
    _classCallCheck(this, AdapterIFrame);

    _get(Object.getPrototypeOf(AdapterIFrame.prototype), 'constructor', this).call(this);
  }

  _createClass(AdapterIFrame, [{
    key: 'initializeSandbox',
    value: function initializeSandbox(sandbox) {
      //todo

      var options = sandbox.options,
          iframe = document.createElement('iframe'),
          sandboxAttributes = ['allow-scripts']; //can allow more...

      iframe.name = sandbox.options.url + '?uuid=' + UUID.generate();
      iframe.sandbox = sandboxAttributes.join(' ');

      // rendering-specific code
      if (options.width) {
        iframe.width = options.width;
      } else if (options.height) {
        iframe.height = options.height;
      }

      // Error handling inside the iFrame
      iframe.errorHandler = function (event) {
        if (!event.data.sandboxException) {
          return;
        }
        try {
          // verify this message came from the expected sandbox; try/catch
          // because ie8 will disallow reading contentWindow in the case of
          // another sandbox's message
          if (event.source !== iframe.contentWindow) {
            return;
          }
        } catch (e) {
          return;
        }

        sandbox.onerror(event.data.sandboxException);
      };
      window.addEventListener('message', iframe.errorHandler, false);

      //verify
      verifySandbox(sandbox.pokey, sandbox.options.url);
      iframe.src = sandbox.options.url;

      // Promise that sandbox has loaded and services connected at least once. This does not mean that the sandbox will be loaded & connected in the face of reconnects (eg pages that navigate)
      sandbox._waitForLoadPromise.resolve(new Promise(function (resolve, reject) {
        iframe.initializationHandler = function (event) {
          if (event.data !== sandbox.adapter.sandboxInitializedMessage) {
            return;
          }
          try {
            // verify this message came from the expected sandbox; try/catch because ie8 will disallow reading contentWindow in the case of another sandbox's message
            if (event.source !== iframe.contentWindow) {
              return;
            }
          } catch (e) {
            return;
          }
          window.removeEventListener('message', iframe.initializationHandler);

          sandbox.pokey.configuration.eventCallback(function () {
            //iframe sandbox has initialized (services connected)
            resolve(sandbox);
          });
        };
        window.addEventListener('message', iframe.initializationHandler);
      }));

      sandbox.el = iframe;

      iframe.oasisLoadHandler = function (event) {
        if (event.data !== sandbox.adapter.oasisLoadedMessage) {
          return;
        }
        try {
          // verify this message came from the expected sandbox; try/catch
          // because ie8 will disallow reading contentWindow in the case of
          // another sandbox's message
          if (event.source !== iframe.contentWindow) {
            return;
          }
        } catch (e) {
          return;
        }

        //iFrame has loaded Pokey...

        if (verifyCurrentSandboxOrigin(sandbox, event)) {
          //todo ---- transfer services to new iframe
        }

        if (sandbox.options.reconnect === "none") {
          window.removeEventListener('message', iframe.oasisLoadHandler);
        }
      };
      window.addEventListener('message', iframe.oasisLoadHandler);
    }
  }, {
    key: 'terminateSandbox',
    value: function terminateSandbox() {}
  }, {
    key: 'connectPorts',
    value: function connectPorts() {}
  }, {
    key: 'connectSandbox',
    value: function connectSandbox(pokey) {
      //todo - make static method
      _adapter_base2['default'].prototype.connectSandbox.call(this, window, pokey);
    }
  }], [{
    key: 'name',
    value: function name(sandbox) {
      return sandbox.el.name;
    }
  }]);

  return AdapterIFrame;
})(_adapter_base2['default']);

function verifySandbox(pokey, sandboxUrl) {
  var iframe = document.createElement('iframe'),
      link;

  if (pokey.configuration.allowSameOrigin && iframe.sandbox !== undefined || iframe.sandbox === undefined) {
    // The sandbox attribute isn't supported (IE8/9) or we want a child iframe
    // to access resources from its own domain (youtube iframe),
    // we need to make sure the sandbox is loaded from a separate domain
    link = document.createElement('a');
    link.href = sandboxUrl;

    if (!link.host || link.protocol === window.location.protocol && link.host === window.location.host) {
      throw new Error("Security: iFrames from the same host cannot be sandboxed in older browsers and is disallowed. For HTML5 browsers supporting the `sandbox` attribute on iframes, you can add the `allow-same-origin` flag only if you host the sandbox on a separate domain.");
    }
  }
}

function verifyCurrentSandboxOrigin(sandbox, event) {
  var linkOriginal, linkCurrent;

  if (sandbox.firstLoad || sandbox.options.reconnect === "any") {
    return true;
  }

  if (!sandbox.pokey.configuration.allowSameOrigin || event.origin === "null") {
    fail();
  } else {
    linkOriginal = document.createElement('a');
    linkCurrent = document.createElement('a');

    linkOriginal.href = sandbox.options.url;
    linkCurrent.href = event.origin;

    if (linkCurrent.protocol === linkOriginal.protocol && linkCurrent.host === linkOriginal.host) {
      return true;
    }

    fail();
  }

  function fail() {
    sandbox.onerror(new Error("Error reconnecting..."));
  }
}

exports['default'] = AdapterIFrame;
module.exports = exports['default'];

},{"./adapter_base":2}],4:[function(require,module,exports){
'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _utils = require('./utils');

var _port = require('./port');

var _port2 = _interopRequireDefault(_port);

var Channel = (function () {
  function Channel(pokey) {
    _classCallCheck(this, Channel);

    this.channel = new MessageChannel();

    this.port1 = new _port2['default'](pokey, this.channel.port1);
    this.port2 = new _port2['default'](pokey, this.channel.port2);
  }

  _createClass(Channel, [{
    key: 'start',
    value: function start() {
      this.port1.start();
      this.port2.start();
    }
  }, {
    key: 'destroy',
    value: function destroy() {
      this.port1.close();
      this.port2.close();
      delete this.port1;
      delete this.port2;
      delete this.channel;
    }
  }]);

  return Channel;
})();

Channel.start = (0, _utils.mustImplement)('Channel', 'start');

},{"./port":8,"./utils":11}],5:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.connect = connect;
exports.registerHandler = registerHandler;
exports.portFor = portFor;

var _utils = require('./utils');

//can just pass string (get promise), string and callback (callback), or object with named consumers

function connect(serviceName, callback) {
  if (typeof serviceName === 'object') {
    return connectConsumers(this, serviceName);
  } else if (callback) {
    return connectCallbacks(this, serviceName, callback);
  } else {
    return connectPromise(this, serviceName);
  }
}

function registerHandler(pokey, serviceName, options) {
  var port = pokey.ports[serviceName];

  if (port) {
    //todo
  }
}

function portFor(serviceName) {
  var port = this.ports[serviceName];
  (0, _utils.assert)(port, "You asked for the port for the service named '" + serviceName + ", but the environment did not provide one.");
  return port;
}

function connectPromise(pokey, serviceName) {
  //todo
}

function connectCallbacks(pokey, serviceName, callback) {
  //todo
}

function connectConsumers(pokey, consumerMap) {
  //todo
}

},{"./utils":11}],6:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Events = (function () {
  function Events() {
    _classCallCheck(this, Events);

    this.subscribers = {};
  }

  _createClass(Events, [{
    key: "on",
    value: function on(eventName, listener) {
      var listeners = this.subscribers[eventName] = this.subscribers[eventName] || [];

      listeners.push(listener);
    }
  }, {
    key: "off",
    value: function off(eventName, listener) {
      var listeners = this.subscribers[eventName];
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
  }, {
    key: "clear",
    value: function clear(eventName) {
      delete this.subscribers[eventName];
    }
  }, {
    key: "trigger",
    value: function trigger(eventName) {
      var listeners = this.subscribers[eventName];
      if (!listeners) {
        return;
      }

      var args = Array.prototype.slice.call(arguments, 1);

      for (var i = 0; i < listeners.length; ++i) {
        listeners[i].apply(null, args);
      }
    }
  }]);

  return Events;
})();

exports["default"] = Events;
module.exports = exports["default"];

},{}],7:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _service = require('./service');

var _service2 = _interopRequireDefault(_service);

var _sandbox = require('./sandbox');

var _sandbox2 = _interopRequireDefault(_sandbox);

var _events = require('./events');

var _events2 = _interopRequireDefault(_events);

var _connect = require('./connect');

var _adapter_iframe = require('./adapter_iframe');

var _adapter_iframe2 = _interopRequireDefault(_adapter_iframe);

var Pokey = (function () {
  function Pokey() {
    _classCallCheck(this, Pokey);

    this.pokeyId = 'pokey' + +new Date();
    this.requestId = 0;

    this.consumers = {};
    this.services = [];

    this.ports = {};
    this.handlers = {};

    this.receivedPorts = false;

    this.configuration = {
      eventCallback: function eventCallback(callback) {
        return callback();
      },
      allowSameOrigin: false,
      reconnect: 'verify' //todo - allow setting to 'none, 'any'
    };

    this.events = new _events2['default']();

    this.onCreate();
  }

  //noop for now

  _createClass(Pokey, [{
    key: 'onCreate',
    value: function onCreate() {}

    /**
     * entry point for containing environment to create child sandbox
     * @param options with fields
     * services
     * url - url for JS file that will initialize sandbox in sandboxed environment
     * //todo - multiple types - iframe, workers
     */
  }, {
    key: 'createSandbox',
    value: function createSandbox(options) {
      return new _sandbox2['default'](this, options);
    }
  }]);

  return Pokey;
})();

Object.assign(Pokey, {

  connect: _connect.connect,

  portFor: _connect.portFor,

  adapters: {
    iframe: new _adapter_iframe2['default']()

    //in a future version...
    //webworker: new WebworkerAdapter(),
    //inline: new InlineAdapter()
  }
});

exports['default'] = Pokey;
module.exports = exports['default'];

},{"./adapter_iframe":3,"./connect":5,"./events":6,"./sandbox":9,"./service":10}],8:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _utils = require('./utils');

var Port = (function () {
  function Port(pokey, port) {
    _classCallCheck(this, Port);
  }

  //Interface-like --- throw error unless all are implemented

  _createClass(Port, [{
    key: 'request',
    value: function request(eventName) {
      //todo
    }
  }, {
    key: 'onRequest',
    value: function onRequest(eventName, callback, binding) {
      //todo
    }
  }]);

  return Port;
})();

['on', 'all', 'off', 'send', 'start', 'close'].forEach(function (method) {
  Port[method] = (0, _utils.mustImplement)('Port', method);
});

exports['default'] = Port;
module.exports = exports['default'];

},{"./utils":11}],9:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _utils = require('./utils');

var Sandbox = (function () {
  function Sandbox(pokey, opts) {
    _classCallCheck(this, Sandbox);

    var options = Object.assign({}, pokey.configuration, opts);
    (0, _utils.assert)(['none', 'verify'].indexOf(options.reconnect) > -1, 'Reconnect must be either "none" or "verify".');

    //todo - verify this bit
    var capabilities = options.capabilities;
    (0, _utils.assert)(capabilities, 'You must provide a list of services you wish to expose/use on options.capabilities');

    this.adapter = options.adapter || pokey.adapters.iframe;

    this.pokey = pokey;

    this.connections = {};
    //let other things listen in
    this.wiretaps = [];
    this.channels = {};
    this.capabilities = {};
    this.options = options;

    //todo
    this._waitForLoadPromise = new Promise();

    this.firstLoad = true;

    this.adapter.initializeSandbox(this);
  }

  _createClass(Sandbox, [{
    key: 'createAndTransferCapabilities',
    value: function createAndTransferCapabilities() {
      if (!this.firstLoad) {
        this.promisePorts();
      }

      this.createChannels();
      this.connectPorts();

      // subsequent calls to `createAndTransferCapabilities` requires new port promises
      this.firstLoad = false;
    }
  }, {
    key: 'promisePorts',
    value: function promisePorts() {}
  }, {
    key: 'createChannels',
    value: function createChannels() {}
  }, {
    key: 'connectPorts',
    value: function connectPorts() {}
  }, {
    key: 'destroyChannels',
    value: function destroyChannels() {}
  }, {
    key: 'waitForLoad',
    value: function waitForLoad() {}
  }, {
    key: 'wiretap',
    value: function wiretap() {}
  }, {
    key: 'connect',
    value: function connect() {}
  }, {
    key: 'start',
    value: function start() {}
  }, {
    key: 'terminate',
    value: function terminate() {}
  }, {
    key: 'onerror',
    value: function onerror(error) {
      throw error;
    }
  }]);

  return Sandbox;
})();

exports.Sandbox = Sandbox;

},{"./utils":11}],10:[function(require,module,exports){
/**
 Base class services (in containing environment) + consumers (in sandbox) can subclass to implement several events + requests

 accepts

 initialize (function) - called when other side initiates connection

 events (object) - map of event names and callbacks, called when other end triggers respective event

 requests (object) - map of request names and callbacks, called when other end requests
 */

"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Service = (function () {
  function Service(port, sandbox) {
    var params = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

    _classCallCheck(this, Service);

    var self = this;

    this.port = port;
    this.sandbox = sandbox;

    function wrapCb(cb) {
      return function () {
        return cb.apply(self, arguments);
      };
    }

    for (var prop in params.events) {
      var callback = params.events[prop];
      port.on(prop, wrapCb(callback));
    }

    for (var prop in params.requests) {
      var callback = params.requests[prop];
      port.onRequest(prop, wrapCb(callback));
    }
  }

  _createClass(Service, [{
    key: "initialize",
    value: function initialize() {}
  }, {
    key: "error",
    value: function error() {}
  }, {
    key: "destroy",
    value: function destroy() {}

    /**
     *
     * @param {String} eventName
     * @param {Structured} data
     * @returns {*}
     * //todo - ensure this binding
     */
  }, {
    key: "send",
    value: function send() {
      var _port;

      return (_port = this.port).send.apply(_port, arguments);
    }

    /**
     *
     * @param {String} requestName
     * @param {Promise} promise resolved by other end
     * @returns {*}
     * //todo - ensure this binding
     */
  }, {
    key: "request",
    value: function request() {
      var _port2;

      return (_port2 = this.port).request.apply(_port2, arguments);
    }
  }]);

  return Service;
})();

exports["default"] = Service;
module.exports = exports["default"];

},{}],11:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.noop = noop;
exports.assert = assert;
exports.isInWorker = isInWorker;
exports.mustImplement = mustImplement;
exports.UUID = UUID;
exports.isUrl = isUrl;

function noop() {}

function assert(string, assertion) {
  if (!assertion) {
    throw new Error(string);
  }
}

function isInWorker() {
  return typeof Worker === 'undefined' && typeof Window === 'undefined';
}

function mustImplement(className, name) {
  return function () {
    throw new Error("Subclass of " + className + " must implement " + name);
  };
}

//RFC1422 v4 compliant UUID, using time for more uniqueness

function UUID() {
  function generateUUID() {
    var d = new Date().getTime();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = (d + Math.random() * 16) % 16 | 0;
      d = Math.floor(d / 16);
      return (c == 'x' ? r : r & 0x3 | 0x8).toString(16);
    });
  }
}

function isUrl(s) {
  var regexp = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
  return regexp.test(s);
}

},{}]},{},[1])


//# sourceMappingURL=../app/bundle.js.map