const RedisHandler = require('./RedisHandler');
const WebSocket = require('ws');
const InternalServerServicesHandler = require('./routes/InternalServerServicesCall');
const MessageHandler = require('./routes/messageHandler');
const FirestoreHandler = require('./Util/FirestoreHandler');
const CloudFunction = require('./Util/CloudFunction.js');
const AppConfigListener = require('./Util/AppConfigListener.js');
const GameAnalytics = require('./Util/GameAnalytics');
let userAppUsageDuration = {};


class WebSocketHandler {

    /**
     * constructor
     * @param {WebSocket.Server} wss - websocket server
    */
    constructor(wss) {
        this.wss = wss;
        this.sockets = {};
        this.redisHandler = new RedisHandler(this);
        this.internalServerServicesHandler = new InternalServerServicesHandler(this.redisHandler);
        this.messageHandler = new MessageHandler(this.redisHandler);
        AppConfigListener.startAppConfigChangeListener(this.sockets);
        this.scheduleDailyAnalyticsUpdate()
    }

    start() {
        this.wss.on('connection', (ws, req) => {
            this.handleConnection(ws, req);
        });
    }

    getQueryParams(req) {
        let query = req.url.split('?')[1];
        let params = query.split('&');
        let paramMap = {};

        params.forEach(param => {
            let [key, value] = param.split('=');
            paramMap[decodeURIComponent(key)] = decodeURIComponent(value);
        });

        return paramMap;
    }

    async startAnalyticsUpdateTimer () {
        // Set an interval to call updateGameAnalytics every 10 minutes (600,000 milliseconds)
        setInterval(async () => {
            console.log("Running updateGameAnalytics...");
            await this.updateGameAnalytics();
        }, 5 * 60 * 1000); // 5minutes in milliseconds
    }

    async scheduleDailyAnalyticsUpdate  ()  {
        // Get the current UTC time
        const now = new Date();
    
        // Convert UTC time to IST by adding 5 hours 30 minutes
        const nowIST = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
    
        // Set the next execution time to 12:00 AM IST (midnight)
        const midnightIST = new Date(nowIST);
        midnightIST.setHours(24, 0, 0, 0); // Set time to 12:00 AM IST
    
        // Calculate the delay until midnight in IST
        const timeUntilMidnightIST = midnightIST - nowIST;
    
        console.log(`Scheduled first update in ${timeUntilMidnightIST / 1000 / 60} minutes (IST)`);
    
        // Wait until midnight, then start the interval
        setTimeout(() => {
            // Run updateGameAnalytics for the first time
            this.updateGameAnalytics();
    
            // Schedule it to run every 24 hours (once per day)
            setInterval(async () => {
                console.log("Running updateGameAnalytics at midnight (IST)...");
                await this.updateGameAnalytics();
            }, 24 * 60 * 60 * 1000); // 24 hours in milliseconds
        }, timeUntilMidnightIST);
    }

    

