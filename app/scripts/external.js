'use strict';

let log = document.querySelector('#log');

function addLogStatement (statement) {
  let p         = document.createElement('p');
  let d         = new Date();
  p.textContent = '' + statement + ' @ ' + [d.getMinutes(), d.getSeconds(), d.getMilliseconds()].join('.');
  log.appendChild(p);
}

addLogStatement('initialized');


/**********
 SANDBOXING
 **********/

pokey.connect('basicChannel').then(function (port) {

  addLogStatement('connected');

  port.request('email').then(function (profile) {
    addLogStatement('got email');
    document.querySelector("#email").textContent = profile.email;
  });

  port.on('setEmail', function (info) {
    addLogStatement('received');
    document.querySelector("#email").textContent = info;
  });
});