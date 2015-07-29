//this would be obtained from the node
let domain = 'http://mytestdomain.com';

//create iFrame
let iframeEl          = document.createElement("iframe");
iframeEl.setAttribute("src", domain);
iframeEl.style.width  = 640 + "px";
iframeEl.style.height = 480 + "px";
document.body.appendChild(iframeEl);

//need to access contentWindow, after added to DOM
var iframe = iframeEl.contentWindow;

//periodical message sender
setInterval(function () {
  let message = 'time is: ' + (new Date().getTime());

  console.log('sending message:  ' + message);

  //send the message and target URI (don't send anywhere)
  iframe.postMessage(message, domain);

}, 6000);