import Service from './service';
import Sandbox from './sandbox';
import { connect, portFor, connectCapabilities } from './connect';

import AdapterIFrame from './adapter_iframe';

class Pokey {
  constructor (options) {

    this.pokeyId   = 'pokey' + (+new Date());
    this.requestId = 0;

    this.consumers = {};
    this.services  = [];

    this.ports    = {};
    this.handlers = {};

    this.receivedPorts = false;

    //default configuration
    this.configuration = Object.assign({

      //allow proxying of event callbacks
      eventCallback: (callback) => { return callback() },

      //security - allowSameOrigin on iFrames
      allowSameOrigin: false,

      //security - allow reconnections on iframe navigation?
      reconnect: 'verify'

    }, options);

    this.adapters = {
      iframe: new AdapterIFrame()

      //in a future version...
      //webworker: new WebworkerAdapter(),
      //inline: new InlineAdapter()
    };

    this.onCreate();
  }

  //noop for now, but can be extended
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

//todo - encapsulate to allow multiple instances on page (should pass this into connectSandbox)

window.pokey = global.pokey = new Pokey();

/* in sandboxes, we want to automatically start things up to continue handshake process */
function autoInitializeSandbox () {
  if (typeof window !== 'undefined') {
    //in the future, could handle inline workers here

    if (window.parent && window.parent !== window) {
      pokey.adapters.iframe.connectSandbox(pokey);
    }
  } else {
    //handle web workers
    pokey.adapters.webworker.connectSandbox(pokey);
  }
}

autoInitializeSandbox();