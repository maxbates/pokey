import {mustImplement} from './utils';
import Port from './port';

class Channel {
  constructor (pokey) {
    this.channel = new MessageChannel();

    this.port1 = new Port(pokey, this.channel.port1);
    this.port2 = new Port(pokey, this.channel.port2);
  }

  start () {
    this.port1.start();
    this.port2.start();
  }

  destroy () {
    this.port1.close();
    this.port2.close();
    delete this.port1;
    delete this.port2;
    delete this.channel;
  }

}

Channel.start = mustImplement('Channel', 'start');