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

pokey.connect('colorChannel').then((port) => {
  addLogStatement('connected on colorChannel');

  port.on('color', (color) => {
    document.body.style.backgroundColor = color;
  })
});

pokey.connect('interaction').then((port) => {

  addLogStatement('connected on interaction');

  port.request('email').then((profile) => {
    addLogStatement('got email');
    document.querySelector("#email").textContent = profile.email;
  });

  port.on('setEmail', (info) => {
    addLogStatement('received');
    document.querySelector("#email").textContent = info;
  });
});