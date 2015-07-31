(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var log = document.querySelector('#log');

function addLogStatement(statement) {
  var p = document.createElement('p');
  var d = new Date();
  p.textContent = '' + statement + ' @ ' + [d.getMinutes(), d.getSeconds(), d.getMilliseconds()].join('.');
  log.appendChild(p);
}

addLogStatement('initialized');

/**********
 SANDBOXING
 **********/

var sandbox = pokey.createSandbox({
  url: 'http://127.0.0.1:3000/external.html',
  type: 'iframe',
  capabilities: ['account'],
  height: "500"
});

sandbox.connect('account').then(function (port) {
  addLogStatement('connected on account');

  port.onRequest('profile', function () {
    return new Promise(function (resolve, reject) {
      setTimeout(function () {
        resolve({ email: 'maxbates@gmail.com' });
      }, 1);
    });
  });

  document.querySelector('#email-input').addEventListener('keyup', function (event) {
    addLogStatement('sent');
    port.request('setProfile', event.target.value);
  });
});

document.getElementById('insertion').appendChild(sandbox.el);

},{}]},{},[1])


//# sourceMappingURL=../../app/scripts/bundle.js.map