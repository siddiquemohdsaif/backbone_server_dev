const WebSocket = require('ws');
const WebSocketHandler = require('./WebSocketHandler');

// Initializing WebSocket server
const wss = new WebSocket.Server({ port: 13998+100 });

// Initializing WebSocket handler
const webSocketHandler = new WebSocketHandler(wss);

// Starting WebSocket server
webSocketHandler.start();
