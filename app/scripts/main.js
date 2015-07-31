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
  capabilities: ['account'],
  height: "500"
});

sandbox.connect('account').then(function (port) {
  addLogStatement('connected on account');

  port.onRequest('profile', function () {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve({email: 'maxbates@gmail.com'});
      }, 1);
    });
  });

  document.querySelector('#email-input').addEventListener('keyup', function (event) {
    addLogStatement('sent');
    port.request('setProfile', event.target.value);
  });
});

document.getElementById('insertion').appendChild(sandbox.el);