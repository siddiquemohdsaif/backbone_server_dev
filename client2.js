const WebSocket = require('ws');

// Unique user and clan identifiers
let uid = '2';
let cid = '456';

const ws = new WebSocket(`ws://localhost:8080/?uid=${uid}&cid=${cid}`);

ws.on('open', function open() {
  console.log('connected to the server');
  
  // // Message sending example
  // let msg = {
  //   type : "Brodcast",
  //   receiverUid: ['1','3'], // another user's uid
  //   text: 'Hello, worldcccccccccc!'
  // };
  // console.log("sent time:" + Date.now());
  // ws.send(JSON.stringify(msg));


  
    //start global chat
    let msg = {
      type:'startGlobalChat',
    };
    ws.send(JSON.stringify(msg));

});

ws.on('message', function incoming(data) {
  console.log(`Received: ${data}`);


  setTimeout(function() {
    
    let msg = {
      type:'sendGlobalChatMessage',
      text : 'hello, the time is :' + Date.now()
    };
    ws.send(JSON.stringify(msg));

  }, 2000); // 2000 milliseconds = 2 seconds

});

ws.on('close', function close() {
  console.log('disconnected from server');
});

ws.on('error', function error(err) {
  console.error('Error occurred:', err);
});
