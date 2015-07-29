import Channel from './channel';
import {mustImplement} from './utils';

class AdapterBase {
  constructor() {}

  createChannel (pokey) {
    let channel = new Channel(pokey);
    channel.port1.start();
    return channel;
  }

  //todo - signature update
  connectSandbox (receiver, pokey) {
    let adapter = this;


  }

  static environmentPort (sandbox, channel) {
    return channel.port1;
  }

  static sandboxPort (sandbox, channel) {
    return channel.port2;
  }

  static proxyPort (sandbox, port) {
    return port;
  }

}

Object.assign(AdapterBase, {
  initializeSandbox: mustImplement('AdapterBase', 'initializeSandbox')
});

//note - cannot assign readonly field name

export default AdapterBase;