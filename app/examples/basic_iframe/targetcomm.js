//respond to events
window.addEventListener('message', function (event) {

  //check origin for security
  if (event.origin !== 'http://davidwalsh.name') {
    return;
  }

  console.log('message received:  ' + event.data, event);

  //note event.source and event.origin
  event.source.postMessage('backwards message', event.origin);

}, false);