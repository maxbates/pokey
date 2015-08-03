importScripts('scripts/pokey.js');

pokey.connect('colorChannel').then((port) => {
  port.on('workerColor', (color) => {
    console.log('%cworker got dat color', 'color:' + color);
  });
});