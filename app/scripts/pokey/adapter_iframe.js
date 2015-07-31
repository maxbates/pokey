import {UUID} from './utils';
import AdapterBase from './adapter_base';

class AdapterIFrame extends AdapterBase {
  constructor () {
    super();
  }

  static name (sandbox) {
    return sandbox.el.name;
  }

  /*
  Environment
  Methods called by the hosting environment
   */

  /**
   * For the iFrame, we:
   * (1) create the iFrame, and register it on sandbox.el
   * (2) set up listeners for handshake (see handshake doc)
   * @param sandbox
   */
  initializeSandbox (sandbox) {
    let options           = sandbox.options,
        iframe            = document.createElement('iframe'),
        sandboxAttributes = ['allow-scripts']; //todo - can allow more...

    iframe.name     = sandbox.options.url + '?uuid=' + UUID();
    iframe.sandbox  = sandboxAttributes.join(' ');
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
    iframe.src          = sandbox.options.url;

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

  //generally, you want to attach the iFrame yourself, because when moved in the DOM, the iFrame is reloaded
  static startSandbox (sandbox, options) {
    var head = document.head || document.documentElement.getElementsByTagName('head')[0];
    head.appendChild(sandbox.el);
  }

  static terminateSandbox (sandbox) {
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

  connectPorts (sandbox, ports) {
    var rawPorts = ports.map((port) => port.port),
        message  = this.createInitializationMessage(sandbox);

    if (sandbox.terminated) {
      return;
    }
    sandbox.el.contentWindow.postMessage(message, '*', rawPorts);
  }

  /*
  Sandbox API
  These methods are called from the sandbox, not the hosting environment
   */

  connectSandbox (pokey) {
    return AdapterBase.prototype.connectSandbox.call(this, window, pokey);
  }

  pokeyLoaded () {
    window.parent.postMessage(this.pokeyLoadedMessage, '*', []);
  }

  didConnect () {
    window.parent.postMessage(this.sandboxInitializedMessage, '*', []);
  }
}

function verifySandbox (pokey, sandboxUrl) {
  let iframe = document.createElement('iframe');

  if ((pokey.configuration.allowSameOrigin && iframe.sandbox !== undefined) ||
    (iframe.sandbox === undefined)) {
    // The sandbox attribute isn't supported (IE8/9) or we want a child iframe
    // to access resources from its own domain (youtube iframe),
    // we need to make sure the sandbox is loaded from a separate domain
    let link  = document.createElement('a');
    link.href = sandboxUrl;

    if (!link.host || (link.protocol === window.location.protocol && link.host === window.location.host)) {
      throw new Error("Security: iFrames from the same host cannot be sandboxed in older browsers and is disallowed. For HTML5 browsers supporting the `sandbox` attribute on iframes, you can add the `allow-same-origin` flag only if you host the sandbox on a separate domain.");
    }
  }

  //iframe will be garbage collected
}

function verifyCurrentSandboxOrigin (sandbox, event) {
  if (sandbox.firstLoad || sandbox.options.reconnect === "any") {
    return true;
  }

  if (!sandbox.pokey.configuration.allowSameOrigin || event.origin === "null") {
    fail();
  } else {
    let linkOriginal = document.createElement('a'),
        linkCurrent  = document.createElement('a');

    linkOriginal.href = sandbox.options.url;
    linkCurrent.href  = event.origin;

    if (linkCurrent.protocol === linkOriginal.protocol &&
      linkCurrent.host === linkOriginal.host) {
      return true;
    }

    fail();
  }

  function fail () {
    sandbox.onerror(
      new Error("Error reconnecting..."));
  }
}

export default AdapterIFrame;