Pokey.js

Create (mostly secure?) sandboxes, initially using iFrames, later also with workers, and establish clear message channels to hide complexity of postMessage() interface.

### Getting started

You will need Chrome v45 (latest stable)

From the terminal:

````
npm install -g gulp browserify babel
npm install && bower install
gulp serve:external
gulp serve
````

A page should open with an example.

Look at app/main.js and app/external.js and app/index.html and app/external.html respectively

### todo

- make events + payloads more consistent. document.

- worker adapter

- doc services, example

- wiretap example

### MORE EXAMPLES FORTHCOMING

inspired by oasis.js, with some changes + moved to ES6 