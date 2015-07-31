import Channel from './channel';
import {mustImplement} from './utils';

const pokeyLoadedMessage        = "pokeySandboxLoaded";
const sandboxInitializedMessage = "pokeySandboxInitialized";

class AdapterBase {
  constructor () {
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

  //todo - signature update
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
}

Object.assign(AdapterBase.prototype, {
  initializeSandbox        : mustImplement('AdapterBase', 'initializeSandbox'),
  pokeyLoadedMessage       : pokeyLoadedMessage,
  sandboxInitializedMessage: sandboxInitializedMessage
});

//note - cannot assign readonly field 'name'

export default AdapterBase;