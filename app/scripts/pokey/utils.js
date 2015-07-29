export function noop () { }

export function assert (string, assertion) {
  if (!assertion) {
    throw new Error(string);
  }
}

export function isInWorker () {
  return typeof Worker === 'undefined' && typeof Window === 'undefined';
}

export function mustImplement (className, name) {
  return function () {
    throw new Error("Subclass of " + className + " must implement " + name);
  };
}

//RFC1422 v4 compliant UUID, using time for more uniqueness
export function UUID () {
  function generateUUID () {
    var d = new Date().getTime();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = (d + Math.random() * 16) % 16 | 0;
      d     = Math.floor(d / 16);
      return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  }
}

export function isUrl (s) {
  var regexp = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
  return regexp.test(s);
}