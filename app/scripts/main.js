'use strict';

let log = document.querySelector('#log');

function addLogStatement (statement) {
  let p = document.createElement('p');
  let d = new Date();
  p.textContent = '' + statement + ' @ ' + [d.getMinutes(), d.getSeconds(), d.getMilliseconds()].join('.');
  log.appendChild(p);
}

addLogStatement('initialized');

/**********
 SANDBOXING
 **********/

var sandbox = pokey.createSandbox({
  url         : 'http://127.0.0.1:3000/external.html',
  type        : 'iframe',
  capabilities: ['interaction', 'colorChannel'],
  height: "500"
});

sandbox.connect('colorChannel').then(function (port) {
  addLogStatement('connected on colorChannel');

  port.send('color', '#' + (Math.random()*(1<<24)|0).toString(16).slice(-6));
});

sandbox.connect('interaction').then(function (port) {
  addLogStatement('connected on interaction');

  port.onRequest('email', function () {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve({email: 'maxbates@gmail.com'});
      }, 2000);
    });
  });

  document.querySelector('#email-input').addEventListener('keyup', function (event) {
    addLogStatement('sending');
    port.send('setEmail', event.target.value);
  });
});

//inserting in the DOM actually gets the iFrame going + loads external Pokey client to being handshake
document.getElementById('insertion').appendChild(sandbox.el);