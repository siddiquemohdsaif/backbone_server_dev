const WebSocket = require('ws');

// Unique user and clan identifiers
let uid = '1';
let cid = '456';


const START_GLOBAL_CHAT = "startGlobalChat";
const SEND_GLOBAL_CHAT_MESSAGE = "sendGlobalChatMessage";
const STOP_GLOBAL_CHAT = "stopGlobalChat";

const GLOBAL_CHAT_CREATED = "globalMessageCreate";
const GLOBAL_CHAT_MESSAGE_RECEIVE = "globalMessageBroadCast";



const SEND_CLAN_BRODCAST_MESSAGE = "sendClanBroadcastMessage";
const SEND_SINGLE_PLAYER_MESSAGE = "sendSinglePlayerMessage";
const RECEIVE_CLAN_BROADCAST_MESSAGE = "receiveClanBroadcastMessage";
const RECEIVE_SINGLE_PLAYER_MESSAGE = "receiveSinglePlayerMessage";

const ANOTHER_PLAYER_CONNECTED = "anotherPlayerConnected";

const ws = new WebSocket(`ws://localhost:8080/?uid=${uid}&cid=${cid}`);

ws.on('open', function open() {
    console.log('connected to the server');
});

ws.on('message', function incoming(data) {
    let messageData;
    try {
        messageData = JSON.parse(data);
        if (typeof messageData.type !== 'string') {
            return;
        }
    } catch (err) {
        console.error(`Failed to parse WebSocket message: ${data}. Error: ${err.message}`);
        return;
    }

    //callback switch
    switch(messageData.type) {
        case GLOBAL_CHAT_CREATED:
            // handle GLOBAL_CHAT_CREATED 
            //onGlobalChatCreated(messageData.status, messageData.historyChat);  //status: string, historyChat: array of string  
            break;
        case GLOBAL_CHAT_MESSAGE_RECEIVE:
            // handle GLOBAL_CHAT_MESSAGE_RECEIVE
            //onGlobalChatMessageReceived(messageData.message);  //message: string
            break;
        case RECEIVE_CLAN_BROADCAST_MESSAGE:
            // handle RECEIVE_CLAN_BROADCAST_MESSAGE
            //onClanChatMessageReceived(messageData.message);  //message: string
            break;
        case RECEIVE_SINGLE_PLAYER_MESSAGE:
            // handle RECEIVE_SINGLE_PLAYER_MESSAGE
            //onSinglePlayerMessageReceived(messageData.message);  //message: string
            break;
        case ANOTHER_PLAYER_CONNECTED:
            // handle ANOTHER_PLAYER_CONNECTED
            //onAnotherPlayerConnected();  //message: string
            break;
        default:
            console.error("Unknown message type: ", messageData.type);
    }

});

ws.on('close', function close() {
    console.log('disconnected from server');
});

ws.on('error', function error(err) {
    console.error('Error occurred:', err);
});



////////////////// util function ///////////////////////////////

const startGlobalChat = () => {
    //start global chat
    let msg = {
        type: START_GLOBAL_CHAT
    };
    ws.send(JSON.stringify(msg));
}

/**
 * @param {string} message - The message string
 * @return {void}  - The result
 */
const sendGlobalChatMessage = (message) => {
    //send global chat
    let msg = {
        type: SEND_GLOBAL_CHAT_MESSAGE,
        text : message
    };
    ws.send(JSON.stringify(msg));
}

const stopGlobalChat = () => {
    //stop global chat
    let msg = {
        type: STOP_GLOBAL_CHAT
    };
    ws.send(JSON.stringify(msg));
}


/**
 * @param {string} message - The message string
 * @param {Array} receiverUid - The array of string
 * @return {void}  - The result
 */
const sendClanChatMessage = (message,receiverUid) => {
    //send clan chat message to all clan members
    let msg = {
        type: SEND_CLAN_BRODCAST_MESSAGE,
        text : message,
        receiverUid
    };
    ws.send(JSON.stringify(msg));
}


/**
 * @param {string} message - The message string
 * @param {string} receiverUid - The string
 * @return {void}  - The result
 */
const sendSinglePlayerChatMessage = (message,receiverUid) => {
    //send clan chat message to all clan members
    let msg = {
        type: SEND_SINGLE_PLAYER_MESSAGE,
        text : message,
        receiverUid
    };
    ws.send(JSON.stringify(msg));
}

////////////////// util function ///////////////////////////////

