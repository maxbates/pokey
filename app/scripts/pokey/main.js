import Service from './service';
import Sandbox from './sandbox';
import Events from './events';
import { connect, portFor } from './connect';

import AdapterIFrame from './adapter_iframe';

class Pokey {
  constructor () {
    this.pokeyId   = 'pokey' + (+new Date());
    this.requestId = 0;

    this.consumers = {};
    this.services  = [];

    this.ports    = {};
    this.handlers = {};

    this.receivedPorts = false;

    this.configuration = {
      eventCallback  : (callback) => { return callback() },
      allowSameOrigin: false,
      reconnect      : 'verify' //todo - allow setting to 'none, 'any'
    };

    this.events = new Events();

    this.onCreate();
  }

  //noop for now
  onCreate () {}

  /**
   * entry point for containing environment to create child sandbox
   * @param options with fields
   * services
   * url - url for JS file that will initialize sandbox in sandboxed environment
   * //todo - multiple types - iframe, workers
   */
  createSandbox (options) {
    return new Sandbox(this, options);
  }

}

Object.assign(Pokey, {

  connect: connect,

  portFor : portFor,

  adapters : {
    iframe: new AdapterIFrame()

    //in a future version...
    //webworker: new WebworkerAdapter(),
    //inline: new InlineAdapter()
  }
});

export default Pokey;