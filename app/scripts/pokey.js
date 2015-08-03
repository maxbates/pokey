(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var Port = (function () {
  function Port(pokey, port) {
    _classCallCheck(this, Port);

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

  _createClass(Port, [{
    key: 'on',
    value: function on(eventName, callback, binding) {
      var pokey = this.pokey;

      function wrappedCallback(event) {
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
  }, {
    key: 'all',
    value: function all(callback, binding) {
      var pokey = this.pokey;

      function wrappedCallback(event) {
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
  }, {
    key: 'off',
    value: function off(eventName, callback) {
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
  }, {
    key: 'send',
    value: function send(eventName, data) {
      this.port.postMessage({
        type: eventName,
        data: data
      });
    }

    /**
     @private
     Adapters should implement this to start receiving messages from the other side of the connection. It is up to the adapter to make sure that no messages are dropped if they are sent before `start` is called.
     */
  }, {
    key: 'start',
    value: function start() {
      this.port.start();
    }

    /**
     @private
     Adapters should implement this to stop receiving messages from the other side of the connection.
     */
  }, {
    key: 'close',
    value: function close() {
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
  }, {
    key: 'request',
    value: function request(eventName) {
      var pokey = this.pokey;
      var port = this;
      var args = [].slice.call(arguments, 1);

      return new Promise(function (resolve, reject) {
        var requestId = getRequestId(pokey);

        var clearObservers = function clearObservers() {
          port.off('@response:' + eventName, observer);
          port.off('@errorResponse:' + eventName, errorObserver);
        };

        var observer = function observer(event) {
          if (event.requestId === requestId) {
            clearObservers();
            resolve(event.data);
          }
        };

        var errorObserver = function errorObserver(event) {
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
  }, {
    key: 'onRequest',
    value: function onRequest(eventName, callback, binding) {
      var self = this;

      this.on('@request:' + eventName, function (data) {
        var requestId = data.requestId,
            args = data.args,
            getResponse = new Promise(function (resolve, reject) {
          var value = callback.apply(binding, args);
          if (undefined !== value) {
            resolve(value);
          } else {
            reject("@request:" + eventName + " [" + data.requestId + "] did not return a value.  If you want to return a literal `undefined` return `Promise.resolve(undefined)`");
          }
        });

        getResponse.then(function (value) {
          self.send('@response:' + eventName, {
            requestId: requestId,
            data: value
          });
        }, function (error) {
          var value = error;
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
  }]);

  return Port;
})();

function getRequestId(pokey) {
  return pokey.pokeyId + '-' + pokey.requestId++;
}

exports['default'] = Port;
module.exports = exports['default'];

},{}],2:[function(require,module,exports){
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

var pokeyLoadedMessage = "pokeySandboxLoaded";
var sandboxInitializedMessage = "pokeySandboxInitialized";

var AdapterBase = (function () {
  function AdapterBase() {
    _classCallCheck(this, AdapterBase);

    //add unsupported capabilities e.g. to prevent capabilities from being registered
    this._unsupportedCapabilities = [];
  }

  _createClass(AdapterBase, [{
    key: 'unsupportedCapabilities',
    value: function unsupportedCapabilities() {
      return this._unsupportedCapabilities;
    }
  }, {
    key: 'addUnsupportedCapability',
    value: function addUnsupportedCapability(capability) {
      this._unsupportedCapabilities.push(capability);
    }
  }, {
    key: 'filterCapabilities',
    value: function filterCapabilities(capabilities) {
      var unsupported = this._unsupportedCapabilities;
      return capabilities.filter(function (capability) {
        return unsupported.indexOf(capability) === -1;
      });
    }

    //inherited, not static
  }, {
    key: 'createChannel',
    value: function createChannel(pokey) {
      var channel = new _channel2['default'](pokey);
      channel.port1.start();
      return channel;
    }

    //inherited, not static
  }, {
    key: 'environmentPort',
    value: function environmentPort(sandbox, channel) {
      return channel.port1;
    }

    //inherited, not static
  }, {
    key: 'sandboxPort',
    value: function sandboxPort(sandbox, channel) {
      return channel.port2;
    }

    //inherited, not static
  }, {
    key: 'proxyPort',
    value: function proxyPort(sandbox, port) {
      return port;
    }

    //inherited, not static
  }, {
    key: 'createInitializationMessage',
    value: function createInitializationMessage(sandbox) {
      return {
        isPokeyInitialization: true,
        capabilities: sandbox._capabilitiesToConnect
      };
    }

    /*
    Sandbox API
    These methods are called from the sandbox, not the hosting environment
     */

    //subclasses may just delegate to this, in their own context
  }, {
    key: 'connectSandbox',
    value: function connectSandbox(receiver, pokey) {
      var adapter = this;

      //todo - consistency in event data
      function initializePokeySandbox(event) {
        if (!event.data.isPokeyInitialization) {
          return;
        }

        receiver.removeEventListener('message', initializePokeySandbox);
        adapter.initializePokeySandbox(event, pokey);
      }

      receiver.addEventListener('message', initializePokeySandbox);

      adapter.pokeyLoaded(pokey);
    }
  }, {
    key: 'initializePokeySandbox',
    value: function initializePokeySandbox(event, pokey) {
      var adapter = this;
      pokey.configuration.eventCallback(function () {
        pokey.connectCapabilities(event.data.capabilities, event.ports);
        adapter.didConnect(pokey);
      });
    }

    // subclasses should implement
    // called when pokey has loaded (completed initial setup), send message to start handshake (trigger pokeyLoadHandler)
  }, {
    key: 'pokeyLoaded',
    value: function pokeyLoaded() {}

    // subclasses should implement
    // called after capabilities connected, send message back to complete handshake (trigger initializationHandler)
  }, {
    key: 'didConnect',
    value: function didConnect() {}
  }]);

  return AdapterBase;
})();

Object.assign(AdapterBase.prototype, {
  initializeSandbox: (0, _utils.mustImplement)('AdapterBase', 'initializeSandbox'),
  pokeyLoadedMessage: pokeyLoadedMessage,
  sandboxInitializedMessage: sandboxInitializedMessage
});

//note - cannot assign readonly field 'name'

exports['default'] = AdapterBase;
module.exports = exports['default'];

},{"./channel":5,"./utils":11}],3:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _utils = require('./utils');

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

    /*
    Environment
    Methods called by the hosting environment
     */

    /**
     * For the iFrame, we:
     * (1) create the iFrame, and register it on sandbox.el
     * (2) set up listeners (see handshake doc)
     *    (1) error handler
     *    (2) loaded event
     *    (3) initialize event
     * @param sandbox
     */
    value: function initializeSandbox(sandbox) {
      var options = sandbox.options,
          iframe = document.createElement('iframe'),
          sandboxAttributes = ['allow-scripts']; //todo - can allow more...

      iframe.name = sandbox.options.url + '?uuid=' + (0, _utils.UUID)();
      iframe.sandbox = sandboxAttributes.join(' ');
      iframe.seamless = true;

      //todo - make options more explicit, give own object?
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
      sandbox.loadDeferred.resolve(new Promise(function (resolve, reject) {
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

      iframe.pokeyLoadHandler = function (event) {
        if (event.data !== sandbox.adapter.pokeyLoadedMessage) {
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
          sandbox.createAndTransferCapabilities();
        }

        if (sandbox.options.reconnect === "none") {
          window.removeEventListener('message', iframe.pokeyLoadHandler);
        }
      };
      window.addEventListener('message', iframe.pokeyLoadHandler);
    }

    //programmatically start sandbox e.g. for testing
    //generally, you want to attach the iFrame yourself, because when moved in the DOM, the iFrame is reloaded
  }, {
    key: 'startSandbox',
    value: function startSandbox(sandbox, options) {
      var head = document.head || document.documentElement.getElementsByTagName('head')[0];
      head.appendChild(sandbox.el);
    }
  }, {
    key: 'connectPorts',
    value: function connectPorts(sandbox, ports) {
      var rawPorts = ports.map(function (port) {
        return port.port;
      }),
          message = this.createInitializationMessage(sandbox);

      if (sandbox.terminated) {
        return;
      }

      sandbox.el.contentWindow.postMessage(message, '*', rawPorts);
    }

    /*
    Sandbox API
    These methods are called from the sandbox, not the hosting environment
     */

  }, {
    key: 'connectSandbox',
    value: function connectSandbox(pokey) {
      return _adapter_base2['default'].prototype.connectSandbox.call(this, window, pokey);
    }
  }, {
    key: 'pokeyLoaded',
    value: function pokeyLoaded() {
      window.parent.postMessage(this.pokeyLoadedMessage, '*', []);
    }
  }, {
    key: 'didConnect',
    value: function didConnect() {
      window.parent.postMessage(this.sandboxInitializedMessage, '*', []);
    }
  }], [{
    key: 'name',
    value: function name(sandbox) {
      return sandbox.el.name;
    }
  }, {
    key: 'terminateSandbox',
    value: function terminateSandbox(sandbox) {
      var el = sandbox.el;

      sandbox.terminated = true;

      if (el.loadHandler) {
        // no load handler for HTML sandboxes
        el.removeEventListener('load', el.loadHandler);
      }
      window.removeEventListener('message', el.initializationHandler);
      window.removeEventListener('message', el.pokeyLoadHandler);

      if (el.parentNode) {
        el.parentNode.removeChild(el);
      }

      sandbox.el = null;
    }
  }]);

  return AdapterIFrame;
})(_adapter_base2['default']);

function verifySandbox(pokey, sandboxUrl) {
  var iframe = document.createElement('iframe');

  if (pokey.configuration.allowSameOrigin && iframe.sandbox !== undefined || iframe.sandbox === undefined) {
    // The sandbox attribute isn't supported (IE8/9) or we want a child iframe
    // to access resources from its own domain (youtube iframe),
    // we need to make sure the sandbox is loaded from a separate domain
    var link = document.createElement('a');
    link.href = sandboxUrl;

    if (!link.host || link.protocol === window.location.protocol && link.host === window.location.host) {
      throw new Error("Security: iFrames from the same host cannot be sandboxed in older browsers and is disallowed. For HTML5 browsers supporting the `sandbox` attribute on iframes, you can add the `allow-same-origin` flag only if you host the sandbox on a separate domain.");
    }
  }

  //iframe will be garbage collected
}

function verifyCurrentSandboxOrigin(sandbox, event) {
  if (sandbox.firstLoad || sandbox.options.reconnect === "any") {
    return true;
  }

  if (!sandbox.pokey.configuration.allowSameOrigin || event.origin === "null") {
    fail();
  } else {
    var linkOriginal = document.createElement('a'),
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

},{"./adapter_base":2,"./utils":11}],4:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _utils = require('./utils');

var _adapter_base = require('./adapter_base');

// note that workers must be from the same origin. To use a cross-origin worker, you need to load it into an iFrame, or create an intermediate worker and load the remote worker as a Blob (won't work in all browsers)

var _adapter_base2 = _interopRequireDefault(_adapter_base);

var AdapterWorker = (function (_AdapterBase) {
  _inherits(AdapterWorker, _AdapterBase);

  function AdapterWorker() {
    _classCallCheck(this, AdapterWorker);

    _get(Object.getPrototypeOf(AdapterWorker.prototype), 'constructor', this).call(this);
  }

  /*
  Environment
  Methods called by the hosting environment
   */

  /**
   * For the Worker, we:
   * (1) create the Worker
   * (2) set up listeners (see handshake doc)
   *    (1) error handler
   *    (2) loaded event
   *    (3) initialize event
   * @param sandbox
   */

  _createClass(AdapterWorker, [{
    key: 'initializeSandbox',
    value: function initializeSandbox(sandbox) {
      var worker = new Worker(sandbox.options.url);
      worker.name = sandbox.options.url + '?uuid=' + (0, _utils.UUID)();
      sandbox.worker = worker;

      // Error handling inside the worker
      worker.errorHandler = function (event) {
        if (!event.data.sandboxException) {
          return;
        }

        sandbox.onerror(event.data.sandboxException);
      };
      worker.addEventListener('message', worker.errorHandler);

      sandbox.loadDeferred.resolve(new Promise(function (resolve, reject) {
        worker.initializationHandler = function (event) {
          sandbox.pokey.configuration.eventCallback(function () {
            if (event.data !== sandbox.adapter.sandboxInitializedMessage) {
              return;
            }
            worker.removeEventListener('message', worker.initializationHandler);

            resolve(sandbox);
          });
        };
        worker.addEventListener('message', worker.initializationHandler);
      }));

      worker.loadHandler = function (event) {
        sandbox.pokey.configuration.eventCallback(function () {
          if (event.data !== sandbox.adapter.pokeyLoadedMessage) {
            return;
          }
          //worker sandbox initialized

          worker.removeEventListener('message', worker.loadHandler);
          sandbox.createAndTransferCapabilities();
        });
      };
      worker.addEventListener('message', worker.loadHandler);
    }

    //e.g. for testing
  }, {
    key: 'startSandbox',
    value: function startSandbox() {}
  }, {
    key: 'terminateSandbox',
    value: function terminateSandbox(sandbox) {
      var worker = sandbox.worker;

      sandbox.terminated = true;

      worker.removeEventListener('message', worker.loadHandler);
      worker.removeEventListener('message', worker.initializationHandler);

      sandbox.worker.terminate();
    }
  }, {
    key: 'connectPorts',
    value: function connectPorts(sandbox, ports) {
      var rawPorts = ports.map(function (port) {
        return port.port;
      }),
          message = this.createInitializationMessage(sandbox);

      if (sandbox.terminated) {
        return;
      }

      sandbox.worker.postMessage(message, rawPorts);
    }

    /*
    Sandbox API
    These methods are called from the sandbox, not the hosting environment
     */

  }, {
    key: 'connectSandbox',
    value: function connectSandbox(pokey) {
      //'self' for Worker context
      return _adapter_base2['default'].prototype.connectSandbox.call(this, self, pokey);
    }
  }, {
    key: 'pokeyLoaded',
    value: function pokeyLoaded() {
      postMessage(this.pokeyLoadedMessage, []);
    }
  }, {
    key: 'didConnect',
    value: function didConnect() {
      postMessage(this.sandboxInitializedMessage, []);
    }
  }]);

  return AdapterWorker;
})(_adapter_base2['default']);

exports['default'] = AdapterWorker;
module.exports = exports['default'];

},{"./adapter_base":2,"./utils":11}],5:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

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

exports['default'] = Channel;
module.exports = exports['default'];

},{"./port":8,"./utils":11}],6:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.connect = connect;
exports.registerHandler = registerHandler;
exports.portFor = portFor;
exports.connectCapabilities = connectCapabilities;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _utils = require('./utils');

var _Port = require('./Port');

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

var _Port2 = _interopRequireDefault(_Port);

function connect(capability, callback, errorCallback) {
  if (typeof capability === 'object') {
    return connectConsumers(this, capability);
  } else if (callback) {
    return connectCallbacks(this, capability, callback, errorCallback);
  } else {
    return connectPromise(this, capability);
  }
}

function registerHandler(pokey, capability, options) {
  var port = pokey.ports[capability];

  if (port) {
    //found port, set up capability
    options.setupCapability(port);

    if (options.promise) {
      options.promise.then(port.start)['catch'](function () {});
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

function portFor(capability) {
  var port = this.ports[capability];
  (0, _utils.assert)(port, "You asked for the port for the capability named '" + capability + ", but didn't have one");
  return port;
}

//todo - clean

function connectCapabilities(capabilities, eventPorts) {
  var pokey = this;
  capabilities.forEach(function (capability, i) {
    var handler = pokey.handlers[capability],
        port = new _Port2['default'](pokey, eventPorts[i]);

    if (handler) {
      Promise.resolve(handler.setupCapability(port)).then(function () {
        port.start();
      })['catch'](function () {});
    }

    pokey.ports[capability] = port;
  });

  // for each handler without a capability, reject
  for (var prop in pokey.handlers) {
    if (!pokey.ports[prop]) {
      pokey.handlers[prop].rejectCapability();
    }
  }

  this.receivedPorts = true;
}

function connectPromise(pokey, capability) {
  var deferred = new _utils.Deferred();
  registerHandler(pokey, capability, {
    promise: deferred.promise,
    setupCapability: function setupCapability(port) {
      deferred.resolve(port);
      return deferred.promise;
    },
    rejectCapability: function rejectCapability() {
      deferred.reject('Capability ' + capability + ' rejected. Make sure it is registered.');
    }
  });
  return deferred.promise;
}

function connectCallbacks(pokey, capability, callback, errorCallback) {
  registerHandler(pokey, capability, {
    setupCapability: function setupCapability(port) {
      callback(port);
    },
    rejectCapability: function rejectCapability() {
      if (errorCallback) {
        errorCallback();
      }
    }
  });
}

//todo - clean
//todo - verify this works
function connectConsumers(pokey, consumers) {
  function setupCapability(Consumer, name) {
    return function (port) {
      var consumer = new Consumer(port);
      pokey.consumers[name] = consumer;
      consumer.initialize(port, name);
    };
  }

  function rejectCapability(prop) {
    return function () {
      consumers[prop].prototype.error();
    };
  }

  for (var prop in consumers) {
    registerHandler(pokey, prop, {
      setupCapability: setupCapability(consumers[prop], prop),
      rejectCapability: rejectCapability(prop)
    });
  }
}

},{"./Port":1,"./utils":11}],7:[function(require,module,exports){
(function (global){
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

var _connect = require('./connect');

var _adapter_worker = require('./adapter_worker');

var _adapter_worker2 = _interopRequireDefault(_adapter_worker);

var _adapter_iframe = require('./adapter_iframe');

var _adapter_iframe2 = _interopRequireDefault(_adapter_iframe);

var Pokey = (function () {
  function Pokey(options) {
    _classCallCheck(this, Pokey);

    this.pokeyId = 'pokey' + +new Date();
    this.requestId = 0;

    this.consumers = {};
    this.services = [];

    this.ports = {};
    this.handlers = {};

    this.receivedPorts = false;

    //default configuration
    this.configuration = Object.assign({

      //allow proxying of event callbacks
      //includes load/connect events, + channel events 'on' and 'all'
      eventCallback: function eventCallback(callback) {
        return callback();
      },

      //security - allowSameOrigin on iFrames
      allowSameOrigin: false,

      //security - allow reconnections on iframe navigation?
      reconnect: 'verify'

    }, options);

    this.adapters = {
      iframe: new _adapter_iframe2['default'](),
      worker: new _adapter_worker2['default']()

      //in a future version maybe ... inline not secure though
      //inline: new AdapterInline()
    };

    this.onCreate();
  }

  //noop for now, can be extended

  _createClass(Pokey, [{
    key: 'onCreate',
    value: function onCreate() {}

    /**
     * entry point for containing environment to create child sandbox
     * @param options with fields
     * capabilities
     * url - url for JS file that will initialize sandbox in sandboxed environment
     * type - currently, only support 'iframe' (default)
     */
  }, {
    key: 'createSandbox',
    value: function createSandbox(options) {
      return new _sandbox2['default'](this, options);
    }
  }, {
    key: 'configure',
    value: function configure(params) {
      return Object.assign(this.configuration, params);
    }
  }]);

  return Pokey;
})();

Object.assign(Pokey.prototype, {
  connect: _connect.connect,
  connectCapabilities: _connect.connectCapabilities,
  portFor: _connect.portFor
});

exports['default'] = Pokey;

/****** auto initialization *****/

/* in sandboxes, we want to automatically start things up to continue handshake process */
function autoInitializeSandbox() {
  if (typeof window !== 'undefined') {

    //expose on window
    //todo - encapsulate to allow multiple instances on page (should pass this into connectSandbox)
    window.pokey = global.pokey = new Pokey();

    //in the future, could handle inline workers here

    if (window.parent && window.parent !== window) {
      pokey.adapters.iframe.connectSandbox(pokey);
    }
  } else {

    self.pokey = new Pokey();

    //handle web workers
    pokey.adapters.worker.connectSandbox(pokey);
  }
}

autoInitializeSandbox();
module.exports = exports['default'];

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./adapter_iframe":3,"./adapter_worker":4,"./connect":6,"./sandbox":9,"./service":10}],8:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var Port = (function () {
  function Port(pokey, port) {
    _classCallCheck(this, Port);

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

  _createClass(Port, [{
    key: 'on',
    value: function on(eventName, callback, binding) {
      var pokey = this.pokey;

      function wrappedCallback(event) {
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
  }, {
    key: 'all',
    value: function all(callback, binding) {
      var pokey = this.pokey;

      function wrappedCallback(event) {
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
  }, {
    key: 'off',
    value: function off(eventName, callback) {
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
  }, {
    key: 'send',
    value: function send(eventName, data) {
      this.port.postMessage({
        type: eventName,
        data: data
      });
    }

    /**
     @private
     Adapters should implement this to start receiving messages from the other side of the connection. It is up to the adapter to make sure that no messages are dropped if they are sent before `start` is called.
     */
  }, {
    key: 'start',
    value: function start() {
      this.port.start();
    }

    /**
     @private
     Adapters should implement this to stop receiving messages from the other side of the connection.
     */
  }, {
    key: 'close',
    value: function close() {
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
  }, {
    key: 'request',
    value: function request(eventName) {
      var pokey = this.pokey;
      var port = this;
      var args = [].slice.call(arguments, 1);

      return new Promise(function (resolve, reject) {
        var requestId = getRequestId(pokey);

        var clearObservers = function clearObservers() {
          port.off('@response:' + eventName, observer);
          port.off('@errorResponse:' + eventName, errorObserver);
        };

        var observer = function observer(event) {
          if (event.requestId === requestId) {
            clearObservers();
            resolve(event.data);
          }
        };

        var errorObserver = function errorObserver(event) {
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
  }, {
    key: 'onRequest',
    value: function onRequest(eventName, callback, binding) {
      var self = this;

      this.on('@request:' + eventName, function (data) {
        var requestId = data.requestId,
            args = data.args,
            getResponse = new Promise(function (resolve, reject) {
          var value = callback.apply(binding, args);
          if (undefined !== value) {
            resolve(value);
          } else {
            reject("@request:" + eventName + " [" + data.requestId + "] did not return a value.  If you want to return a literal `undefined` return `Promise.resolve(undefined)`");
          }
        });

        getResponse.then(function (value) {
          self.send('@response:' + eventName, {
            requestId: requestId,
            data: value
          });
        }, function (error) {
          var value = error;
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
  }]);

  return Port;
})();

function getRequestId(pokey) {
  return pokey.pokeyId + '-' + pokey.requestId++;
}

exports['default'] = Port;
module.exports = exports['default'];

},{}],9:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _utils = require('./utils');

var _port = require('./port');

//map sandbox.type to adapter name

var _port2 = _interopRequireDefault(_port);

var typeToAdapterNameMap = {
  html: 'iframe',
  iframe: 'iframe',
  worker: 'worker',
  js: 'worker'
};

var Sandbox = (function () {
  function Sandbox(pokey, opts) {
    _classCallCheck(this, Sandbox);

    var options = Object.assign({}, pokey.configuration, opts);

    //todo - allow reconnect: 'any'
    (0, _utils.assert)(['none', 'verify'].indexOf(options.reconnect) > -1, 'Reconnect must be either "none" or "verify".');

    var capabilities = options.capabilities;
    (0, _utils.assert)(capabilities, 'You must provide a list of capabilities you wish to expose/use on options.capabilities');

    //default to iframe adapter
    var adapterName = typeToAdapterNameMap[options.type] || 'iframe';
    this.adapter = pokey.adapters[adapterName];

    //in case multiple instances
    this.pokey = pokey;

    //list of allowed capabilities
    this._capabilitiesToConnect = this._filterCapabilities(capabilities);
    //maps of port promises, keyed by capability
    this.envPortDeferreds = {};
    this.sandboxPortDeferreds = {};

    //let other things listen in
    this.wiretaps = [];
    this.channels = {};
    this.capabilities = {};
    this.options = options;

    this.firstLoad = true;

    // use Deferred because will be resolved elsewhere (by the adapter)
    this.loadDeferred = new _utils.Deferred();

    this.promisePorts();

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
    value: function promisePorts() {
      var _this = this;

      this._capabilitiesToConnect.forEach(function (capability) {
        _this.envPortDeferreds[capability] = new _utils.Deferred();
        _this.sandboxPortDeferreds[capability] = new _utils.Deferred();
      });
    }

    //todo - clean up
  }, {
    key: 'createChannels',
    value: function createChannels() {
      var _this2 = this;

      var sandbox = this,
          services = this.options.services || {},
          channels = this.channels;

      // create port for each capability...
      this._capabilitiesToConnect.forEach(function (capability) {

        var service = services[capability],
            channel = undefined,
            port = undefined;

        // If an existing port is provided, just pass it along to the new sandbox.

        // todo - this should probably be of class Port if possible
        if (service instanceof _port2['default']) {
          port = _this2.adapter.proxyPort(_this2, service);
          _this2.capabilities[capability] = service;
        } else {
          channel = channels[capability] = _this2.adapter.createChannel(sandbox.pokey);

          var environmentPort = _this2.adapter.environmentPort(_this2, channel),
              sandboxPort = _this2.adapter.sandboxPort(_this2, channel);

          environmentPort.all(function (eventName, data) {
            this.wiretaps.forEach(function (wiretap) {
              wiretap(capability, {
                type: eventName,
                data: data,
                direction: 'received'
              });
            });
          }, sandbox);

          _this2.wiretaps.forEach(function (wiretap) {
            var originalSend = environmentPort.send;

            environmentPort.send = function (eventName, data) {
              wiretap(capability, {
                type: eventName,
                data: data,
                direction: 'sent'
              });

              originalSend.apply(environmentPort, arguments);
            };
          });

          if (service) {
            //container creating service for capability
            // Generic
            service = new service(environmentPort, _this2);
            service.initialize(environmentPort, capability);
            sandbox.pokey.services.push(service);
            _this2.capabilities[capability] = service;
          }

          // Law of Demeter violation...
          port = sandboxPort;

          _this2.envPortDeferreds[capability].resolve(environmentPort);
        }

        //port created
        _this2.sandboxPortDeferreds[capability].resolve(port);
      }, sandbox);
    }
  }, {
    key: 'connectPorts',
    value: function connectPorts() {
      var sandbox = this;

      Promise.all(sandbox._capabilitiesToConnect.map(function (capability) {
        return sandbox.sandboxPortDeferreds[capability].promise;
      })).then(function (ports) {
        //all ports created, transfer
        sandbox.adapter.connectPorts(sandbox, ports);
      });
    }
  }, {
    key: 'destroyChannels',
    value: function destroyChannels() {
      var _this3 = this;

      Object.keys(this.channels).forEach(function (key, index) {
        _this3.channels[key].destroy();
        delete _this3.channels[key];
      });
      this.channels = {};
    }
  }, {
    key: 'waitForLoad',
    value: function waitForLoad() {
      return this.loadDeferred.promise;
    }
  }, {
    key: 'wiretap',
    value: function wiretap(callback) {
      this.wiretaps.push(callback);
    }
  }, {
    key: 'connect',
    value: function connect(capability) {
      var portDeferred = this.envPortDeferreds[capability] || {},
          portPromise = portDeferred.promise;

      return portPromise || Promise.reject("Connect was called on '" + capability + "' but no such capability was registered.");
    }
  }, {
    key: 'start',
    value: function start(options) {
      this.adapter.startSandbox(this, options);
    }
  }, {
    key: 'terminate',
    value: function terminate() {
      var sandbox = this;

      if (this.isTerminated) {
        return;
      }
      this.isTerminated = true;

      this.adapter.terminateSandbox(this);

      this.destroyChannels();

      for (var index = 0; index < sandbox.pokey.services.length; index++) {
        sandbox.pokey.services[index].destroy();
        delete sandbox.pokey.services[index];
      }
      sandbox.pokey.services = [];
    }
  }, {
    key: '_filterCapabilities',

    //todo - should ensure unique
    value: function _filterCapabilities(capabilities) {
      return this.adapter.filterCapabilities(capabilities);
    }
  }, {
    key: '_waitForLoadDeferred',
    value: function _waitForLoadDeferred() {
      return this.loadDeferred.promise;
    }
  }], [{
    key: 'onerror',
    value: function onerror(error) {
      throw error;
    }
  }]);

  return Sandbox;
})();

exports['default'] = Sandbox;
module.exports = exports['default'];

},{"./port":8,"./utils":11}],10:[function(require,module,exports){
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

  /**
   This hook is called when the connection is established. When
   `initialize` is called, it is safe to register listeners and
   send data to the other side.
    The implementation of Oasis makes it impossible for messages
   to get dropped on the floor due to timing issues.
    @param {OasisPort} port the port to the other side of the connection
   @param {String} name the name of the service
   */

  _createClass(Service, [{
    key: "initialize",
    value: function initialize() {}

    /**
     This hooks is called when an attempt is made to connect to a capability the
     environment does not provide.
     */
  }, {
    key: "error",
    value: function error() {}

    /**
     This hook is called when the connection is stopped. When
     `destroy` is called, it is safe to unregister listeners.
     */
  }, {
    key: "destroy",
    value: function destroy() {}

    /**
     * send events to the other side of the
     connection
     * @param {String} eventName
     * @param {Structured} data
     * @returns {*}
     * //verify this binding
     */
  }, {
    key: "send",
    value: function send() {
      var _port;

      return (_port = this.port).send.apply(_port, arguments);
    }

    /**
     * request data from the other side of
     the connection
     * @param {String} requestName
     * @param {Promise} promise resolved by other end
     * @returns {*}
     * //verify this binding
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

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

exports.noop = noop;
exports.assert = assert;
exports.isInWorker = isInWorker;
exports.mustImplement = mustImplement;
exports.UUID = UUID;
exports.isUrl = isUrl;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

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

//ES6 classes dont let you created deferred (because can't guarantee exception handling), but annoying when want to resolve elsewhere...

var Deferred = (function () {
  function Deferred() {
    _classCallCheck(this, Deferred);

    defer(this);
  }

  //helper

  _createClass(Deferred, null, [{
    key: 'resolve',
    value: function resolve(deferred, value) {
      deferred.resolve(value);
    }
  }, {
    key: 'reject',
    value: function reject(deferred, value) {
      deferred.reject(value);
    }
  }]);

  return Deferred;
})();

exports.Deferred = Deferred;
function defer(deferred) {
  deferred.promise = new Promise(function (resolve, reject) {
    deferred.resolve = resolve;
    deferred.reject = reject;
  });
  return deferred;
}

},{}]},{},[7])


//# sourceMappingURL=../../app/scripts/pokey.js.map