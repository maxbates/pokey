import {noop, mustImplement} from './utils';

class Port {
  constructor (pokey, port) {

  }

  request (eventName) {
    //todo
  }

  onRequest (eventName, callback, binding) {
    //todo
  }

}

//Interface-like --- throw error unless all are implemented
['on', 'all', 'off', 'send', 'start', 'close']
  .forEach((method) => {
    Port[method] = mustImplement('Port', method);
  });

export default Port;