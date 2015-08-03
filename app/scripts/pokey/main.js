import Service from './service';
import Sandbox from './sandbox';
import { connect, portFor, connectCapabilities } from './connect';

import AdapterWorker from './adapter_worker';
import AdapterIFrame from './adapter_iframe';

class Pokey {
  constructor (options) {

    this.pokeyId   = 'pokey' + (+new Date());
    this.requestId = 0;

    this.consumers = {};
    this.services  = [];

    //event handling
    this.ports    = {};
    this.handlers = {};

    //state, aids handling of registering callbacks (e.g. whether to setup or wait for port to resolve) -- see connect/registerHandler
    this.receivedPorts = false;

    //default configuration
    this.configuration = Object.assign({

      //allow proxying of event callbacks
      //includes load/connect events, + channel events 'on' and 'all'
      eventCallback: (callback) => { return callback(); },

      //security - allowSameOrigin on iFrames
      allowSameOrigin: false,

      //security - allow reconnections on iframe navigation?
      reconnect: 'verify'

    }, options);

    //adapters are used to orchestrate communication between specific types of sandboxes
    this.adapters = {
      iframe: new AdapterIFrame(),
      worker: new AdapterWorker()

      //in a future version maybe ... inline not secure though
      //inline: new AdapterInline()
    };

    //init handler
    this.onCreate();
  }

  //noop for now, can be extended
  onCreate () {}

  /**
   * entry point for containing environment to create child sandbox
   * @param options with fields
   * capabilities
   * url - url for JS file that will initialize sandbox in sandboxed environment
   * type - currently, only support 'iframe' (default)
   */
  createSandbox (options) {
    return new Sandbox(this, options);
  }

  /**
   * Configure the Pokey object
   * @param {Object} params
   * @returns {*} configuration
   */
  configure (params) {
    return Object.assign(this.configuration, params);
  }
}

Object.assign(Pokey.prototype, {
  connect            : connect,
  connectCapabilities: connectCapabilities,
  portFor            : portFor
});

export default Pokey;


/****** auto initialization *****/

/* in sandboxes, we want to automatically start things up to continue handshake process */
function autoInitializeSandbox () {
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