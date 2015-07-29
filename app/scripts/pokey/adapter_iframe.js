import AdapterBase from './adapter_base';

class AdapterIFrame extends AdapterBase {
  constructor () {
    super();
  }

  static name (sandbox) {
    return sandbox.el.name;
  }

  initializeSandbox (sandbox) {
    //todo

    let options           = sandbox.options,
        iframe            = document.createElement('iframe'),
        sandboxAttributes = ['allow-scripts']; //can allow more...

    iframe.name    = sandbox.options.url + '?uuid=' + UUID.generate();
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
    iframe.src          = sandbox.options.url;

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

  terminateSandbox () {

  }

  connectPorts () {

  }

  connectSandbox (pokey) {
    //todo - make static method
    AdapterBase.prototype.connectSandbox.call(this, window, pokey);
  }
}

function verifySandbox (pokey, sandboxUrl) {
  var iframe = document.createElement('iframe'),
      link;

  if ((pokey.configuration.allowSameOrigin && iframe.sandbox !== undefined) ||
    (iframe.sandbox === undefined)) {
    // The sandbox attribute isn't supported (IE8/9) or we want a child iframe
    // to access resources from its own domain (youtube iframe),
    // we need to make sure the sandbox is loaded from a separate domain
    link      = document.createElement('a');
    link.href = sandboxUrl;

    if (!link.host || (link.protocol === window.location.protocol && link.host === window.location.host)) {
      throw new Error("Security: iFrames from the same host cannot be sandboxed in older browsers and is disallowed. For HTML5 browsers supporting the `sandbox` attribute on iframes, you can add the `allow-same-origin` flag only if you host the sandbox on a separate domain.");
    }
  }


}

function verifyCurrentSandboxOrigin (sandbox, event) {
  var linkOriginal, linkCurrent;

  if (sandbox.firstLoad || sandbox.options.reconnect === "any") {
    return true;
  }

  if (!sandbox.pokey.configuration.allowSameOrigin || event.origin === "null") {
    fail();
  } else {
    linkOriginal = document.createElement('a');
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