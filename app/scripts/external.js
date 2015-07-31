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

pokey.connect('account').then(function (port) {

  addLogStatement('connected');

  port.request('profile').then(function (profile) {
    addLogStatement('got profile');
    document.querySelector("#email").textContent = profile.email;
  });

  port.onRequest('setProfile', function (info) {
    addLogStatement('received');
    document.querySelector("#email").textContent = info;
  });
});