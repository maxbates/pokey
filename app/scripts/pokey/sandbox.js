import {assert} from './utils';

export class Sandbox {
  constructor (pokey, opts) {

    let options = Object.assign({}, pokey.configuration, opts);
    assert(['none', 'verify'].indexOf(options.reconnect) > -1, 'Reconnect must be either "none" or "verify".');

    //todo - verify this bit
    let capabilities = options.capabilities;
    assert(capabilities, 'You must provide a list of services you wish to expose/use on options.capabilities');

    this.adapter = options.adapter || pokey.adapters.iframe;

    this.pokey = pokey;


    this.connections = {};
    //let other things listen in
    this.wiretaps     = [];
    this.channels     = {};
    this.capabilities = {};
    this.options      = options;

    //todo
    this._waitForLoadPromise = new Promise();

    this.firstLoad = true;

    this.adapter.initializeSandbox(this);
  }

  createAndTransferCapabilities () {
    if (!this.firstLoad) {
      this.promisePorts();
    }

    this.createChannels();
    this.connectPorts();

    // subsequent calls to `createAndTransferCapabilities` requires new port promises
    this.firstLoad = false;
  }

  promisePorts () {

  }

  createChannels() {

  }

  connectPorts () {

  }

  destroyChannels () {

  }

  waitForLoad () {

  }

  wiretap () {

  }

  connect () {

  }

  start () {

  }

  terminate () {

  }

  onerror (error) {
    throw error;
  }


}