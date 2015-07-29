function Logger () {
  this.enabled = false;
}

Logger.prototype = {
  enable: () => {
    this.enabled = true;
  },

  disable: () => {
    this.enabled = false;
  },

  log: function () {
    var logger = this;
    if (logger.enabled) {
      console.log.apply(console, arguments);
    }
  }
};

var logger = new Logger();

export default logger;