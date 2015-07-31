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
  capabilities: ['basicChannel'],
  height: "500"
});

sandbox.connect('basicChannel').then(function (port) {
  addLogStatement('connected on account');

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

document.getElementById('insertion').appendChild(sandbox.el);