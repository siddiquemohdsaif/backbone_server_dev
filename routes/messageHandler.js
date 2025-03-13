const GlobalChatHandler = require('../GlobalChatHandler');
const FirestoreHandler = require('../Util/FirestoreHandler');
const ClanMessageHandler = require('../Util/ClanMessageHandler');
const FriendlyBattleHandler = require('../Util/FriendlyBattleHandler');
const RedisHandler = require('../RedisHandler');
const FirestoreManager = require('../Firestore/FirestoreManager');
const { getInitialGamePosition, initializeGameInGameServer,getMapNameByMapId } = require('../Util/GameInitiator');
const axios = require('axios');
const AppConfiguration_v_3_2_1 = require('../Util/StaticDocument/GameInfo/AppConfiguration_v_3_2_1');
const GameAnalytics = require('../Util/GameAnalytics')
let userAdsShownInfo = {};
let userIAPHistoryInfo = {};

class MessageHandler {

    /**
     * constructor
     * @param {RedisHandler} redisHandler - websocket server
    */
    constructor(redisHandler) {
        this.redisHandler = redisHandler;
        this.scheduleDailyAnalyticsUpdate();
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
    
    async updateGameAnalytics() {
        const userAdsShownAvg = {};
        const userIAPHistoryAvg = {};
    
        // Check if userAdsShownInfo is not empty before processing
        if (Object.keys(userAdsShownInfo).length > 0) {
            await this.calculateAverages(userAdsShownInfo, userAdsShownAvg);
            await GameAnalytics.addUserAdsShown(userAdsShownAvg);
        } else {
            console.log("No user ad data to update.");
        }
    
        // Check if userIAPHistoryInfo is not empty before processing
        if (Object.keys(userIAPHistoryInfo).length > 0) {
            await this.calculateAverages(userIAPHistoryInfo, userIAPHistoryAvg);
            await GameAnalytics.addUserIAPHistory(userIAPHistoryAvg);
        } else {
            console.log("No user IAP data to update.");
        }
    
        // Reset the original data objects
        userAdsShownInfo = {};
        userIAPHistoryInfo = {};
    }
    
    
    async calculateAverages  (source, target)  {
        for (const key in source) {
            const count = source[key].count;
            const userCount = source[key].users.size; // Unique users
    
            target[key] = {
                shown: count,
                users: userCount,
                Avg: userCount > 0 ? (count / userCount) : 0
            };
        }
    }

    async handleMessage(ws, data, uid, cid, userName, leagueIcon, isPremiumMember) {
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

        switch (messageData.type) {
            case "startGlobalChat":
                this.handleStartGlobalChat(ws, uid);
                break;

            case "sendGlobalChatMessage":
                if (typeof messageData.text === 'string' && messageData.text.length <= 200) {
                    this.handleSendGlobalChatMessage(ws, messageData.text, messageData);
                }
                break;

            case "stopGlobalChat":
                this.handleStopGlobalChat(ws);
                break;

            case "reportUser":
                this.handleReportUser(ws, messageData.uid);
                break;

            case "sendClanBroadcastMessage":
                if (typeof messageData.text === 'string' && messageData.text.length <= 200) {
                    await this.handleSendClanBroadcastMessage(uid, cid, userName, leagueIcon, isPremiumMember, messageData.text);
                }
                break;

            case "sendSinglePlayerMessage":
                if (typeof messageData.text === 'string' && messageData.text.length <= 200 && typeof messageData.receiverUid === 'string') {
                    await this.handleSendSinglePlayerMessage(messageData.text, messageData.receiverUid);
                }
                break;

            case "sendFriendlyBattle":
                this.handleSendFriendlyBattle(ws, uid, userName, leagueIcon, isPremiumMember, cid);
                break;

            case "cancelFriendlyBattle":
                this.handleRemoveFriendlyBattleChallenge(ws);
                break;

            case "acceptFriendlyBattle":
                this.handleAcceptFriendlyBattle(messageData.messageId, cid, uid);
                break;

            case "refreshTime"://sent time sync          
                ws.send(JSON.stringify({ type: "timeSync", currentTime: Date.now() }));
                break;

            case "sendChallenge":
                this.handleSendChallange(uid, messageData.challengeUid, messageData.mapId);
                break;

            case "cancelChallenge":
                this.handleCancelChallange(uid);
                break;

            case "acceptChallenge":         
                this.handleAcceptChallange(uid, messageData.challengeUid);
                break;

            case "sendAdsShownMessage":
                this.handleAdsShownMessage(messageData.UID,messageData.adsType);
                break;

            case "sendIAPMessage":
                this.handleIAPHistoryMessage(messageData.UID,messageData.IAPType);
                break;

            default:
                // No action for other types
                break;
        }
    }

    handleAdsShownMessage(UID, adsType) {
        if (!userAdsShownInfo[adsType]) {
            userAdsShownInfo[adsType] = { count: 0, users: new Set() };
        }
        
        userAdsShownInfo[adsType].count += 1;
        userAdsShownInfo[adsType].users.add(UID);
    
        console.log("userAdsShownInfo", userAdsShownInfo);
    }
    
    handleIAPHistoryMessage(UID, IAPType) {
        if (!userIAPHistoryInfo[IAPType]) {
            userIAPHistoryInfo[IAPType] = { count: 0, users: new Set() };
        }
        
        userIAPHistoryInfo[IAPType].count += 1;
        userIAPHistoryInfo[IAPType].users.add(UID);
    
        console.log("userIAPHistoryInfo", userIAPHistoryInfo);
    }
    

    handleStartGlobalChat(ws, uid) {
        const response = GlobalChatHandler.startGlobalChat(ws, uid);
        ws.send(JSON.stringify(response));
    }

    handleSendGlobalChatMessage(ws, text, messageData) {

        //console.log(messageData);
        const senderId = messageData.senderId;
        const senderName_cache = messageData.senderName_cache;
        const senderLogo_cache = messageData.senderLogo_cache;
        const senderClanName_cache = messageData.senderClanName_cache;
        const senderClanLogo_cache = messageData.senderClanLogo_cache;
        const senderTrophy_cache = messageData.senderTrophy_cache;
        const isSenderPremium_cache = messageData.isSenderPremium_cache;



        if (typeof senderId === 'string' && senderId.length === 16 &&
            typeof senderName_cache === 'string' && senderName_cache.length <= 50 &&
            typeof senderLogo_cache === 'string' && senderLogo_cache.length <= 50 &&
            typeof senderClanName_cache === 'string' && senderClanName_cache.length <= 50 &&
            typeof senderClanLogo_cache === 'string' && senderClanLogo_cache.length <= 50 &&
            typeof senderTrophy_cache === 'number' && senderTrophy_cache <= 10000 &&
            typeof isSenderPremium_cache === 'boolean') {

            let timeStamp = Date.now();
            const message = {
                messageData: text, timeStamp, senderId, senderName_cache,
                senderLogo_cache, senderTrophy_cache, senderClanName_cache, senderClanLogo_cache, isSenderPremium_cache
            }

            GlobalChatHandler.sendGlobalChatMessage(ws, message);
        }
    }

    handleStopGlobalChat(ws) {
        GlobalChatHandler.stopGlobalChat(ws);
    }

    handleReportUser(ws, uid) {
        GlobalChatHandler.reportUser(ws, uid);
    }

    async handleSendClanBroadcastMessage(uid, cid, userName, leagueIcon, isPremiumMember, text) {
        const { clanMembers, senderPosition } = await FirestoreHandler.getClanMembers(cid, uid);
        const clanMessageCard = ClanMessageHandler.builtClanMessageCard(uid, userName, senderPosition, leagueIcon, isPremiumMember, text);
        this.manageClanChatHistory(cid, uid, clanMessageCard);
        const ClanMessageObjectCard = {
            action: "ADD_CARD",
            messageData: JSON.stringify({
                messageId: clanMessageCard.timeStamp + "_" + uid,
                messageCard: JSON.stringify(clanMessageCard)
            })
        };
        const message = JSON.stringify({ uids: clanMembers, text: JSON.stringify(ClanMessageObjectCard) });
        await this.redisHandler.publish(this.redisHandler.CLAN_MESSAGE_BROADCAST_CHANNEL, message);
    }

    async manageClanChatHistory(cid, uid, clanMessageCard) {
        // Save message to clanMessagesHistory
        await FirestoreHandler.saveMessageToClanHistory(cid, uid, clanMessageCard);
        // Limit the clan message to 200 messages only
        await ClanMessageHandler.clanMessageSizeController(cid);
    }

    async handleSendSinglePlayerMessage(text, receiverUid) {
        const receiverInfo = await this.redisHandler.get(`player:${receiverUid}`);
        if (receiverInfo) {
            const receiver = JSON.parse(receiverInfo);
            const message = JSON.stringify({ uids: [receiverUid], text: text });
            await this.redisHandler.publish(receiver.instanceId, message);
        }
    }


    async handleSendMultiPlayerMessage(data, uidArray) {
        // 1. Get the list of receiverInfo from Redis in one go
        let receiverKeys = uidArray.map(uid => `player:${uid}`);
        let receiversInfoArray = await this.redisHandler.mget(...receiverKeys);
    
        // Filter out null or undefined values (i.e., players not present in Redis)
        let validReceivers = receiversInfoArray.filter(info => info !== null && info !== undefined);
    
        // 2. Group receivers by instanceId
        let groupedByInstanceId = {};
        for (let receiverInfo of validReceivers) {
            let receiver = JSON.parse(receiverInfo);
            if (!groupedByInstanceId[receiver.instanceId]) {
                groupedByInstanceId[receiver.instanceId] = [];
            }
            groupedByInstanceId[receiver.instanceId].push(receiver.uid);
        }
    
        // Convert the groupedByInstanceId object to an array of { instanceId, uids }
        let instanceIdArray = Object.keys(groupedByInstanceId).map(instanceId => ({
            instanceId: instanceId,
            uids: groupedByInstanceId[instanceId]
        }));
    
        // 3. Send to every instance with the list of uids connected to it
        for (let instance of instanceIdArray) {
            const message = JSON.stringify({ uids: instance.uids, text: data });
            await this.redisHandler.publish(instance.instanceId, message);
        }
    }


    async handleSendFriendlyBattle(ws, uid, userName, leagueIcon, isPremiumMember, cid) {

        if (!ws.FriendlyBattleChallengeCard) {
            const { clanMembers, senderPosition } = await FirestoreHandler.getClanMembers(cid, uid);

            const friendlyBattleChallengeCard = {
                cardType: "FriendlyBattle",
                type: "FriendlyBattle",
                senderId: uid,
                senderName: userName,
                senderPosition: senderPosition,
                senderLogo: leagueIcon,
                cid: cid,
                isSenderPremium : isPremiumMember,
                timeStamp: Date.now()
            };

            ws.FriendlyBattleChallengeCard = friendlyBattleChallengeCard;

            this.manageClanChatHistory(cid, uid, friendlyBattleChallengeCard);
            const ClanMessageObjectCard = {
                action: "ADD_CARD",
                messageData: JSON.stringify({
                    messageId: friendlyBattleChallengeCard.timeStamp + "_" + uid,
                    messageCard: JSON.stringify(friendlyBattleChallengeCard)
                })
            };
            const message = JSON.stringify({ uids: clanMembers, text: JSON.stringify(ClanMessageObjectCard) });
            await this.redisHandler.publish(this.redisHandler.CLAN_MESSAGE_BROADCAST_CHANNEL, message);
        }

    }

    async handleRemoveFriendlyBattleChallenge(ws) {
        const friendlyBattleChallengeCard = ws.FriendlyBattleChallengeCard;
        if (friendlyBattleChallengeCard) {

            delete ws.FriendlyBattleChallengeCard;

            const messageId = friendlyBattleChallengeCard.timeStamp + "_" + friendlyBattleChallengeCard.senderId;
            const result = await this.removeFriendlyBattleChallengeCardFromClanMessage(friendlyBattleChallengeCard.cid, messageId);
            //console.log(result);
            if (result.acknowledged && result.modifiedCount === 1 && result.matchedCount === 1) {
                return true;
            } else {
                return false;
            }

        }
        return false;
    }
    

    async removeFriendlyBattleChallengeCardFromClanMessage(clanId, messageId) {
        //console.log("clanId:" + clanId + "messageId:" + messageId);
        const actionMessage = { action: "REMOVE_CARD", messageData: messageId };
        const { clanMembers } = await FirestoreHandler.getClanMembers(clanId);
        const actionMessageStr = JSON.stringify({ uids: clanMembers, text: JSON.stringify(actionMessage) });
        this.redisHandler.publish(this.redisHandler.CLAN_MESSAGE_BROADCAST_CHANNEL, actionMessageStr);
        return await FirestoreManager.getInstance().deleteField("ClanMsg", "/", clanId, messageId);
    }

    async handleAcceptFriendlyBattle(messageId, clanId, uid) {
        const friendlyBattleGameInfo = await FriendlyBattleHandler.acceptFriendlyBattleAndgetFriendlyGameInfo(messageId, clanId, uid , this.redisHandler);
        if (friendlyBattleGameInfo) {

            //initialize game in game server
            const isInitialize = await initializeGameInGameServer(friendlyBattleGameInfo.gameID, friendlyBattleGameInfo.gameState, friendlyBattleGameInfo.IP);
            if (isInitialize){
                const actionMessage = { action: "FRIENDLY_BATTLE", messageData: JSON.stringify(friendlyBattleGameInfo) };
                //console.log(friendlyBattleGameInfo);
                this.handleSendMultiPlayerMessage(JSON.stringify(actionMessage), [friendlyBattleGameInfo.UID1, friendlyBattleGameInfo.UID2]);
            }else{
                //console.log("error failed to initialize Game in GameServer.");
            }
           
        }
    }

    async sendPlayerNotification (senderName,challengeUid,mapId,senderAvatar,senderFrame)  {
        let icon = senderAvatar;
        const appConfig = await AppConfiguration_v_3_2_1.get();
        if (icon.startsWith("https://graph.facebook.com")) {
            icon = icon.replace("$", appConfig.accessToken);
        }
        const body = {
            type: 11,
            text: `${senderName} have sent you Friendly Challenge in ${getMapNameByMapId(mapId)}.`,
            icon: icon,
            frame: senderFrame,
            app_open:false,
        }
        const title = "Friendly Challenge";
        const receiverUID = challengeUid;

        const data = { body,title,receiverUID };
    
        try {
            const response = await axios.post('https://function.cloudsw3.com/cc-app-api/backBoneServer/pushNotification/sendMsgToPlayer', data);
            //console.log(response.data);
        } catch (error) {
            console.error('Error calling makeResult API:', error);
            throw new Error("error :" + error.message);
        }
    }

    async handleSendChallange(uid, challengeUid, mapId) {
        if(challengeUid && (mapId >= 0 && mapId <= 3)){

            try{

                console.log({uid, challengeUid , mapId});
                //register challenge of firestore via doc update
                const result = await FirestoreHandler.registerChallenge(uid, challengeUid, mapId);
                               
                const senderInfo = await FirestoreHandler.getUserInfo(uid);
                this.sendPlayerNotification(senderInfo.userName,challengeUid,mapId,senderInfo.userPicture.avatar,senderInfo.userPicture.frame);

                //call onClallengeReceive
                const challengeObject = {action : "CHALLENGE_RECEIVE", messageData : {uid , mapId}};
                const receiverInfo = await this.redisHandler.get(`player:${challengeUid}`);
                if (receiverInfo) {
                    const receiver = JSON.parse(receiverInfo);
                    const message = JSON.stringify({ uids: [challengeUid], text: JSON.stringify(challengeObject) });
                    await this.redisHandler.publish(receiver.instanceId, message);
                }

            }catch(e){
                console.error(e);
            }
        
        }
    }

    async handleCancelChallange(uid) {
        try{
            //remove all challenge of firestore via doc delete
            const result = await FirestoreHandler.removeChallenge(uid);
        }catch(e){
            //ignore
        }
    }

    async handleAcceptChallange(uid, challengeUid){

        try{

            //acceptChallenge
            const result = await FirestoreHandler.acceptChallenge(uid, challengeUid);

            if(result.ok){
                //successfully accepted challenge
                const mapId = result.mapId;

                //call startClallenge game
                const challengeGameInfo = await FriendlyBattleHandler.initChallengeGame(challengeUid, uid, mapId);
                if (challengeGameInfo) {

                    //initialize game in game server
                    const isInitialize = await initializeGameInGameServer(challengeGameInfo.gameID, challengeGameInfo.gameState, challengeGameInfo.IP);
                    if (isInitialize){
                        const actionMessage = { action: "CHALLENGE_GAME_START", messageData: JSON.stringify(challengeGameInfo) };
                        //console.log(friendlyBattleGameInfo);
                        this.handleSendMultiPlayerMessage(JSON.stringify(actionMessage), [challengeGameInfo.UID1, challengeGameInfo.UID2]);
                    }else{
                        //console.log("error failed to initialize Game in GameServer.");
                    }
                }
            }

        }catch(e){
            console.error(e);
        }

    }


}

module.exports = MessageHandler;