    async handleConnection(ws, req) {
        let queryParams = this.getQueryParams(req);
        let uid = queryParams['uid'];

        // check if it's an internal server call
        if (uid && uid === "InternalServerServicesCall") {
            this.internalServerServicesHandler.handle(ws, queryParams);
            return;
        }

        // Verify uid
        if (!uid) {
            //console.log('UID not provided');
            ws.close();
            return;
        }

        //get user data from db
        let cid, userName, leagueIcon, isPremiumMember;
        try {
            let data = await FirestoreHandler.getUserInfo(uid);
            cid = data.cid;
            userName = data.userName;
            leagueIcon = data.leagueIcon;
            isPremiumMember = data.isPremiumMember;
        } catch (e) {
            console.error('UID not provided'+ e);
            ws.close();
            return;
        }


        // Check if a player with the same uid is already connected , bug1 => it work only if its connected to same instance.
        if (this.sockets[uid]) {
            // Notify the already connected player
            this.sockets[uid].send(JSON.stringify({ type: "anotherPlayerConnected", message: "Another player connected with the same ID" }));
            //console.log(`Player ${uid} disconnected because another player connected with the same ID.`);

            const currentWs = this.sockets[uid];
            // Manually run cleanup for the old WebSocket
            await this.disconnectPlayer(uid);
            currentWs.close();

        }else{
            // call other instances to handle another player connect
            const instanceId = this.redisHandler.instanceId;
            const message = JSON.stringify({uid, filter : instanceId});
            await this.redisHandler.publish(this.redisHandler.ANOTHER_PLAYER_CONNECT, message);
        }



        // Add socket to sockets object
        this.sockets[uid] = ws;

        // Store player info
        const currentTime = Date.now();
        const playerInfo = {
            timestamp: currentTime,
            uid: uid,
            cid: cid,
            instanceId: this.redisHandler.instanceId,
        };

        // Stringify the playerInfo object to store it in Redis
        this.redisHandler.set(`player:${uid}`, JSON.stringify(playerInfo));
        // console.log(`Player ${uid} connected.`);

        //sent time sync
        const timeSync = { type: "timeSync", currentTime: Date.now() };
        ws.send(JSON.stringify(timeSync));


        //update this clan member as currently active
        // if(cid != "null"){
            CloudFunction.playerConnected(uid, cid, this.redisHandler);
            // Track user app usage
        if (!userAppUsageDuration[uid]) {
            userAppUsageDuration[uid] = {
                openTime: 1,
                appOpenTime: Date.now(),
                duration: 0
            };
        } else {
            userAppUsageDuration[uid].openTime += 1;
            userAppUsageDuration[uid].appOpenTime = Date.now(); // Reset open time
            userAppUsageDuration[uid].appCloseTime = -Date.now();
        }
        // console.log("userAppUsageDuration",userAppUsageDuration)
        // }


        ws.on('message', (data) => {
            try {
                this.messageHandler.handleMessage(ws, data, uid, cid, userName, leagueIcon, isPremiumMember);
            } catch (error) {
                console.error("Error during handleMessage:", error.message);
                ws.close();
            }
        });

        ws.on('close', async () => {
            // Check if this is the current WebSocket for the uid
            if (ws === this.sockets[uid]) {

                // Remove player from Redis
                await this.redisHandler.delete(`player:${uid}`);

                //update this clan member as currently not-active
                // if(cid != "null"){
                    CloudFunction.playerDisconnected(uid, cid, this.redisHandler);
                    const appCloseTime = Date.now();
                    let sessionDuration = (appCloseTime - userAppUsageDuration[uid].appOpenTime) / 60000; // Convert to minutes
                    
                    // Accumulate session duration
                    userAppUsageDuration[uid].duration += sessionDuration;
                    userAppUsageDuration[uid].appCloseTime = appCloseTime;
                    // console.log("userAppUsageDuration",userAppUsageDuration)
                // }

                this.disconnectPlayer(uid);

            }
        });
    }

    async updateGameAnalytics() {
        const userAppUsageDurationAvg = {
            DailyAvgUser: 0,
            AvgUsageTime: 0
        };
    
        // Check if userAppUsageDuration is empty
        if (Object.keys(userAppUsageDuration).length === 0) {
            console.log("No user app usage data to update.");
            return; // Exit function early
        }
    
        let totalUsers = Object.keys(userAppUsageDuration).length;
        let totalUsageTime = Object.values(userAppUsageDuration).reduce((sum, user) => sum + user.duration, 0);
    
        userAppUsageDurationAvg.DailyAvgUser = totalUsers;
        userAppUsageDurationAvg.AvgUsageTime = totalUsers > 0 ? (totalUsageTime / totalUsers) : 0;
    
        // Send data only if there's meaningful data
        await GameAnalytics.addUserAppUsage(userAppUsageDurationAvg);
        await GameAnalytics.overAllUserUpdate();
    
        // Reset the user data
        userAppUsageDuration = {};
    }
    

    async disconnectPlayer(uid) {
        if (this.sockets[uid]) {
            //console.log(`Player ${uid} disconnected.`);

            // Remove socket from sockets object
            this.messageHandler.handleStopGlobalChat(this.sockets[uid]);
            this.messageHandler.handleRemoveFriendlyBattleChallenge(this.sockets[uid]);
            delete this.sockets[uid];
        }
    }


    async handleAnotherPlayerConnect(uid){
        if (this.sockets[uid]) {
            // Notify the already connected player
            this.sockets[uid].send(JSON.stringify({ type: "anotherPlayerConnected", message: "Another player connected with the same ID" }));
            //console.log(`Player ${uid} disconnected because another player connected with the same ID at diffrent instance.`);

            const currentWs = this.sockets[uid];
            // Manually run cleanup for the old WebSocket
            await this.disconnectPlayer(uid);
            currentWs.close();
        }
    }


}

module.exports = WebSocketHandler;
