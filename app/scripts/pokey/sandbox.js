import {assert, Deferred} from './utils';
import Port from './port';

//map sandbox.type to adapter name
let typeToAdapterNameMap = {
  html: 'iframe',
  iframe: 'iframe'
  //worker : 'worker' //todo in the future
};

class Sandbox {
  constructor (pokey, opts) {

    let options = Object.assign({}, pokey.configuration, opts);

    //todo - allow reconnect: 'any'
    assert(['none', 'verify'].indexOf(options.reconnect) > -1, 'Reconnect must be either "none" or "verify".');

    let capabilities = options.capabilities;
    assert(capabilities, 'You must provide a list of capabilities you wish to expose/use on options.capabilities');

    //default to iframe adapter
    let adapterName = typeToAdapterNameMap[options.type] || 'iframe';
    this.adapter    = pokey.adapters[adapterName];

    //in case multiple instances
    this.pokey = pokey;

    //list of allowed capabilities
    this._capabilitiesToConnect = this._filterCapabilities(capabilities);
    //maps of port promises, keyed by capability
    this.envPortDefereds     = {};
    this.sandboxPortDefereds = {};

    this.connections = {};
    //let other things listen in
    this.wiretaps     = [];
    this.channels     = {};
    this.capabilities = {};
    this.options      = options;

    this.firstLoad = true;

    // use Deferred because will be resolved elsewhere (by the adapter)
    this.loadDeferred = new Deferred();

    this.promisePorts();

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
    this._capabilitiesToConnect.forEach((capability) => {
      this.envPortDefereds[capability]     = new Deferred();
      this.sandboxPortDefereds[capability] = new Deferred();
    });
  }

  //todo - clean up
  createChannels () {
    let sandbox  = this,
        services = this.options.services || {},
        channels = this.channels;

    // create port for each capability...
    this._capabilitiesToConnect.forEach((capability) => {

      let service = services[capability],
          channel,
          port;

      // If an existing port is provided, just pass it along to the new sandbox.

      // todo - this should probably be of class Port if possible
      if (service instanceof Port) {
        port                          = this.adapter.proxyPort(this, service);
        this.capabilities[capability] = service;
      }
      else {
        channel = channels[capability] = this.adapter.createChannel(sandbox.pokey);

        var environmentPort = this.adapter.environmentPort(this, channel),
            sandboxPort     = this.adapter.sandboxPort(this, channel);

        environmentPort.all(function (eventName, data) {
          this.wiretaps.forEach((wiretap) => {
            wiretap(capability, {
              type     : eventName,
              data     : data,
              direction: 'received'
            });
          });
        }, sandbox);

        this.wiretaps.forEach((wiretap) => {
          var originalSend = environmentPort.send;

          environmentPort.send = function (eventName, data) {
            wiretap(capability, {
              type     : eventName,
              data     : data,
              direction: 'sent'
            });

            originalSend.apply(environmentPort, arguments);
          };
        });

        if (service) {
          //container creating service for capability
          // Generic
          service                       = new service(environmentPort, this);
          service.initialize(environmentPort, capability);
          sandbox.pokey.services.push(service);
          this.capabilities[capability] = service;
        }

        // Law of Demeter violation...
        port = sandboxPort;

        this.envPortDefereds[capability].resolve(environmentPort);
      }

      //port created
      this.sandboxPortDefereds[capability].resolve(port);

    }, sandbox);
  }

  connectPorts () {
    let sandbox = this;

    Promise.all(sandbox._capabilitiesToConnect.map(
      (capability) => sandbox.sandboxPortDefereds[capability].promise
    ))
      .then((ports) => {
        //all ports created, transfer
        sandbox.adapter.connectPorts(sandbox, ports);
      });
  }

  destroyChannels () {
    Object.keys(this.channels).forEach((key, index) => {
      this.channels[key].destroy();
      delete this.channels[key];
    });
    this.channels = {};
  }

  waitForLoad () {
    return this.loadDeferred.promise;
  }

  wiretap (callback) {
    this.wiretaps.push(callback);
  }

  connect (capability) {
    let portPromise = this.envPortDefereds[capability].promise;

    assert(portPromise, "Connect was called on '" + capability + "' but no such capability was registered.");

    return portPromise;
  }

  start (options) {
    this.adapter.startSandbox(this, options);
  }

  terminate () {
    let sandbox = this;

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

  static onerror (error) {
    throw error;
  }

  //todo - should ensure unique
  _filterCapabilities (capabilities) {
    return this.adapter.filterCapabilities(capabilities);
  }

  _waitForLoadDeferred () {
    return this.loadDeferred.promise;
  }

}

export default Sandbox;