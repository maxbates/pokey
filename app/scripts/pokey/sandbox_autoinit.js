/* in sandboxes, we want to automatically start things up to continue handshake process */

export default function autoInitializeSandbox () {
  if (typeof window !== 'undefined') {
    //in the future, could handle inline workers here

    if (window.parent && window.parent !== window) {
      Pokey.adapters.iframe.connectSandbox(this);
    }
  } else {
    //handle web workers
    Pokey.adapters.webworker.connectSandbox(this);
  }
}