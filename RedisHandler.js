const Redis = require('ioredis');
const WebSocketHandler = require('./WebSocketHandler');

class RedisHandler {
    /**
     * constructor
     * @param {WebSocketHandler} webSocketHandler - webSocketHandler param for initialization
    */
    constructor(webSocketHandler) {
        this.webSocketHandler = webSocketHandler;
        this.redis = new Redis();
        this.subscriber = new Redis();
        this.instanceId = this.generateRandomString(16);
        this.FRIENDS_BROADCAST_CHANNEL = 'friendsMessage';
        this.CLAN_MESSAGE_BROADCAST_CHANNEL = 'clanMessage';
        this.NOTIFICATION_MESSAGE_BROADCAST_CHANNEL = 'notificationMessage';
        this.ANOTHER_PLAYER_CONNECT = 'anotherPlayerConnected';
        this.ALL_PLAYERS = 'allPlayers';
        this.subscriber.subscribe(this.instanceId, this.CLAN_MESSAGE_BROADCAST_CHANNEL, this.NOTIFICATION_MESSAGE_BROADCAST_CHANNEL, this.ANOTHER_PLAYER_CONNECT, this.ALL_PLAYERS,this.FRIENDS_BROADCAST_CHANNEL);

        this.subscriber.on('message', (channel, message) => {
            this.handleMessage(channel, message);
        });
    }

    async handleMessage (channel, message) {
        // console.log(1.1,channel,message);
        if (channel === this.FRIENDS_BROADCAST_CHANNEL) {  

            // console.log(2);
            const { uids, text } = JSON.parse(message);
            uids.forEach(uid => {
                if (this.webSocketHandler.sockets[uid]) {
                    // console.log(3);
                    this.webSocketHandler.sockets[uid].send(JSON.stringify({ type: "receiveFriendsBroadcastMessage", message: text }));
                }
            });

        } else if (channel === this.CLAN_MESSAGE_BROADCAST_CHANNEL) {  //for clan message

            const { uids, text } = JSON.parse(message);
            //console.log("redis :" + this.instanceId + " message:" + text + " toUid:" + uids + " time:" + Date.now() + " channel:" + channel);

            // For each user ID, if they are connected to this instance, send them the message
            uids.forEach(uid => {
                if (this.webSocketHandler.sockets[uid]) {
                    this.webSocketHandler.sockets[uid].send(JSON.stringify({ type: "receiveClanBroadcastMessage", message: text }));
                }
            });

        } else if (channel === this.NOTIFICATION_MESSAGE_BROADCAST_CHANNEL) {  //for notification message

            const { uids, text } = JSON.parse(message);
            //console.log("redis :" + this.instanceId + " message:" + text + " toUid:" + uids + " time:" + Date.now() + " channel:" + channel);

            // For each user ID, if they are connected to this instance, send them the message
            uids.forEach(uid => {
                if (this.webSocketHandler.sockets[uid]) {
                    this.webSocketHandler.sockets[uid].send(JSON.stringify({ type: "receiveNotificationMessage", message: text }));
                }
            });


        }else if(channel === this.ANOTHER_PLAYER_CONNECT){
            const {uid, filter} = JSON.parse(message);
            if(this.instanceId == filter){
                return;
            }
            this.webSocketHandler.handleAnotherPlayerConnect(uid);


        }else if(channel === this.ALL_PLAYERS){
            const { type, text } = JSON.parse(message);
            const sendMsg = JSON.stringify({ type , message: text });

            // Send to all players with a delay of 1 ms between each message
            const uids = Object.keys(this.webSocketHandler.sockets);
            for (let uid of uids) {
                await this.sleep(10);
                if (this.webSocketHandler.sockets[uid]) {
                    this.webSocketHandler.sockets[uid].send(sendMsg);
                }
            }

        }else { //for single/multi player message

            const { uids, text } = JSON.parse(message);

            for (let uid of uids) {
                //console.log("redis: " + this.instanceId + " message: " + text + " toUid: " + uid + " time: " + Date.now() + " channel: " + channel);
                if (this.webSocketHandler.sockets[uid]) {
                    this.webSocketHandler.sockets[uid].send(JSON.stringify({ type: "receiveSinglePlayerMessage", message: text }));
                }
            }

        }
    }

    sleep(ms) {
        return new Promise((resolve) => {
          setTimeout(resolve, ms);
        });
    }

    async disconnectPlayer(uid) {
        if (this.webSocketHandler.sockets[uid]) {
            //console.log(`Player ${uid} disconnected by force.`);

            // Remove socket from sockets object
            this.webSocketHandler.messageHandler.handleStopGlobalChat(this.webSocketHandler.sockets[uid]);
            this.webSocketHandler.messageHandler.handleRemoveFriendlyBattleChallenge(this.webSocketHandler.sockets[uid]);
            delete this.webSocketHandler.sockets[uid];
        }
    }

    generateRandomString(length) {
        let result = '';
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        const charactersLength = characters.length;
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    }

    get(key) {
        return this.redis.get(key);
    }

    mget(...keys) {
        return this.redis.mget(keys);
    }

    set(key, value) {
        return this.redis.set(key, value);
    }

    delete(key) {
        return this.redis.del(key);
    }

    publish(channel, message) {
        return this.redis.publish(channel, message);
    }
}

module.exports = RedisHandler;
