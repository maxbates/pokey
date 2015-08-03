import {UUID} from './utils';
import AdapterBase from './adapter_base';

// note that workers must be from the same origin. To use a cross-origin worker, you need to load it into an iFrame, or create an intermediate worker and load the remote worker as a Blob (won't work in all browsers)

class AdapterWorker extends AdapterBase {
  constructor () {
    super();
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
  initializeSandbox (sandbox) {
    let worker     = new Worker(sandbox.options.url);
    worker.name    = sandbox.options.url + '?uuid=' + UUID();
    sandbox.worker = worker;

    // Error handling inside the worker
    worker.errorHandler = (event) => {
      if (!event.data.sandboxException) {
        return;
      }

      sandbox.onerror(event.data.sandboxException);
    };
    worker.addEventListener('message', worker.errorHandler);

    sandbox.loadDeferred.resolve(new Promise((resolve, reject) => {
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
  startSandbox () {}

  terminateSandbox (sandbox) {
    let worker = sandbox.worker;

    sandbox.terminated = true;

    worker.removeEventListener('message', worker.loadHandler);
    worker.removeEventListener('message', worker.initializationHandler);

    sandbox.worker.terminate();
  }

  connectPorts (sandbox, ports) {
    let rawPorts = ports.map((port) => port.port),
        message  = this.createInitializationMessage(sandbox);

    if (sandbox.terminated) {
      return;
    }

    sandbox.worker.postMessage(message, rawPorts);
  }

  /*
  Sandbox API
  These methods are called from the sandbox, not the hosting environment
   */

  connectSandbox (pokey) {
    //'self' for Worker context
    return AdapterBase.prototype.connectSandbox.call(this, self, pokey);
  }

  pokeyLoaded () {
    postMessage(this.pokeyLoadedMessage, []);
  }

  didConnect () {
    postMessage(this.sandboxInitializedMessage, []);
  }

}

export default AdapterWorker;