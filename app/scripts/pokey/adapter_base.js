import Channel from './channel';
import {mustImplement} from './utils';

const pokeyLoadedMessage        = "pokeySandboxLoaded";
const sandboxInitializedMessage = "pokeySandboxInitialized";

class AdapterBase {
  constructor () {
    //add unsupported capabilities e.g. to prevent capabilities from being registered
    this._unsupportedCapabilities = [];
  }

  unsupportedCapabilities () {
    return this._unsupportedCapabilities;
  }

  addUnsupportedCapability (capability) {
    this._unsupportedCapabilities.push(capability);
  }

  filterCapabilities (capabilities) {
    var unsupported = this._unsupportedCapabilities;
    return capabilities.filter(function (capability) {
      return unsupported.indexOf(capability) === -1;
    });
  }

  //inherited, not static
  createChannel (pokey) {
    let channel = new Channel(pokey);
    channel.port1.start();
    return channel;
  }

  //inherited, not static
  environmentPort (sandbox, channel) {
    return channel.port1;
  }

  //inherited, not static
  sandboxPort (sandbox, channel) {
    return channel.port2;
  }

  //inherited, not static
  proxyPort (sandbox, port) {
    return port;
  }

  //inherited, not static
  createInitializationMessage (sandbox) {
    return {
      isPokeyInitialization: true,
      capabilities         : sandbox._capabilitiesToConnect
    };
  }

  /*
  Sandbox API
  These methods are called from the sandbox, not the hosting environment
   */

  //subclasses may just delegate to this, in their own context
  connectSandbox (receiver, pokey) {
    let adapter = this;

    //todo - consistency in event data
    function initializePokeySandbox (event) {
      if (!event.data.isPokeyInitialization) {
        return;
      }

      receiver.removeEventListener('message', initializePokeySandbox);
      adapter.initializePokeySandbox(event, pokey);
    }

    receiver.addEventListener('message', initializePokeySandbox);

    adapter.pokeyLoaded(pokey);
  }

  initializePokeySandbox (event, pokey) {
    let adapter = this;
    pokey.configuration.eventCallback(function () {
      pokey.connectCapabilities(event.data.capabilities, event.ports);
      adapter.didConnect(pokey);
    });
  }

  // subclasses should implement
  // called when pokey has loaded (completed initial setup), send message to start handshake (trigger pokeyLoadHandler)
  pokeyLoaded () {}

  // subclasses should implement
  // called after capabilities connected, send message back to complete handshake (trigger initializationHandler)
  didConnect () {}
}

Object.assign(AdapterBase.prototype, {
  initializeSandbox        : mustImplement('AdapterBase', 'initializeSandbox'),
  pokeyLoadedMessage,
  sandboxInitializedMessage
});

//note - cannot assign readonly field 'name'

export default AdapterBase;