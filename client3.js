const WebSocket = require('ws');

// Unique user and clan identifiers
let uid = '1';
let cid = '456';

const ws = new WebSocket(`ws://localhost:8080/?uid=${uid}`);

ws.on('open', function open() {
  console.log('connected to the server');

  // Message sending example
  // let msg = {
  //   receiverUid: '789', // another user's uid
  //   text: 'Hello, world!'
  // };

  //ws.send(JSON.stringify(msg));


  //start global chat
  let msg = {
    type: 'startGlobalChat',
  };
  ws.send(JSON.stringify(msg));

});

ws.on('message', function incoming(data) {
  console.log(`Received: ${data} time: ${Date.now()}`);
});

ws.on('close', function close() {
  console.log('disconnected from server');
});

ws.on('error', function error(err) {
  console.error('Error occurred:', err);
});
