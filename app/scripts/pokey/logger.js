//todo - use this?

class Logger {
  constructor () {
    this.enabled = false;
  }

  enable () {
    this.enabled = true;
  }

  disable () {
    this.enabled = false;
  }

  log () {
    var logger = this;
    if (logger.enabled) {
      console.log.apply(console, arguments);
    }
  }
}
var logger = new Logger();

export default logger;